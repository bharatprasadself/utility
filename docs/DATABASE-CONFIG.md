# Database and Security Configuration in Utility App

This document explains how to use and switch between different database configurations in the Utility application, as well as how to configure security settings.

## Database Types

The application supports two database types:

1. **PostgreSQL** - Default database for production use
2. **H2 File-based** - Alternative database that stores data in a file

## How to Switch Databases

### Using Configuration Files

The database type is controlled by the `utility.database.type` property in the application properties.

- For PostgreSQL: `utility.database.type=postgresql`
- For H2 File-based: `utility.database.type=h2`

You can set this property in:
- `application.properties` for the default configuration
- `application-prod.properties` for PostgreSQL in production
- `application-prod-h2.properties` for H2 in production

### Using Command Line

When running the application, you can specify the database type using:

```
java -jar utility-1.2.0-SNAPSHOT.jar --utility.database.type=h2
```

Or:

```
java -jar utility-1.2.0-SNAPSHOT.jar --utility.database.type=postgresql
```

### Using Application Manager

For convenience, a unified Application Manager utility is provided to handle all application operations:

- Windows: `app-manager.bat`
- Linux/Mac: `./app-manager.sh`

The Application Manager provides a menu with the following options:

1. Switch to H2 file-based database
2. Switch to PostgreSQL database
3. Reset H2 database (delete files)
4. Set H2 database password
5. Configure JWT Settings
6. View Current Configuration
7. Start application with current config
8. Exit

This single utility replaces all the individual scripts, making it easier to manage your database configuration and application settings.

## Security Configuration

Security settings can be configured through the Application Manager utility (options 5 and 6).

#### JWT Configuration

The application uses JWT (JSON Web Tokens) for authentication. Through the Application Configuration utility, you can:

- Set the JWT secret key (recommended: at least 32 characters)
- Configure the expiration time (default is 24 hours = 86400000 ms)

**Important:** Changing the JWT secret will invalidate all existing user sessions.

## Database Configuration Details

### PostgreSQL Configuration

The PostgreSQL configuration uses these properties:
- URL: `${spring.datasource.url}`
- Username: `${spring.datasource.username}`
- Password: `${spring.datasource.password}`
- Driver: `${spring.datasource.driver-class-name}`

### H2 File-based Configuration

The H2 configuration uses these properties:
- URL: `${h2.datasource.url}` (defaults to `jdbc:h2:file:./data/utilitydb;AUTO_SERVER=TRUE`)
- Username: `${h2.datasource.username}` (defaults to `sa`)
- Password: `${h2.datasource.password}` (defaults to empty)
- Driver: `org.h2.Driver`

> **Note:** The H2 database URL uses the `AUTO_SERVER=TRUE` parameter to enable multiple concurrent connections.
> In older versions, the `DB_CLOSE_ON_EXIT=FALSE` parameter was also used, but combining both parameters is
> not supported in H2 version 2.2.4 and later.

## Testing

For testing, an in-memory H2 database is used with the `test` profile. This ensures tests run quickly and don't affect any production data.

## Troubleshooting

If you encounter database connection issues:

1. Verify the correct database type is selected in your properties
2. Check the application logs for database connection messages
3. Ensure the database service is running (for PostgreSQL)
4. Check file permissions (for H2 file-based database)
5. Verify the data directory exists (for H2 file-based database)

### Common Error Messages

#### Security Configuration Issues

**Error: Error creating bean with name 'jwtProperties': Could not bind properties to 'JwtProperties'**

This error occurs when the JWT properties are missing from the configuration. To fix this:

1. Make sure the following properties are defined in your active profile:
   ```
   app.jwt.secret=yourSecretKeyHere
   app.jwt.expiration=86400000
   ```
2. Run the `set-jwt-config.bat` or `set-jwt-config.sh` script to configure these properties
3. Restart the application after making changes

#### H2 Database Configuration Issues

**Error: Feature not supported: "AUTO_SERVER=TRUE && DB_CLOSE_ON_EXIT=FALSE"**

This error occurs when both the `AUTO_SERVER=TRUE` and `DB_CLOSE_ON_EXIT=FALSE` parameters are used together in the H2 URL. In newer versions of H2 (2.2.0+), these parameters cannot be used together. The solution is to use only `AUTO_SERVER=TRUE`:

```
# Correct format
jdbc:h2:file:./data/utilitydb;AUTO_SERVER=TRUE

# Incorrect format
jdbc:h2:file:./data/utilitydb;AUTO_SERVER=TRUE;DB_CLOSE_ON_EXIT=FALSE
```

**Error: Wrong user name or password [28000-224]**

This error occurs when the application is trying to connect to an existing H2 database with incorrect credentials. This can happen if:

1. The database was created with different credentials than the ones in the current configuration
2. The database file is corrupt or was created with an incompatible H2 version

Solutions:
- Use the `reset-h2-db.bat` or `reset-h2-db.sh` script to delete the existing database files
- Make sure the username and password in the configuration match the ones used to create the database
- Try specifying credentials explicitly: `--h2.datasource.username=sa --h2.datasource.password=`
