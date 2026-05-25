FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace

COPY . /workspace

RUN mvn -T1C -f pom.xml clean package -DskipTests -Dmaven.test.skip=true

FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /workspace/okpi-discovery-server/target/*.jar app.jar

EXPOSE 8761

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
