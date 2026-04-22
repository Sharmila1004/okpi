FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace

COPY pom.xml pom.xml
COPY okpi-kpi-service/pom.xml okpi-kpi-service/pom.xml
COPY okpi-kpi-service/src okpi-kpi-service/src

RUN mvn -pl okpi-kpi-service -am clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /workspace/okpi-kpi-service/target/*.jar app.jar

EXPOSE 8084

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
