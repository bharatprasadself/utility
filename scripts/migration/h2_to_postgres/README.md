# H2 ➜ PostgreSQL Migration (Render)

This guide explains how to export data from the app's H2 file database and import it into your Render PostgreSQL database using the SQL scripts in this folder.

Contents
- h2-export.sql – exports each table to CSV files
- postgres-import.sql – imports those CSVs into Postgres, truncates target tables first, and resets sequences

Important
- This operation is destructive on the Postgres side (TRUNCATE). Do it only when you intend to replace existing data.
- Put the app in maintenance (or stop/restart as needed) to avoid writing during migration.

## 0) Paths on Render
- Project root: `/opt/render/project/src`
- H2 DB file: `/opt/render/project/src/data/utilitydb` (as configured in `application-prod-h2.properties`)
- Exported CSVs: `/opt/render/project/src/data/migration/h2_to_postgres/exports`
- Scripts in repo: `/opt/render/project/src/scripts/migration/h2_to_postgres`

## 1) Export from H2 (on Render)
You need the H2 engine to run the export SQL. The simplest is to download the H2 tools JAR and run RunScript.

1. Open a Render Shell for the service (or SSH if you use a private worker).
2. Stop the app temporarily if it holds a file lock on H2 (or switch to a shell while the app is not actively writing).
3. Ensure export folder exists:

```bash
mkdir -p /opt/render/project/src/data/migration/h2_to_postgres/exports
```

4. Download the H2 JAR and run the export script:

```bash
curl -L -o /tmp/h2.jar https://repo1.maven.org/maven2/com/h2database/h2/2.2.224/h2-2.2.224.jar
java -cp /tmp/h2.jar org.h2.tools.RunScript \
  -url "jdbc:h2:file:/opt/render/project/src/data/utilitydb;DB_CLOSE_DELAY=-1" \
  -user sa \
  -password "" \
  -script "/opt/render/project/src/scripts/migration/h2_to_postgres/h2-export.sql"
```

- CSVs will appear in: `/opt/render/project/src/data/migration/h2_to_postgres/exports`

Troubleshooting
- If you see file lock errors, stop the app service briefly and re-run.
- Verify that the `exports` directory contains CSVs with headers.

## 2) Import into Render PostgreSQL
You can run the import from:
- Your local machine (recommended): `psql` connects to Render Postgres over the Internet and reads CSVs from your local filesystem.
- The Render Shell: `psql` reads CSVs from the server filesystem. Ensure the files are present in the `exports` directory there.

### Option A: Run psql locally (CSV files on your machine)
Copy the CSVs down first (via scp, rsync, or manually download from your server) into your local repo at `data/migration/h2_to_postgres/exports`. Then run:

```bat
:: Windows cmd (set your values)
set PGPASSWORD=<PASSWORD>
psql -h <HOST> -p <PORT> -U <USER> -d <DB> -f scripts/migration/h2_to_postgres/postgres-import.sql
```

```bash
# macOS/Linux
export PGPASSWORD=<PASSWORD>
psql -h <HOST> -p <PORT> -U <USER> -d <DB> -f scripts/migration/h2_to_postgres/postgres-import.sql
```

The script will:
- TRUNCATE target tables in FK-safe order
- `\copy` CSVs into each table
- Reset identity sequences to `MAX(id)+1`

### Option B: Run psql in Render Shell (CSV files on server)
Make sure the exported CSVs exist on the server under `/opt/render/project/src/data/migration/h2_to_postgres/exports` and run:

```bash
export PGPASSWORD=<PASSWORD>
psql -h <HOST> -p <PORT> -U <USER> -d <DB> -f /opt/render/project/src/scripts/migration/h2_to_postgres/postgres-import.sql
```

Note
- The script uses `\copy` which reads files from the client side (the machine running psql). When you run psql inside the Render Shell, the "client" is the server, so it will read from the server’s `data/.../exports` path.

## 3) Verify and switch
- Optionally uncomment the verification block at the end of `postgres-import.sql` to print counts.
- Switch the app to use the Postgres profile (`SPRING_PROFILES_ACTIVE=prod`) and provide datasource envs on Render.
- Start the app and sanity-check the UI and APIs.

## Safety checklist
- [ ] Back up your H2 files (copy `/opt/render/project/src/data/utilitydb*`) before migration
- [ ] Stop app or ensure no writes during export
- [ ] Confirm CSVs look correct (headers, row counts)
- [ ] Confirm `postgres-import.sql` TRUNCATE behavior is acceptable
- [ ] Ensure Postgres credentials are correct; test `psql` connection first

## Rollback
If something goes wrong, you can:
- Re-run the import with corrected CSVs
- Restore from a Postgres backup/snapshot if you took one before migration
- Switch back to the H2 profile temporarily
