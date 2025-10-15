# Utility Zone Application

## Overview
A Spring Boot + React application providing utility features such as file conversion, currency conversion, timezone conversion, and more.

---

## Prerequisites
- Java 21+
- Node.js 18+
- Maven 3.8+
- (Optional) PostgreSQL 14+ (for production with PostgreSQL profile)

## Database Options
The application supports both PostgreSQL and H2 file-based database for production use.
See [DATABASE-CONFIG.md](DATABASE-CONFIG.md) for details on how to switch between databases.

### Application Management

To manage the application, use the provided utility manager:

```bash
# Windows
utility-manager.bat  # Opens the utility manager menu

# Linux/Mac
./utility-manager.sh  # Opens the utility manager menu
```

This utility allows you to:
- Choose between local or Docker deployment
- Switch between database types (H2 or PostgreSQL)
- Initialize and reset databases
- Configure security settings
- Start, stop, and monitor the application

---

## Build Instructions

### 1. Backend (Spring Boot)
```
cd utility
mvn clean install
```

### 2. Frontend (React)
```
cd frontend
npm install
npm run build
```

---

## Running the Application

### Development Mode (H2 in-memory)
```
cd utility
mvn spring-boot:run
```

### Production Mode

#### 1. With PostgreSQL
- Ensure PostgreSQL is running and configured.
- Update `src/main/resources/application-prod.properties` with your DB credentials.
- Run:
```
java -jar target/utility-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

#### 2. With File-based H2 Database
- No external DB required. Data is stored in `data/utilitydb.mv.db`.
- Run:
```
java -jar target/utility-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod-h2
```

#### 3. Deploying to Render Cloud
- For detailed deployment instructions to Render using H2 database, see [RENDER-DEPLOYMENT.md](RENDER-DEPLOYMENT.md)
- A `render.yaml` file is included for easy deployment configuration


#### 3. First-time Schema/Data Initialization (Local & Production)
- Use the `init` profile the very first time you set up your database, both for local development and production:
```
java -jar target/utility-0.0.1-SNAPSHOT.jar --spring.profiles.active=init
```

- For Docker deployment, use Docker Compose for initialization:
```
# Initialize the database (first time)
docker-compose run init

# Start the application
docker-compose up -d
```

- After initialization, switch to your normal profile (e.g., `dev`, `prod`, or `prod-h2`) for regular use.

---

## Profiles Summary
- `init`: For first-time schema/data creation.
- `prod`: Production with PostgreSQL.
- `prod-h2`: Production with file-based H2 database.

---

## Environment Variables (Optional)
- `SERVER_PORT`: Override default port.
- `SPRING_PROFILES_ACTIVE`: Set active profile.

---

## Docker Deployment

### Option 1: Using the Utility Manager
```
# Windows
utility-manager.bat
# Then select: 2. Docker Deployment

# Linux/Mac
./utility-manager.sh
# Then select: 2. Docker Deployment
```

### Option 2: Using Docker Compose Directly
```
# For first-time initialization
docker-compose run init

# To start the application
docker-compose up -d
```

### 3. Database Persistence
- H2 database files are stored in the `./data` directory
- This directory is mounted as a volume in the Docker container
- Make regular backups of this directory to prevent data loss

---

## Notes
- H2 file-based DB is suitable for small/medium deployments. For large scale, use PostgreSQL.
- Monitor memory usage if running on low-resource servers (e.g., 512MB RAM).
- Frontend build output is in `frontend/dist` and should be served by a static file server or reverse-proxied.

---

## Troubleshooting
- For H2/Hibernate errors, ensure you are using the official H2 JAR from Maven Central.
- For currency conversion issues, check your internet connection and Frankfurter API status.

---

## License
Utility Zone
