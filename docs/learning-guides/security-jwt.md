**Security — Spring Security + JWT**

- **Why it’s used:** Protect endpoints, authenticate users, and issue/verify stateless JWT tokens.

- **Core concepts to learn:**
  - Spring Security filter chain and configuration
  - `UserDetailsService` and authentication managers
  - JWT structure, signing, verification (`jjwt` library)
  - Securing endpoints and role-based access
  - Token expiration, refresh strategies

- **Hands-on micro-tasks:**
  1. Find the security configuration class and trace how requests are authorized.
  2. Implement a minimal JWT utility that issues a token for a hard-coded user.
  3. Protect a new endpoint to require an `ADMIN` role and validate with an integration test.

- **Files to inspect:**
  - [pom.xml](pom.xml)
  - Search for `Security` classes under `src/main/java` (look for `security` package)

- **Recommended resources:**
  - Spring Security: https://spring.io/projects/spring-security
  - JWT: https://jwt.io/introduction/
  - `jjwt` docs: https://github.com/jwtk/jjwt

- **Quick checks:**

```bash
# run tests that cover security
./mvnw test -Dtest=*Security*
```