import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import { Header } from './Header';
import { Content } from './Content';
import { Footer } from './Footer';

const taskManageEventName = 'task-manage-open';
const navigateToPlanningEventName = 'navigate-to-planning';

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const planningClosed = useAppSelector((state) => state.planningLifecycle.status === 'closed');

  useEffect(() => {
    const onNavigateToPlanning = (event: Event) => {
      const custom = event as CustomEvent<{ taskId?: string }>; // from acompanhamento modal
      const taskId = custom.detail?.taskId;
      const params = new URLSearchParams();
      params.set('step', 'tasks');
      if (taskId) params.set('taskId', taskId);
      navigate(`/plan?${params.toString()}`);
      window.setTimeout(() => {
        if (taskId) {
          window.dispatchEvent(new CustomEvent(taskManageEventName, { detail: { taskId } }));
        }
      }, 0);
    };

    window.addEventListener(navigateToPlanningEventName, onNavigateToPlanning as EventListener);
    return () => window.removeEventListener(navigateToPlanningEventName, onNavigateToPlanning as EventListener);
  }, [navigate]);

  const active = location.pathname.startsWith('/acomp') ? 'acomp' : 'plan';

  return (
    <>
      <Header active={active} followUpEnabled={planningClosed} />
      <Content />
      <Footer />
    </>
  );
}
