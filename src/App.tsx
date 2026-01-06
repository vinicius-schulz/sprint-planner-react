import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { FollowUpPage } from './pages/FollowUpPage';
import { PlanningPage } from './pages/PlanningPage';
import { Layout } from './layout/Layout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/plan" replace />} />
          <Route path="plan" element={<PlanningPage />} />
          <Route path="acomp" element={<FollowUpPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
