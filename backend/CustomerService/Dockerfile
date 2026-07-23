FROM eclipse-temurin:21-jre-alpine
WORKDIR /src
COPY target/Customer-Service-*.jar Customer-Service.jar
EXPOSE 8084
ENTRYPOINT ["java", "-jar", "Customer-Service.jar"]