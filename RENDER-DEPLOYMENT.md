# Deploying to Render with H2 Database

This guide provides instructions for deploying the Utility Zone application to [Render](https://render.com/) using an H2 file-based database for persistence.

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

### 2. Create a Web Service on Render

1. Log in to your [Render Dashboard](https://dashboard.render.com/)
2. Click **New** and select **Web Service**
3. Connect your GitHub/GitLab repository
4. Configure the service with the following settings:

   | Setting | Value |
   |---------|-------|
   | **Name** | `utility-zone` (or your preferred name) |
   | **Environment** | `Java` |
   | **Region** | Choose closest to your users |
   | **Branch** | `main` (or your deployment branch) |
   | **Build Command** | `./mvnw clean package -DskipTests` |
   | **Start Command** | `java -jar target/utility-1.2.0-SNAPSHOT.jar --spring.profiles.active=prod-h2` |
   
5. In the **Advanced** settings, add the following:
   - Add a persistent disk:
     - Click **Add Disk**
     - Mount Path: `/app/data`
     - Size: `1 GB` (adjust based on your needs)

6. Add the following environment variables:
   ```
   SPRING_PROFILES_ACTIVE=prod-h2
   utility.database.type=h2
   ```

   > **Note**: Setting these environment variables on Render overrides any values in your properties files, so there's no need to modify your local configuration files before deployment.

7. Click **Create Web Service**

### 3. First-time Database Initialization

After your service is deployed, you need to initialize the database:

1. From the Render dashboard, go to your service
2. Click the **Shell** tab
3. Run the following command to initialize the database:
   ```bash
   java -jar target/utility-1.2.0-SNAPSHOT.jar --spring.profiles.active=init
   ```
4. Wait for the initialization to complete
5. Restart your service from the Render dashboard

### 4. Configure Static File Serving for Frontend

To serve your React frontend from Render:

#### Option 1: Use a Static Site

1. Click **New** and select **Static Site**
2. Connect to your repository
3. Configure with:
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/dist`

#### Option 2: Serve from the Same Web Service

1. Before deployment, copy your frontend build to the Spring static resources:
   ```bash
   cd frontend
   npm run build
   cp -r dist/* ../src/main/resources/static/
   ```
2. Commit these changes and deploy

### 5. Verify Deployment

1. Once deployed, visit your Render URL to verify the application is running
2. Test key functionality to ensure database operations are working

### 6. Maintenance Considerations

#### Database Backups

Since H2 data is stored on a persistent disk, you should set up regular backups:

1. From the Render shell, you can create backups:
   ```bash
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

### H2 Database Connection Issues

If you experience database connection issues:

1. Check the Render logs for specific errors
2. Verify the persistent disk is mounted correctly
3. Ensure the application has write permissions to the `/app/data` directory
4. Try reinitializing the database if necessary

### Memory or Performance Issues

If your application is running slowly:

1. Consider upgrading your Render service plan
2. Check for memory leaks or inefficient queries
3. Monitor the service metrics in the Render dashboard

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Spring Boot Deployment Guide](https://render.com/docs/deploy-spring-boot)
- [Persistent Storage on Render](https://render.com/docs/disks)