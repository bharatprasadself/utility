**Testing — Unit & Integration (JUnit, Spring Test, Vitest)**

- **Why it’s used:** Ensures correctness of business logic, controllers, and frontend components.

- **Core concepts to learn:**
  - Unit tests vs integration tests
  - `@SpringBootTest`, `@WebMvcTest`, slicing tests
  - Mocking with Mockito or Spring MockBeans
  - Frontend testing with Vitest and component tests

- **Hands-on micro-tasks:**
  1. Run the backend test suite and read a failing test in `target/surefire-reports` to understand failures.
  2. Add a unit test for a simple service method using Mockito.
  3. Add a small Vitest component test for a React component.

- **Files to inspect:**
  - `target/surefire-reports` for past test runs
  - Backend tests under `src/test/java`
  - Frontend tests (if any) under `frontend/src`

- **Recommended resources:**
  - JUnit 5: https://junit.org/junit5/docs/current/user-guide/
  - Spring testing: https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.testing
  - Vitest: https://vitest.dev/

- **Quick checks:**

```bash
# backend tests
./mvnw test
# frontend tests
cd frontend
npm ci
npm run test
```