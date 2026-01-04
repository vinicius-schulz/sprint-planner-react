# Calculadora de Capacidade Scrum

Aplicação React + Vite com Redux Toolkit e MUI para planejar capacidade de sprint: horas úteis, capacidade em Story Points, agendamento de tarefas com dependências e importação/exportação de estado.

## Como rodar
- `npm install`
- `npm run dev` para ambiente local
- `npm run build` para gerar produção

## Arquitetura
- **Estado global**: Redux Toolkit em `src/app/store.ts`, slices por domínio (`features/*`).
- **Regra de negócio**: funções puras e seletores em `src/domain/services` e `src/domain/selectors` (calendário, capacidade, tarefas).
- **Persistência**: `localStorage` automática (hidratação na carga e salvamento com debounce). Import/Export sobrescreve o estado inteiro.
- **UI**: MUI + CSS Modules. Componentes pequenos por domínio; abas em [src/App.tsx](src/App.tsx) e resumos em [src/components/SummaryBoard](src/components/SummaryBoard).

## Regras implementadas (essenciais)
- Dias úteis = intervalo da sprint menos fins de semana (removíveis) e feriados manuais.
- Eventos: recorrente desconta minutos por dia útil; não recorrente só desconta em dia útil; horas úteis não fica negativa.
- Capacidade por membro: disponibilidade % * fatores (senioridade/maturidade) * horas úteis * SP/hora; tipos fora da lista contabilizada geram 0.
- Tarefas: ordenadas por ID; dependência inexistente ou própria gera erro; duração = `ceil((SP / SP/hora) / horas/dia)`; início = próximo dia útil após a dependência mais restritiva; datas respeitam calendário da sprint.

## Formato de exportação/importação
```json
{
  "version": "Calculadora de Capacidade Scrum – v1.0",
  "sprint": { "title": "", "startDate": "2025-01-01", "endDate": "2025-01-15" },
  "nonWorkingDaysManual": ["2025-01-08"],
  "nonWorkingDaysRemoved": ["2025-01-11"],
  "events": [{ "id": "e1", "type": "Planning", "date": "2025-01-02", "minutes": 120, "recurringDaily": false }],
  "members": [{ "id": "m1", "name": "Ana", "roleType": "Desenvolvedor", "seniority": "Pleno", "maturity": "Mediana", "availabilityPercent": 100 }],
  "tasks": [{ "id": "T1", "name": "Login", "assigneeMemberName": "Ana", "storyPoints": 5, "dependencies": [] }],
  "globalConfig": { "dailyWorkHours": 8, "seniorityFactors": { "Sênior": 1, "Pleno": 0.8, "Júnior": 0.6 }, "maturityFactors": { "Plena": 1, "Mediana": 0.8, "Inicial": 0.6 }, "storyPointsPerHour": 0.33333333, "countedMemberTypes": ["Desenvolvedor"] }
}
```

## Dicas de uso
- Preencha e salve a Sprint antes de configurar dias não úteis e tarefas.
- Use a aba **Dias Não Úteis** para marcar feriados e liberar fins de semana específicos.
- Eventos recorrentes descontam minutos a cada dia útil automaticamente.
- Alterar configurações ou sprint recalcula horas úteis e capacidades instantaneamente.
- Clique em **Calcular Datas** na aba Tarefas para gerar datas e ver erros de dependências.
