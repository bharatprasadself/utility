**Database & Migrations — H2 (dev) and PostgreSQL (prod)**

- **Why it’s used:** H2 is used for fast local runs; Postgres is the production datastore. SQL migration scripts live under `data/` and `scripts/`.

- **Core concepts to learn:**
  - Relational schema design and indexes
  - JPA entity mapping and relationships
  - Differences between H2 and Postgres (types, functions)
  - Seed data and migration scripts
  - Import/export (H2 → Postgres) flow

- **Hands-on micro-tasks:**
  1. Inspect `data/migration` scripts and run an H2-powered profile locally to see seeded data.
  2. Add a simple SQL insert migration under `data/migration` and verify it appears after app startup.
  3. Convert a small H2-specific SQL snippet to Postgres-compatible SQL.

- **Files to inspect:**
  - [data/migration/master_template_insert.sql](data/migration/master_template_insert.sql)
  - [src/main/resources/application-prod-h2.properties](src/main/resources/application-prod-h2.properties)
  - [pom.xml](pom.xml) (database drivers)

- **Recommended resources:**
  - PostgreSQL docs: https://www.postgresql.org/docs/
  - H2 docs: https://www.h2database.com/html/main.html
  - JPA mappings: https://docs.jboss.org/hibernate/stable/annotations/reference/en/html/

- **Quick checks:**

```bash
# run app with H2 profile
SPRING_PROFILES_ACTIVE=prod-h2 ./mvnw spring-boot:run
# inspect H2 console (if enabled) or query DB files in ./data
```