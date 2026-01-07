# SprintPulse (Sprint Planner)

SprintPulse e um sistema de planejamento e acompanhamento de sprints por projeto, com capacidade baseada em story points, calendario de trabalho, eventos, tarefas com dependencias e visualizacao em Gantt. O frontend suporta modo local ou integracao via API com o backend.

## Stack
- Frontend: React + Vite + TypeScript + Redux Toolkit + MUI.
- Backend: Spring Boot (Java 17) + MongoDB.

## Estrutura do repositorio
- `backend/` - API Spring Boot e persistencia em MongoDB.
- `frontend/` - SPA React (Vite) e regras de planejamento.

## Requisitos
- Java 17
- Node.js 18+
- Docker (opcional, para Mongo local)

## Como rodar (local)

### 1) Banco Mongo (opcional)
```bash
docker compose -f backend/docker-compose.yml up -d
```

### 2) Backend (API)
```bash
cd backend
./mvnw spring-boot:run
```

Backend sobe em `http://localhost:3000`.

Configuracao:
- `MONGODB_URI` (default: `mongodb://localhost:27017/sprint_planner`)
- `backend/src/main/resources/application.yml`
 
Se preferir Maven instalado globalmente, use `mvn` com Java 17.

### 3) Frontend (SPA)
```bash
cd frontend
npm install
npm run dev
```

Frontend sobe em `http://localhost:5173` (porta padrao do Vite).

## Integracao Frontend <-> Backend
Configure `frontend/.env.local`:
```bash
VITE_INTEGRATION_MODE=api
VITE_API_BASE_URL=http://localhost:3000
```

Valores:
- `VITE_INTEGRATION_MODE=api` usa a API.
- `VITE_INTEGRATION_MODE=local` usa localStorage.

## API (backend)
Base URL: `http://localhost:3000`

- `GET /projects`
- `GET /projects/{id}`
- `POST /projects`
- `PUT /projects/{id}`
- `DELETE /projects/{id}`
- `GET /projects/{projectId}/sprints`
- `POST /projects/{projectId}/sprints`
- `GET /sprints/{id}`
- `PUT /sprints/{id}/state`
- `DELETE /sprints/{id}`

## Rotas do frontend
- `/projects` — lista, cria, edita e arquiva projetos (seleciona o ativo).
- `/projects/:projectId/sprints` — sprints do projeto ativo, criacao e abertura de rascunhos.
- `/plan/:sprintId` — planejamento da sprint (status `editing`).
- `/acomp/:sprintId` — acompanhamento da sprint; permite finalizar (`closed`) ou reabrir (`followup`).

## Funcionalidades principais
- Gestao de projetos com status `draft`, `active` e `archived`.
- Planejamento completo de sprint: datas, calendario de trabalho, eventos e equipe.
- Calculo de capacidade por membro e consolidado do time.
- Agendamento de tarefas com dependencias e estrategias de priorizacao.
- Acompanhamento com dashboards e visao Gantt.

## Regras e calculos (frontend)
- **Dias uteis**: datas da sprint menos fins de semana (removiveis) e nao uteis manuais; suporta periodos de trabalho diarios customizados.
- **Eventos**: recorrentes descontam minutos em cada dia util; nao recorrentes so no dia correspondente; nunca negativam horas do dia.
- **Capacidade**: por membro = disponibilidade% x fatores (senioridade/maturidade) x horas uteis x `storyPointsPerHour`.
- **Agendamento**: duracao = `ceil(SP / storyPointsPerHour * 60)` minutos; respeita dependencias e capacidade diaria.
- **Estrategias**: `EDD`, `SPT`, `BLOCKERS` e `HYBRID`.
- **Gantt**: barra por tarefa, colorida por responsavel; clique abre edicao e recalcula ao alterar dados.

## Persistencia
- **Modo API**: projetos e sprints salvos no MongoDB.
- **Modo local**: biblioteca em localStorage (`scrum-capacity-library-v1`).
- Ciclo de vida da sprint: `editing` -> `followup` -> `closed`.

## Importacao / Exportacao
- Exporta o estado para JSON com versao `SprintPulse – v1.0`.
- Importacao substitui sprint, calendario, eventos, membros, tarefas e config.

Exemplo resumido:
```json
{
  "version": "SprintPulse – v1.0",
  "sprint": { "title": "", "startDate": "2025-01-01", "endDate": "2025-01-15" },
  "nonWorkingDaysManual": [],
  "nonWorkingDaysRemoved": [],
  "daySchedules": [],
  "events": [],
  "members": [],
  "tasks": [],
  "globalConfig": { "dailyWorkHours": 8, "storyPointsPerHour": 0.33, "countedMemberTypes": ["Desenvolvedor"] }
}
```

## Scripts

### Backend
- `./mvnw spring-boot:run`
- `./mvnw clean install`

### Frontend
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`

## Arquivos chave
- Frontend entrada e providers: `frontend/src/main.tsx`
- Rotas: `frontend/src/routes/AppRoutes.tsx`
- Biblioteca e hidratacao: `frontend/src/app/sprintLibrary.ts`, `frontend/src/app/sprintHydrator.ts`
- Regras de capacidade/agendamento: `frontend/src/domain/services/capacityService.ts`
- Telas: `frontend/src/pages/ProjectListPage.tsx`, `frontend/src/pages/SprintListPage.tsx`, `frontend/src/pages/PlanningPage.tsx`, `frontend/src/pages/FollowUpPage.tsx`
- Backend controllers: `backend/src/main/java/com/sprintplanner/backend/controller`
- Backend config: `backend/src/main/resources/application.yml`
