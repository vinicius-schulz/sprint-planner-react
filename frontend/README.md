# SprintPulse

SprintPulse e um sistema de planejamento e acompanhamento de sprints por projeto, com capacidade baseada em Story Points, calendario de trabalho, eventos, tarefas com dependencias e visualizacao em Gantt.

## Principais funcionalidades
- Gestao de projetos com status `draft`, `active` e `archived`.
- Planejamento completo de sprint: datas, calendario de trabalho, eventos e equipe.
- Calculo de capacidade por membro e consolidado do time.
- Agendamento de tarefas com dependencias e estrategias de priorizacao.
- Acompanhamento com dashboards e visao Gantt.

## Rotas principais
- `/projects` — lista, cria, edita e arquiva projetos (seleciona o ativo).
- `/projects/:projectId/sprints` — sprints do projeto ativo, criacao e abertura de rascunhos.
- `/plan/:sprintId` — planejamento da sprint (status `editing`).
- `/acomp/:sprintId` — acompanhamento da sprint; permite finalizar (`closed`) ou reabrir (`followup`).

## Fluxo de uso recomendado
1) Crie ou selecione um projeto (nome, datas, descricao e status).
2) Crie uma sprint e abra o planejamento.
3) Ajuste datas e calendario (dias nao uteis e periodos de trabalho).
4) Cadastre eventos e equipe (disponibilidade e fatores).
5) Lance tarefas com Story Points, responsaveis, datas alvo e dependencias.
6) Salve na revisao; libere o acompanhamento e finalize quando necessario.

## Regras e calculos
- **Dias uteis**: datas da sprint menos fins de semana (removiveis) e nao uteis manuais; suporta periodos de trabalho diarios customizados.
- **Eventos**: recorrentes descontam minutos em cada dia util; nao recorrentes so no dia correspondente; nunca negativam horas do dia.
- **Capacidade**: por membro = disponibilidade% × fatores (senioridade/maturidade) × horas uteis × `storyPointsPerHour`.
- **Agendamento**: duracao = `ceil(SP / storyPointsPerHour * 60)` minutos; respeita dependencias e capacidade diaria.
- **Gantt**: barra por tarefa, colorida por responsavel; clique abre edicao e recalcula ao alterar dados.

## Persistencia e biblioteca
- Estado de sprints e projetos em `localStorage` (`scrum-capacity-library-v1`).
- Bibliotecas guardam metadados, datas e status de projetos e sprints.
- Reset de agenda limpa sprint/calendario e opcionalmente preserva time, tarefas, eventos ou configuracoes.

## Importacao/Exportacao
- Exporta o estado completo para JSON (versao `SprintPulse – v1.0`).
- Importacao substitui estado completo.

Exemplo resumido:
```json
{
  "version": "SprintPulse – v1.0",
  "sprint": { "title": "", "startDate": "2025-01-01", "endDate": "2025-01-15" },
  "globalConfig": { "dailyWorkHours": 8, "storyPointsPerHour": 0.33333333, "countedMemberTypes": ["Desenvolvedor"] },
  "calendar": { "nonWorkingDaysManual": [], "nonWorkingDaysRemoved": [], "daySchedules": [] },
  "events": [],
  "members": [],
  "tasks": [],
  "planningLifecycle": { "status": "editing" }
}
```

## Scripts
- `npm install` — instala dependencias.
- `npm run dev` — ambiente de desenvolvimento.
- `npm run build` — build de producao.

## Estrutura relevante
- Entrada da app e provedores: [src/main.tsx](src/main.tsx)
- Rotas centralizadas: [src/routes/AppRoutes.tsx](src/routes/AppRoutes.tsx)
- Layout e navegacao: [src/layout/Layout.tsx](src/layout/Layout.tsx), [src/layout/Header.tsx](src/layout/Header.tsx)
- Biblioteca de projetos/sprints: [src/app/sprintLibrary.ts](src/app/sprintLibrary.ts)
- Hidracao/persistencia do store: [src/app/persistence.ts](src/app/persistence.ts)
- Dominio e regras: [src/domain/services](src/domain/services), [src/domain/types.ts](src/domain/types.ts)
- Telas: projetos [src/pages/ProjectListPage.tsx](src/pages/ProjectListPage.tsx), sprints [src/pages/SprintListPage.tsx](src/pages/SprintListPage.tsx), planejamento [src/pages/PlanningPage.tsx](src/pages/PlanningPage.tsx), acompanhamento [src/pages/FollowUpPage.tsx](src/pages/FollowUpPage.tsx)
- Componentes-chave: Summary [src/components/SummaryBoard/SummaryBoard.tsx](src/components/SummaryBoard/SummaryBoard.tsx), Gantt [src/components/GanttTimelineFrappe/GanttTimelineFrappe.tsx](src/components/GanttTimelineFrappe/GanttTimelineFrappe.tsx), Exportacao [src/components/ReportExport/ReportExportButton.tsx](src/components/ReportExport/ReportExportButton.tsx), Modal de projeto [src/components/ProjectModal/ProjectModal.tsx](src/components/ProjectModal/ProjectModal.tsx)
