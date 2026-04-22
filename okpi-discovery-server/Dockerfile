FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace

COPY pom.xml pom.xml
COPY okpi-discovery-server/pom.xml okpi-discovery-server/pom.xml
COPY okpi-discovery-server/src okpi-discovery-server/src

RUN mvn -pl okpi-discovery-server -am clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /workspace/okpi-discovery-server/target/*.jar app.jar

EXPOSE 8761

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
