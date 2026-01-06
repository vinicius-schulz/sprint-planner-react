import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch } from './hooks';
import { ensureActiveSprint } from './sprintLibrary';
import { hydrateStoreFromState } from './sprintHydrator';

export const useEnsureActiveSprint = () => {
  const { sprintId } = useParams<{ sprintId: string }>();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!sprintId) return;
    const { state } = ensureActiveSprint(sprintId);
    hydrateStoreFromState(dispatch, state);
  }, [dispatch, sprintId]);
};
