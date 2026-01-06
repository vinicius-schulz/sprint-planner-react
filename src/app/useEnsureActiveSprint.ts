import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './hooks';
import { ensureActiveSprint } from './sprintLibrary';
import { hydrateStoreFromState } from './sprintHydrator';

export const useEnsureActiveSprint = () => {
  const { sprintId } = useParams<{ sprintId: string }>();
  const dispatch = useAppDispatch();
  const hydratedSprintId = useRef<string | undefined>(undefined);
  const hasRuntimeState = useAppSelector((state) => {
    const hasSprint = Boolean(state.sprint.startDate || state.sprint.endDate || state.sprint.title);
    const hasTasks = state.tasks.items.length > 0;
    const hasCalendar = state.calendar.daySchedules.length > 0;
    return hasSprint || hasTasks || hasCalendar;
  });
  const currentStatus = useAppSelector((state) => state.planningLifecycle.status);

  useEffect(() => {
    if (!sprintId) return;
    // If we already have state in memory and it is not editing, prefer the live state (avoid overwriting follow-up with stale persisted draft)
    if (hasRuntimeState && currentStatus !== 'editing') {
      hydratedSprintId.current = sprintId;
      return;
    }

    const { state } = ensureActiveSprint(sprintId);
    if (hydratedSprintId.current === sprintId && hasRuntimeState) {
      return;
    }
    hydrateStoreFromState(dispatch, state);
    hydratedSprintId.current = sprintId;
  }, [currentStatus, dispatch, hasRuntimeState, sprintId]);
};
