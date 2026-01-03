import { useState } from 'react';
import { Box, Container, Tab, Tabs, Typography } from '@mui/material';
import './App.css';
import { TabPanel } from './components/TabPanel';
import { SprintTab } from './features/sprint/SprintTab';
import { EventsTab } from './features/events/EventsTab';
import { TeamTab } from './features/members/TeamTab';
import { TasksTab } from './features/tasks/TasksTab';
import { ConfigTab } from './features/config/ConfigTab';
import { ImportExportTab } from './features/importExport/ImportExportTab';
import { SummaryBoard } from './components/SummaryBoard';
import { GanttTimeline } from './components/GanttTimeline';

function App() {
  const [tab, setTab] = useState(0);

  return (
    <Container className="appContainer" maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Calculadora de Capacidade Scrum
      </Typography>
      <Box sx={{ mb: 2 }}>
        <SummaryBoard />
      </Box>
      <GanttTimeline />
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tab}
          onChange={(_, newValue) => setTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Sprint" />
          <Tab label="Eventos" />
          <Tab label="Time" />
          <Tab label="Tarefas" />
          <Tab label="Configurações" />
          <Tab label="Export/Import" />
        </Tabs>
      </Box>
      <TabPanel value={tab} index={0}>
        <SprintTab />
      </TabPanel>
      <TabPanel value={tab} index={1}>
        <EventsTab />
      </TabPanel>
      <TabPanel value={tab} index={2}>
        <TeamTab />
      </TabPanel>
      <TabPanel value={tab} index={3}>
        <TasksTab />
      </TabPanel>
      <TabPanel value={tab} index={4}>
        <ConfigTab />
      </TabPanel>
      <TabPanel value={tab} index={5}>
        <ImportExportTab />
      </TabPanel>
    </Container>
  );
}

export default App;
