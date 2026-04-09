FROM maven:3.9.13-eclipse-temurin-25-alpine AS build

WORKDIR /workspace

COPY . .

RUN mvn -q package

FROM eclipse-temurin:25-jre-alpine

WORKDIR /app

COPY --from=build /workspace/target/saxon-xslt-service-0.0.1-SNAPSHOT.jar app.jar

ENV SERVER_PORT=80 \
    SERVER_SERVLET_CONTEXT_PATH=/

EXPOSE 80

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
