# Calculadora de Capacidade Scrum

Planejamento e acompanhamento de sprints com gestão de projetos, capacidade em Story Points, calendário de trabalho, eventos, tarefas com dependências e Gantt.

## Tecnologias
- React + Vite + TypeScript
- Redux Toolkit para estado global
- MUI + CSS Modules para UI
- Frappe Gantt para linha do tempo de tarefas

## Rotas principais
- `/projects` — lista, cria, edita e arquiva projetos (seleciona o ativo). Modal dedicado para criação/edição.
- `/projects/:projectId/sprints` — sprints do projeto ativo, criação e abertura de rascunhos.
- `/plan/:sprintId` — planejamento da sprint (status `editing`).
- `/acomp/:sprintId` — acompanhamento da sprint; aqui é possível finalizar (status `closed`) ou reabrir (`followup`).

## Fluxo de trabalho
1) Crie ou escolha um projeto (modal com nome, datas, descrição e status `draft`/`active`/`archived`).
2) Crie uma sprint no projeto e vá para Planejamento.
3) Ajuste datas da sprint e calendário (dias não úteis e períodos de trabalho).
4) Cadastre eventos (pontuais ou recorrentes) e equipe (disponibilidade, fatores de senioridade/maturidade).
5) Lance tarefas com Story Points, responsáveis, datas alvo e dependências; calcule datas para gerar o cronograma.
6) Salve na aba Revisão; mude o ciclo de vida para `followup` (acompanhamento) e depois `closed` (finalizada). É possível reabrir.

## Regras e cálculos
- **Dias úteis**: datas da sprint menos fins de semana (removíveis) e não úteis manuais; suporta períodos de trabalho diários customizados.
- **Eventos**: recorrentes descontam minutos em cada dia útil; não recorrentes só no dia útil correspondente; nunca negativam horas do dia.
- **Capacidade**: por membro = disponibilidade% × fatores (senioridade/maturidade) × horas úteis × `storyPointsPerHour`; apenas tipos de membro configurados são contados. Capacidade do time é a soma.
- **Agendamento de tarefas**: duração = `ceil(SP / storyPointsPerHour * 60)` minutos; respeita dependências (ordenação topológica) e capacidade diária; estratégia padrão EDD (due date) com variantes SPT/BLOCKERS/HYBRID.
- **Gantt**: barra por tarefa colorida por responsável; clique abre gerenciamento; recalcula ao alterar dados.

## Persistência e biblioteca
- Estados de sprint e projeto ficam em `localStorage` (`scrum-capacity-library-v1`).
- Projetos têm status (`draft`, `active`, `archived`) e guardam datas/descrição.
- Importação/Exportação substitui o estado completo (versão `Calculadora de Capacidade Scrum – v1.0`).
- Reset de agenda limpa sprint/calendário e opcionalmente preserva time, tarefas (sem datas), eventos ou config.

## Scripts
- `npm install` — instala dependências.
- `npm run dev` — ambiente de desenvolvimento.
- `npm run build` — build de produção.

## Estrutura relevante
- Entrada da app e provedores: [src/main.tsx](src/main.tsx)
- Rotas centralizadas: [src/routes/AppRoutes.tsx](src/routes/AppRoutes.tsx)
- Layout/nav: [src/layout/Layout.tsx](src/layout/Layout.tsx), [src/layout/Header.tsx](src/layout/Header.tsx)
- Biblioteca de projetos/sprints: [src/app/sprintLibrary.ts](src/app/sprintLibrary.ts)
- Hidratação/persistência do store: [src/app/persistence.ts](src/app/persistence.ts)
- Domínio e regras: [src/domain/services](src/domain/services), [src/domain/types.ts](src/domain/types.ts)
- Telas: projetos [src/pages/ProjectListPage.tsx](src/pages/ProjectListPage.tsx), sprints [src/pages/SprintListPage.tsx](src/pages/SprintListPage.tsx), planejamento [src/pages/PlanningPage.tsx](src/pages/PlanningPage.tsx), acompanhamento [src/pages/FollowUpPage.tsx](src/pages/FollowUpPage.tsx)
- Componentes de destaque: Summary [src/components/SummaryBoard/SummaryBoard.tsx](src/components/SummaryBoard/SummaryBoard.tsx), Gantt [src/components/GanttTimelineFrappe/GanttTimelineFrappe.tsx](src/components/GanttTimelineFrappe/GanttTimelineFrappe.tsx), Exportação [src/components/ReportExport/ReportExportButton.tsx](src/components/ReportExport/ReportExportButton.tsx), Modal de projeto [src/components/ProjectModal/ProjectModal.tsx](src/components/ProjectModal/ProjectModal.tsx)

## Formato de exportação/importação (resumo)
```json
{
  "version": "Calculadora de Capacidade Scrum – v1.0",
  "sprint": { "title": "", "startDate": "2025-01-01", "endDate": "2025-01-15" },
  "globalConfig": { "dailyWorkHours": 8, "storyPointsPerHour": 0.33333333, "countedMemberTypes": ["Desenvolvedor"] },
  "calendar": { "nonWorkingDaysManual": [], "nonWorkingDaysRemoved": [], "daySchedules": [] },
  "events": [],
  "members": [],
  "tasks": [],
  "planningLifecycle": { "status": "editing" }
}
```

## Dicas rápidas
- Defina projeto e sprint antes de lançar tarefas.
- Use eventos recorrentes para feriados fixos da semana e deixe o calendário ajustar as horas úteis.
- Ajuste fatores de senioridade/maturidade em Configurações para calibrar capacidade real.
- Recalcule datas na aba Tarefas sempre que alterar SP, dependências ou calendário.
