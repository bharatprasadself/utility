# Utility

## Production API subdomain setup (recommended)

This project is configured to use an API subdomain in production so the SPA and the backend are cleanly separated:

- Frontend (SPA): `https://utilityzone.in`
- Backend (API): `https://api.utilityzone.in`

In production, the frontend uses the environment variable `VITE_API_URL` to reach the API, and the backend exposes Actuator under `/api/actuator` with CORS allowed for the site.

### 1) Frontend env files

Create the following files in `frontend/` (or set these in your hosting provider’s build env):

- `frontend/.env.production`
  
	```env
	VITE_API_URL=https://api.utilityzone.in
	```

- `frontend/.env.development`
  
	```env
	# Leave empty to use Vite dev proxy for /api and /uploads
	VITE_API_URL=
	```

The Axios client reads `VITE_API_URL` in `frontend/src/services/axiosConfig.ts`. In dev it defaults to empty (`""`) to use the Vite proxy; in prod it defaults to `https://api.utilityzone.in` if the env var is not set.

### 2) Render — attach API custom domain

Attach `api.utilityzone.in` to your Render Web Service (backend):

1. Render Dashboard → your web service (utility-zone) → Settings → Custom Domains → Add `api.utilityzone.in`.
2. Follow Render’s DNS instructions (typically a CNAME from `api.utilityzone.in` to your Render service hostname).
3. Ensure the service is deployed with `SPRING_PROFILES_ACTIVE=prod-h2` (or `prod` if using Postgres).

### 3) Backend configuration already in place

- Actuator base path is set to `/api/actuator` in prod and prod-h2 profiles.
- Render health check path in `render.yaml` is `/api/actuator/health`.
- CORS allows:
	- `http://localhost:5173` (dev)
	- `https://utilityzone.in`
	- `https://www.utilityzone.in`

### 4) Sanity checks after deploy

- `https://api.utilityzone.in/api/actuator/health` → should return `UP`.
- The SPA (https://utilityzone.in) calls `https://api.utilityzone.in/api/...` in the browser Network tab (no CORS errors).
- Actuator cache diagnostics:
	- `https://api.utilityzone.in/api/actuator/caches`
	- `https://api.utilityzone.in/api/actuator/metrics/cache.gets?tag=cache:blogs&tag=result:hit`

### 5) Optional: static proxy (not recommended for prod)

If you absolutely must keep one domain only, configure your static host (Render Static Site or similar) to proxy `/api/*` to your backend. On a Render static site, include a `static.json` like:

```json
{
	"routes": [
		{ "src": "/api/(.*)", "dest": "https://api.utilityzone.in/api/$1" }
	]
}
```

However, the API subdomain approach above is more robust and future-proof.

## Newsletter (SMTP) setup

The Ebooks module supports collecting subscribers and sending newsletters via SMTP.

Backend endpoints:
- Public subscribe: `POST /api/ebooks/newsletter/subscribe` { email }
- Public unsubscribe: `GET /api/ebooks/newsletter/unsubscribe?token=...`
- Admin send: `POST /api/admin/ebooks/newsletter/send` { subject, htmlBody }

Configure SMTP via environment variables (Render → Environment):

```
SPRING_MAIL_HOST=smtp.yourprovider.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=your_smtp_username
SPRING_MAIL_PASSWORD=your_smtp_password
APP_MAIL_FROM=bharat.prasad@utilityzone.in
```

Notes:
- STARTTLS is enabled by default (port 587). Adjust `spring.mail.properties.mail.smtp.starttls.enable` if needed.
- Unsubscribe links are appended automatically to each email.
- Re-subscribing an unsubscribed email re-activates the subscription.
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
