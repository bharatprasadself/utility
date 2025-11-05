# Deploying to Render with H2 Database

This guide provides instructions for deploying the Utility Zone application to [Render](https://render.com/) using an H2 file-based database for persistence.

> **Important**: This project includes a Dockerfile, which means Render will use Docker-based deployment instead of the standard Web Service deployment. This guide has been updated to reflect the Docker-specific deployment process.

> **Note**: If you encounter database initialization issues, see the [Database Initialization Troubleshooting](DB-INIT-TROUBLESHOOTING.md) guide.

> **JWT Authentication Errors**: If you see errors related to `jwtAuthenticationFilter` or `userRepository`, see the [JWT Authentication Errors](JWT-AUTH-ERRORS.md) guide for detailed solutions.

> **Static Resource Errors**: If you see "No static resource" errors in your logs, see the [Static Resource Errors](STATIC-RESOURCE-ERRORS.md) guide for solutions.

## Prerequisites

- A [Render](https://render.com/) account
- Git repository with your application code

## Configuration Steps

### 1. Prepare Your Application

Your application already has all the necessary configuration files for H2 database support. There's no need to modify any configuration files locally before deploying to Render. The profile and database type will be controlled entirely by environment variables on the Render platform.

Simply ensure your code is pushed to your Git repository:

```bash
# If you have any local changes to commit
git add .
git commit -m "Ready for Render deployment"
git push
```

### 2. Create a Web Service on Render with Docker

1. Log in to your [Render Dashboard](https://dashboard.render.com/)
2. Click **New** and select **Web Service**
3. Connect your GitHub/GitLab repository
4. Since your repository contains a Dockerfile, Render will automatically detect it and set the **Environment** to **Docker**
5. Configure the service with the following settings:

   | Setting | Value |
   |---------|-------|
   | **Name** | `utility-zone` (or your preferred name) |
   | **Environment** | `Docker` (auto-selected based on Dockerfile) |
   | **Region** | Choose closest to your users |
   | **Branch** | `main` (or your deployment branch) |
   
   > **Note**: When using Docker deployment, Render ignores the Build Command and Start Command fields, as these are defined in your Dockerfile.
   
6. In the **Advanced** settings, add the following:
   - Add a persistent disk:
     - Click **Add Disk**
     - Mount Path: `/app/data`
     - Size: `1 GB` (adjust based on your needs)

7. Add environment variables (optional):
   ```
   SPRING_PROFILES_ACTIVE=prod-h2  # Already set in Dockerfile but can be overridden
   utility.database.type=h2        # Already set in Dockerfile but can be overridden
   ```

   > **Note**: The Dockerfile already sets `SPRING_PROFILES_ACTIVE="prod-h2"`, but you can override it here if needed.

8. Click **Create Web Service**

### 3. First-time Database Initialization with Docker

Since we're using Docker deployment, initialization requires a different approach. Based on the error logs (JwtAuthenticationFilter and UserRepository errors), we need to modify our strategy:

1. For the first deployment, override the environment variables to bypass security and properly initialize the database:
   - Go to your service settings in the Render dashboard
   - Add/modify the following environment variables:
     ```
     SPRING_PROFILES_ACTIVE=prod-h2
     spring.sql.init.mode=always
     spring.jpa.hibernate.ddl-auto=create
     spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration
     ```
   - Click "Save Changes" and trigger a manual deploy
   
   > **Note**: We're using the prod-h2 profile instead of the init profile because the error logs indicate that the init profile may have security configuration issues.

2. Once the deployment completes, check the logs to ensure the database was initialized successfully. You should see messages about creating tables and possibly inserting initial data.

3. After initialization is complete, remove the initialization-specific environment variables:
   ```
   # Keep only this one (or remove it to use Dockerfile default)
   SPRING_PROFILES_ACTIVE=prod-h2
   
   # Remove these initialization-specific variables
   spring.sql.init.mode
   spring.jpa.hibernate.ddl-auto
   spring.autoconfigure.exclude
   ```

4. Click "Save Changes" and trigger another manual deploy to restart with the production profile

> **Note**: Since we're using Docker, you cannot directly modify the start command as it's defined in the Dockerfile's ENTRYPOINT instruction. Environment variables are the proper way to control the application behavior.

### 4. Configure Static File Serving for Frontend

To serve your React frontend from Render:

#### Option 1: Use a Static Site (Recommended)

1. Click **New** and select **Static Site**
2. Connect to your repository
3. Configure with:
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/dist`
4. Set environment variables:
   - `REACT_APP_API_URL`: The URL of your backend service

#### Option 2: Include Frontend in Docker Image

This option requires updating your Dockerfile to build and include the frontend assets:

1. Modify your Dockerfile to add frontend build steps:

   ```dockerfile
   # In the build stage, after Maven build
   # Install Node.js
   RUN apt-get update && apt-get install -y nodejs npm

   # Build frontend
   COPY frontend ./frontend
   WORKDIR /workspace/frontend
   RUN npm install && npm run build

   # Copy frontend build to static resources
   RUN mkdir -p /workspace/src/main/resources/static
   RUN cp -r dist/* /workspace/src/main/resources/static/

   # Then continue with the runtime stage as before
   ```

2. Add a controller to handle the root path:

   ```java
   @Controller
   public class HomeController {
       @GetMapping("/")
       public String home() {
           return "forward:/index.html";
       }
   }
   ```

3. Commit these changes and deploy

## Switching to PostgreSQL on Render (prod profile)

If you want to run the app on PostgreSQL instead of the H2 file DB, use the `prod` profile and provide your Render PostgreSQL credentials.

### Steps

1) Provision a PostgreSQL database on Render
- In the Render dashboard, create a new PostgreSQL instance and note its connection info (host, port, database, user, password, optional CA settings).

2) Set service environment variables on your Web Service
- Navigate to your backend Web Service → Environment → Add/Update variables:

```
SPRING_PROFILES_ACTIVE=prod

# Replace with your Render Postgres values:
SPRING_DATASOURCE_URL=jdbc:postgresql://<HOST>:<PORT>/<DB>
SPRING_DATASOURCE_USERNAME=<USER>
SPRING_DATASOURCE_PASSWORD=<PASSWORD>

# Optional tuning (defaults already set in application-prod.properties):
# spring.datasource.hikari.maximum-pool-size=5
# spring.datasource.hikari.minimum-idle=2
# spring.jpa.hibernate.ddl-auto=none
# spring.sql.init.mode=always

# Required for JWT security (prod)
# - Secret must be 32+ chars for HS256. Expiration is milliseconds.
APP_JWT_SECRET=<generate-a-strong-random-64-char-string>
APP_JWT_EXPIRATION=86400000
```

Notes
- The `prod` profile already targets PostgreSQL (`application-prod.properties`).
- Schema is applied via `src/main/resources/schema.sql` on startup (because `spring.sql.init.mode=always`). If your DB is already initialized, you can set `spring.sql.init.mode=never`.
- Keep your persistent disk mounted at `/app/data` for file uploads; it is unrelated to the database once you’re on Postgres.

3) Deploy and verify
- Deploy the service and watch logs for a successful Postgres connection and schema initialization.
- Health check: `GET https://<your-domain>/api/actuator/health`

JWT sanity check
- If startup fails with "Could not bind properties to 'JwtProperties' (prefix=app.jwt)", ensure both env vars above are set and valid.
- If you later see "The signing key's size is ..." errors, your secret is too short—use 32+ characters (64+ recommended).

Quick secret generator (PowerShell)
```powershell
$chars='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
-join ((1..64) | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })
```

4) (Optional) Migrate existing H2 data to Postgres
- Use the migration scripts committed in the repo:
   - `scripts/migration/h2_to_postgres/h2-export.sql` (export CSVs from H2)
   - `scripts/migration/h2_to_postgres/postgres-import.sql` (import CSVs into Postgres)
- See `scripts/migration/h2_to_postgres/README.md` for Render-specific, step-by-step instructions.

5) Rollback
- To revert to H2, set `SPRING_PROFILES_ACTIVE=prod-h2` and redeploy (data remains on your persistent disk at `/app/data`).

### 5. Verify Deployment

1. Once deployed, visit your Render URL to verify the application is running
2. If you get a "No static resource" error:
   - Check if you deployed the frontend as a separate static site
   - If yes, navigate to the specific frontend URL
   - If no, follow the guidance in [Static Resource Errors](STATIC-RESOURCE-ERRORS.md)
3. Test API endpoints directly (e.g., `/api/health` or whatever health endpoint your app provides)
4. Test key functionality to ensure database operations are working

### 6. Maintenance Considerations

#### Database Backups

Since H2 data is stored on a persistent disk, you should set up regular backups:

1. From the Render shell, you can create backups:
   ```bash
   # Navigate to the directory where you can access the data
   cd /app

   # Verify the data directory exists and contains database files
   ls -la data/
   
   # Compress the database files
   tar -czvf backup-$(date +%Y%m%d).tar.gz /app/data/
   
   # Download the backup (from your local machine using render-cli)
   render download-file <service-id> /app/backup-YYYYMMDD.tar.gz
   ```

2. Consider setting up a cron job or scheduled task for regular backups

#### Updating Your Application

To update your application:

1. Push changes to your repository
2. Render will automatically deploy the changes
3. Monitor the deployment logs in the Render dashboard

## Troubleshooting

### Bean Creation Errors During Initialization

If you see errors like the following during initialization:

```
Error creating bean with name 'jwtAuthenticationFilter'
Error creating bean with name 'userDetailsServiceImpl'
Cannot resolve reference to bean 'jpaSharedEM_entityManagerFactory'
```

This typically indicates that the application's JPA/database configuration isn't properly set up for the initialization phase. With Docker deployment, try these solutions:

1. **For JwtAuthenticationFilter/UserRepository errors**: The error you're seeing is related to Spring Security configuration. Try these environment variables:
   ```
   SPRING_PROFILES_ACTIVE=prod-h2
   spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration
   spring.sql.init.mode=always
   spring.jpa.hibernate.ddl-auto=create
   ```
   
   This temporarily disables Spring Security during initialization, which should prevent the JWT filter errors.

### Profile not switching to `prod` on Render

If you set environment variables to use the `prod` profile but still see `prod-h2` (or H2) in logs:

1) Check effective environment variables inside the running container
   - Open Render Shell and run:
     - `env | grep -E "SPRING_PROFILES_ACTIVE|SPRING_DATASOURCE|DATABASE_TYPE"`
   - Ensure there’s exactly one `SPRING_PROFILES_ACTIVE=prod` and it’s not overridden by a Secret Group or duplicate var with a different value.

2) Avoid pinning the profile in code
   - In `application.properties`, do not set `spring.profiles.active`. If you want a local default, use:
     - `spring.profiles.default=prod-h2`
   - This lets the Render env var `SPRING_PROFILES_ACTIVE=prod` cleanly take precedence.

3) Be mindful of Dockerfile defaults
   - The Dockerfile currently sets `ENV SPRING_PROFILES_ACTIVE="prod-h2"` as a default.
   - Render service-level env vars should override this at runtime, but if you prefer less ambiguity, remove that line from the Dockerfile and control the profile entirely via Render env.

4) Database type reads as H2
   - That usually means the app actually booted with `prod-h2`. Once the active profile is `prod`, the app will use PostgreSQL settings from `application-prod.properties` and your `SPRING_DATASOURCE_*` variables.

5) Verify after changes
   - Redeploy, then check logs for: `Active profiles: prod`.
   - Health endpoints: `GET /api/actuator/health` and (if exposed) `GET /api/actuator/env` to confirm the active profile and the datasource URL.

2. **Check Docker environment variables**: Make sure these environment variables are correctly picked up in the Docker container:
   - SSH into the container using Render Shell
   - Run `env | grep SPRING` to verify the environment variables are set

3. **Check data directory volume mounting**:
   ```bash
   # Verify the data directory exists and is writable
   ls -la /app
   ls -la /app/data
   mkdir -p /app/data
   chmod 777 /app/data  # Temporarily for troubleshooting
   ```

### H2 Database Connection Issues

If you experience database connection issues:

1. Check the Render logs for specific errors
2. Verify the persistent disk is mounted correctly:
   ```bash
   # In the Render Shell
   df -h  # Shows mounted disks
   ls -la /app/data  # Should show the database files
   ```
3. Ensure the application has write permissions to the `/app/data` directory:
   ```bash
   # Check permissions
   ls -la /app
   # If needed, fix permissions
   chmod 755 /app/data
   ```
4. Try reinitializing the database if necessary

### Memory or Performance Issues

If your application is running slowly:

1. Consider upgrading your Render service plan
2. Check for memory leaks or inefficient queries
3. Monitor the service metrics in the Render dashboard

## Understanding Docker Deployment on Render

### How Render Uses Your Dockerfile

When Render detects a Dockerfile in your repository, it uses a Docker-based deployment flow:

1. Render builds the Docker image using your Dockerfile
2. Any environment variables set in the Render dashboard are passed to the container at runtime
3. The persistent disk is mounted to the specified mount point
4. Render runs the container based on the ENTRYPOINT or CMD specified in your Dockerfile

### Key Points About Your Dockerfile

Your project's Dockerfile:

1. Uses a two-stage build process:
   - Stage 1: Builds the application with Maven
   - Stage 2: Creates a runtime image with just the JRE and the built JAR

2. Sets up H2 database configuration:
   - Creates `/app/data` directory
   - Defines a VOLUME for `/app/data` to enable persistent storage
   - Places the JAR file at `/app/app.jar` (not in `/app/target/`)

3. Sets default environment variables:
   ```
   SPRING_PROFILES_ACTIVE="prod-h2"
   JAVA_OPTS="-Xms256m -Xmx512m -Djava.security.egd=file:/dev/./urandom"
   ```

4. Uses an ENTRYPOINT that runs the JAR with the configured options:
   ```
   ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
   ```

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Render Docker Deployments](https://render.com/docs/docker)
- [Persistent Storage on Render](https://render.com/docs/disks)
