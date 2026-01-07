# SprintPulse Backend

API do SprintPulse, escrita em Spring Boot e persistida em MongoDB. Exponha dados de projetos e sprints para o frontend via REST.

## Requisitos
- Java 17
- Maven (opcional) ou Maven Wrapper (`./mvnw`)
- MongoDB local (ou via Docker)

## Setup rapido

### 1) Subir MongoDB (opcional)
```bash
docker compose -f docker-compose.yml up -d
```

### 2) Rodar a API
```bash
./mvnw spring-boot:run
```

API sobe em `http://localhost:3000`.

## Configuracao
Arquivo principal: `src/main/resources/application.yml`

Variaveis:
- `MONGODB_URI` (default: `mongodb://localhost:27017/sprint_planner`)
- `server.port` (default: `3000`)

## Endpoints
Base URL: `http://localhost:3000`

Projetos:
- `GET /projects`
- `GET /projects/{id}`
- `POST /projects`
- `PUT /projects/{id}`
- `DELETE /projects/{id}`

Sprints:
- `GET /projects/{projectId}/sprints`
- `POST /projects/{projectId}/sprints`
- `GET /sprints/{id}`
- `PUT /sprints/{id}/state`
- `DELETE /sprints/{id}`

## Scripts úteis
- `./mvnw spring-boot:run` — inicia a API
- `./mvnw clean install` — build do backend

## Estrutura relevante
- Main: `src/main/java/com/sprintplanner/backend/SprintPlannerBackendApplication.java`
- Controllers: `src/main/java/com/sprintplanner/backend/controller`
- Services: `src/main/java/com/sprintplanner/backend/service`
- Parsers: `src/main/java/com/sprintplanner/backend/parser`
- Domain: `src/main/java/com/sprintplanner/backend/domain`
- DTOs: `src/main/java/com/sprintplanner/backend/dto`

## Observacoes
- O frontend espera a API em `http://localhost:3000` quando `VITE_INTEGRATION_MODE=api`.
- Se o build falhar por versao do Java, confirme que o `JAVA_HOME` aponta para o JDK 17 antes de rodar o Maven.
