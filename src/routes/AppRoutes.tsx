import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../layout/Layout';
import { ProjectDashboardPage } from '../pages/ProjectDashboardPage';
import { ProjectListPage } from '../pages/ProjectListPage';
import { SprintListPage } from '../pages/SprintListPage';
import { PlanningPage } from '../pages/PlanningPage';
import { FollowUpPage } from '../pages/FollowUpPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<ProjectDashboardPage />} />
        <Route path="projects" element={<ProjectListPage />} />
        <Route path="projects/:projectId/sprints" element={<SprintListPage />} />
        <Route path="plan" element={<Navigate to="/projects" replace />} />
        <Route path="plan/:sprintId" element={<PlanningPage />} />
        <Route path="acomp" element={<Navigate to="/projects" replace />} />
        <Route path="acomp/:sprintId" element={<FollowUpPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
