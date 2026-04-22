FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace

COPY pom.xml pom.xml
COPY okpi-auth-service/pom.xml okpi-auth-service/pom.xml
COPY okpi-auth-service/src okpi-auth-service/src

RUN mvn -pl okpi-auth-service -am clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /workspace/okpi-auth-service/target/*.jar app.jar

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
