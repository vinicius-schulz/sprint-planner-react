# SprintPulse (Frontend)

Frontend do SprintPulse, construido com React + Vite + TypeScript. Para instrucoes do repo inteiro (backend + frontend), veja `README.md` na raiz.

## Requisitos
- Node.js 18+

## Setup rapido
```bash
npm install
npm run dev
```

## Integracao (API x Local)
O modo de integracao e controlado por variaveis de ambiente em `frontend/.env.local`:
```bash
VITE_INTEGRATION_MODE=api
VITE_API_BASE_URL=http://localhost:3000
```

Valores:
- `api` usa o backend (Spring Boot).
- `local` usa localStorage.

Se estiver em `api`, o backend precisa estar rodando.

## Rotas principais
- `/projects` — lista, cria, edita e arquiva projetos (seleciona o ativo).
- `/projects/:projectId/sprints` — sprints do projeto ativo, criacao e abertura de rascunhos.
- `/plan/:sprintId` — planejamento da sprint (status `editing`).
- `/acomp/:sprintId` — acompanhamento da sprint; permite finalizar (`closed`) ou reabrir (`followup`).

## Principais funcionalidades
- Gestao de projetos com status `draft`, `active` e `archived`.
- Planejamento completo de sprint: datas, calendario de trabalho, eventos e equipe.
- Calculo de capacidade por membro e consolidado do time.
- Agendamento de tarefas com dependencias e estrategias de priorizacao.
- Acompanhamento com dashboards e visao Gantt.

## Regras e calculos
- **Dias uteis**: datas da sprint menos fins de semana (removiveis) e nao uteis manuais; suporta periodos de trabalho diarios customizados.
- **Eventos**: recorrentes descontam minutos em cada dia util; nao recorrentes so no dia correspondente; nunca negativam horas do dia.
- **Capacidade**: por membro = disponibilidade% x fatores (senioridade/maturidade) x horas uteis x `storyPointsPerHour`.
- **Agendamento**: duracao = `ceil(SP / storyPointsPerHour * 60)` minutos; respeita dependencias e capacidade diaria.
- **Estrategias**: `EDD`, `SPT`, `BLOCKERS` e `HYBRID`.
- **Gantt**: barra por tarefa, colorida por responsavel; clique abre edicao e recalcula ao alterar dados.

## Persistencia
- **Modo API**: projetos e sprints salvos no MongoDB (via backend).
- **Modo local**: biblioteca em localStorage (`scrum-capacity-library-v1`).
- Ciclo de vida da sprint: `editing` -> `followup` -> `closed`.

## Importacao/Exportacao
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
- `npm install` — instala dependencias.
- `npm run dev` — ambiente de desenvolvimento.
- `npm run build` — build de producao.
- `npm run preview` — preview do build.
- `npm run lint` — lint.

## Estrutura relevante
- Entrada da app e provedores: `src/main.tsx`
- Rotas centralizadas: `src/routes/AppRoutes.tsx`
- Layout e navegacao: `src/layout/Layout.tsx`, `src/layout/Header.tsx`
- Biblioteca e hidratacao: `src/app/sprintLibrary.ts`, `src/app/sprintHydrator.ts`, `src/app/useEnsureActiveSprint.ts`
- Dominio e regras: `src/domain/services`, `src/domain/types.ts`
- Telas: `src/pages/ProjectListPage.tsx`, `src/pages/SprintListPage.tsx`, `src/pages/PlanningPage.tsx`, `src/pages/FollowUpPage.tsx`
- Componentes-chave: `src/components/SummaryBoard/SummaryBoard.tsx`, `src/components/GanttTimelineFrappe/GanttTimelineFrappe.tsx`, `src/components/ReportExport/ReportExportButton.tsx`, `src/components/ProjectModal/ProjectModal.tsx`
