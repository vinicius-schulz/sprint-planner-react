import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getActiveSprintId } from '../app/sprintLibrary';
import { Header } from './Header';
import { Content } from './Content';
import { Footer } from './Footer';

const taskManageEventName = 'task-manage-open';
const navigateToPlanningEventName = 'navigate-to-planning';

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onNavigateToPlanning = (event: Event) => {
      const custom = event as CustomEvent<{ taskId?: string }>; // from acompanhamento modal
      const taskId = custom.detail?.taskId;
      const sprintMatch = location.pathname.match(/^\/(?:plan|acomp)\/([^/]+)/);
      const sprintId = sprintMatch?.[1] || getActiveSprintId();
      if (!sprintId) {
        navigate('/projects');
        return;
      }
      const params = new URLSearchParams();
      params.set('step', 'tasks');
      if (taskId) params.set('taskId', taskId);
      navigate(`/plan/${sprintId}?${params.toString()}`);
      window.setTimeout(() => {
        if (taskId) {
          window.dispatchEvent(new CustomEvent(taskManageEventName, { detail: { taskId } }));
        }
      }, 0);
    };

    window.addEventListener(navigateToPlanningEventName, onNavigateToPlanning as EventListener);
    return () => window.removeEventListener(navigateToPlanningEventName, onNavigateToPlanning as EventListener);
  }, [location.pathname, navigate]);

  const active: 'dashboard' | 'projects' = location.pathname === '/' ? 'dashboard' : 'projects';

  return (
    <>
      <Header active={active} />
      <Content />
      <Footer />
    </>
  );
}
