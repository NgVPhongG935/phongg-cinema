# Stage 1: Build
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run với cấu hình tối ưu RAM
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
# Giới hạn Heap RAM tối đa 380MB để không vượt quá trần 512MB của Render
ENTRYPOINT ["java", "-Xms128m", "-Xmx380m", "-XX:+UseSerialGC", "-jar", "app.jar"]
