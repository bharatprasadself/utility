**Backend — Spring Boot (Web, Data-JPA, Security, Actuator)**

- **Why it’s used:** Hosts the REST API, handles security, persistence, profiles, and background tasks.

- **Core concepts to learn:**
  - Spring Boot starters and auto-configuration
  - `@RestController`, request mapping, DTOs
  - Service layer patterns and transactions
  - Spring Data JPA: `Entity`, `Repository`, `@Transactional`
  - Spring Profiles and `application-*.properties`
  - Actuator endpoints and health checks
  - Testing with `@SpringBootTest` and `@WebMvcTest`

- **Hands-on micro-tasks:**
  1. Add a new simple GET endpoint returning "pong" under `/api/ping`.
  2. Add a small JPA entity (`Sample`) + repository + migration SQL and expose a CRUD endpoint.
  3. Write a unit test for the service layer using Mockito and an integration test with `@SpringBootTest`.

- **Files to inspect:**
  - [pom.xml](pom.xml)
  - [src/main/java/com/utilityzone/UtilityApplication.java](src/main/java/com/utilityzone/UtilityApplication.java)
  - [src/main/resources/application.properties](src/main/resources/application.properties)

- **Recommended resources:**
  - Official: https://spring.io/projects/spring-boot
  - Guides: https://spring.io/guides/gs/rest-service, https://spring.io/guides/gs/accessing-data-jpa
  - Book/Tutorial: Baeldung Spring Boot tutorials

- **Quick checks:**

```bash
# build (skip tests for speed)
./mvnw -DskipTests package
# run locally
java -jar target/*.jar
# run with profile
SPRING_PROFILES_ACTIVE=prod-h2 ./mvnw spring-boot:run
```
