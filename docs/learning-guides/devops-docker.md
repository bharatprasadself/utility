**DevOps — Docker & docker-compose**

- **Why it’s used:** Containerize the app for consistent local dev and deployments; `docker-compose` defines local services including an `init` job.

- **Core concepts to learn:**
  - Multi-stage Docker builds (build + runtime)
  - Volumes for persistent data (`/app/data`)
  - Environment variables and profiles
  - Using `docker-compose` for local workflows and initialization jobs

- **Hands-on micro-tasks:**
  1. Build the Docker image locally using the `Dockerfile` and run it.
  2. Start `docker-compose` and verify the app is reachable at `http://localhost:8080`.
  3. Run the `init` service and inspect data created under `./data`.

- **Files to inspect:**
  - [Dockerfile](Dockerfile)
  - [docker-compose.yml](docker-compose.yml)
  - [render.yaml](render.yaml) (deployment config)

- **Recommended resources:**
  - Docker docs: https://docs.docker.com/
  - Compose: https://docs.docker.com/compose/

- **Quick checks:**

```bash
# build and run with Docker
docker build -t utility-app .
docker run -p 8080:8080 -v $(pwd)/data:/app/data -e SPRING_PROFILES_ACTIVE=prod-h2 utility-app
# or use compose
docker-compose up --build
# run init job
docker-compose run init
```
