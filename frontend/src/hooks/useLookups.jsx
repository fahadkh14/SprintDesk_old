import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getCategories, getProjects, getTeam, errMsg } from '../services/api';

const LookupContext = createContext(null);

/** Projects, team members and categories are needed by almost every screen, so load them once. */
export function LookupProvider({ children }) {
  const [state, setState] = useState({ projects: [], team: [], categories: [], loading: true, error: null });

  const refresh = useCallback(async () => {
    try {
      const [projects, team, categories] = await Promise.all([getProjects(), getTeam(), getCategories()]);
      setState({ projects, team, categories, loading: false, error: null });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: errMsg(e) }));
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const value = useMemo(() => ({ ...state, refresh }), [state, refresh]);
  return <LookupContext.Provider value={value}>{children}</LookupContext.Provider>;
}

export const useLookups = () => useContext(LookupContext);
