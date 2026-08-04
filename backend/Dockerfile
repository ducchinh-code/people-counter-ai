
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -g 1001 appuser && adduser -u 1001 -G appuser -s /sbin/nologin -D appuser
COPY --from=builder --chown=appuser:appuser /app/target/*.jar app.jar

USER appuser
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api-docs || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
