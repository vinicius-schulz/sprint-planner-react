import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import { getActiveSprintId, getActiveProjectId, getProjectMeta } from '../app/sprintLibrary';
import { Header } from './Header';
import { Content } from './Content';
import { Footer } from './Footer';

const taskManageEventName = 'task-manage-open';
const navigateToPlanningEventName = 'navigate-to-planning';

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const planningStatus = useAppSelector((state) => state.planningLifecycle.status);

  useEffect(() => {
    const onNavigateToPlanning = (event: Event) => {
      const custom = event as CustomEvent<{ taskId?: string }>; // from acompanhamento modal
      const taskId = custom.detail?.taskId;
      const sprintMatch = location.pathname.match(/^\/(?:plan|acomp)\/([^/]+)/);
      const sprintId = sprintMatch?.[1] || getActiveSprintId();
      if (!sprintId) {
        navigate('/sprints');
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

  const sprintMatch = location.pathname.match(/^\/(plan|acomp)\/([^/]+)/);
  const projectMatch = location.pathname.match(/^\/projects(?:\/([^/]+))?/);
  const sprintId = sprintMatch?.[2];
  const projectId = projectMatch?.[1] || getActiveProjectId();
  const projectName = projectId ? getProjectMeta(projectId)?.name : undefined;
  const active: 'projects' | 'sprints' | 'plan' | 'acomp' = sprintMatch
    ? (sprintMatch[1] as 'plan' | 'acomp')
    : location.pathname.startsWith('/projects')
      ? (projectMatch?.[1] ? 'sprints' : 'projects')
      : 'projects';

  return (
    <>
      <Header
        active={active}
        followUpEnabled={planningStatus !== 'editing'}
        sprintId={sprintId}
        projectId={projectId}
        projectName={projectName}
      />
      <Content />
      <Footer />
    </>
  );
}
