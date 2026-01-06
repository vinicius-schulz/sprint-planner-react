import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { FollowUpPage } from './pages/FollowUpPage';
import { PlanningPage } from './pages/PlanningPage';
import { SprintListPage } from './pages/SprintListPage';
import { Layout } from './layout/Layout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/sprints" replace />} />
          <Route path="sprints" element={<SprintListPage />} />
          <Route path="plan" element={<Navigate to="/sprints" replace />} />
          <Route path="plan/:sprintId" element={<PlanningPage />} />
          <Route path="acomp" element={<Navigate to="/sprints" replace />} />
          <Route path="acomp/:sprintId" element={<FollowUpPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
