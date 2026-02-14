**Build & Tooling — Maven, mvnw, frontend scripts**

- **Why it’s used:** Maven builds the Java backend, `mvnw` ensures consistent Maven across machines; frontend has its own `npm`/Vite workflow.

- **Core concepts to learn:**
  - Maven lifecycle: `compile`, `test`, `package`, `install`
  - `spring-boot-maven-plugin` repackaging and running
  - Using `mvnw` wrapper vs local Maven
  - Frontend scripts in `frontend/package.json` (dev, build, test)

- **Hands-on micro-tasks:**
  1. Run `./mvnw -DskipTests package` and inspect `target/*.jar`.
  2. Modify `frontend/package.json` script and run a local build for the frontend.
  3. Add a small Maven profile that changes a property and run with `-P`.

- **Files to inspect:**
  - [pom.xml](pom.xml)
  - `mvnw`, `mvnw.cmd`
  - [frontend/package.json](frontend/package.json)

- **Recommended resources:**
  - Maven Getting Started: https://maven.apache.org/guides/getting-started/
  - Official `mvnw` docs and Spring Boot packaging docs

- **Quick checks:**

```bash
./mvnw -DskipTests package
ls target
cd frontend
npm ci
npm run build
```
