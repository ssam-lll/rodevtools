# Etapa 1: Build con Gradle y JDK 17
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app

# Copiar archivos de configuración de Gradle
COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle ./

# Dar permisos de ejecución a gradlew
RUN chmod +x ./gradlew

# Descargar dependencias
RUN ./gradlew dependencies --no-daemon || true

# Copiar código fuente y compilar JAR
COPY src src
RUN ./gradlew bootJar -x test --no-daemon

# Etapa 2: Runtime ligero con JRE 17
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Crear usuario no root por seguridad
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copiar JAR generado desde la etapa de compilación
COPY --from=builder /app/build/libs/*.jar app.jar

USER appuser

# Exponer el puerto del backend
EXPOSE 8080

# Opciones de JVM optimizadas para máquinas con 1GB de RAM (Compute Engine e2-micro)
ENV JAVA_OPTS="-XX:+UseSerialGC -XX:MaxRAMPercentage=65.0 -Xms128m -Xmx512m -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
