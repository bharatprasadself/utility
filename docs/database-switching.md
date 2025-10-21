# Switching Between Databases in Production

The application supports both PostgreSQL and H2 file-based database in production. This allows for flexibility in deployment scenarios.

## Configuration

The database type is controlled by the `utility.database.type` property which can be set to:
- `postgresql` - Uses PostgreSQL database
- `h2` - Uses H2 file-based database

## Switching Methods

### Method 1: Using Environment Variables

Set the `DATABASE_TYPE` environment variable before starting the application:

```bash
# Windows
set DATABASE_TYPE=h2
java -jar utility-1.2.0-SNAPSHOT.jar

# Linux/Mac
export DATABASE_TYPE=h2
java -jar utility-1.2.0-SNAPSHOT.jar
```

### Method 2: Using Convenience Scripts

Use the provided switch scripts:

```bash
# Windows
switch_db.bat h2

# Linux/Mac
./switch_db.sh h2
```

### Method 3: Java System Property

Pass the database type as a system property:

```bash
java -Dutility.database.type=h2 -jar utility-1.2.0-SNAPSHOT.jar
```

## Important Notes

1. The H2 database file is stored in the `./data` directory
2. When switching database types, you may need to initialize data in the new database
3. Database schema is automatically created/updated with H2, but managed by SQL scripts with PostgreSQL
4. Restart the application after switching database types

## Verifying Active Database

Check the application logs at startup - you'll see a message indicating which database is being used:
- "Configuring H2 file-based database"
- "Configuring PostgreSQL database"