# ---------- STAGE 1: build with Maven (has JDK + maven) ----------
FROM maven:3.9.4-eclipse-temurin-21 AS build

WORKDIR /workspace

# copy only what is needed to leverage Docker cache
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# If you have a frontend in a subfolder that needs building (optional)
# COPY frontend/package.json frontend/package-lock.json ./frontend/
# RUN pushd frontend && npm ci && npm run build && popd

# copy the rest of the project
COPY src ./src

# ensure the wrapper is executable and build
RUN chmod +x ./mvnw
RUN ./mvnw -B -DskipTests package

# ---------- STAGE 2: runtime image (slim JRE) ----------
FROM eclipse-temurin:21-jre

ARG JAR_NAME
# If you don't set JAR_NAME, copy the first jar found in target
WORKDIR /app

# copy the built jar from the build stage
# This assumes standard maven target/*.jar output (spring-boot fat jar)
COPY --from=build /workspace/target/*.jar /app/app.jar

# Create a directory for H2 database files
RUN mkdir -p /app/data

# Create a volume mount point for H2 database
VOLUME /app/data

# Expose the common Spring Boot port (change if needed)
EXPOSE 8080

# Set Spring profile and JVM options
ENV SPRING_PROFILES_ACTIVE="prod-h2"
ENV JAVA_OPTS="-Xms256m -Xmx512m -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
