FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace

COPY pom.xml pom.xml
COPY okpi-api-gateway/pom.xml okpi-api-gateway/pom.xml
COPY okpi-api-gateway/src okpi-api-gateway/src

RUN mvn -pl okpi-api-gateway -am clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /workspace/okpi-api-gateway/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
