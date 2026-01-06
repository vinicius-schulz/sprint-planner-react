import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { FollowUpPage } from './pages/FollowUpPage';
import { PlanningPage } from './pages/PlanningPage';
import { SprintListPage } from './pages/SprintListPage';
import { Layout } from './layout/Layout';
import { ProjectListPage } from './pages/ProjectListPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/projects" replace />} />
          <Route path="projects" element={<ProjectListPage />} />
          <Route path="projects/:projectId/sprints" element={<SprintListPage />} />
          <Route path="plan" element={<Navigate to="/projects" replace />} />
          <Route path="plan/:sprintId" element={<PlanningPage />} />
          <Route path="acomp" element={<Navigate to="/projects" replace />} />
          <Route path="acomp/:sprintId" element={<FollowUpPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
