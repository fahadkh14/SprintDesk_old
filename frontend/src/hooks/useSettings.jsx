import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useLookups } from './useLookups';

const KEY = 'sprintdesk.settings';
const DEFAULTS = { activeMemberId: null, defaultView: 'board' };

const read = () => {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return DEFAULTS; }
};

const SettingsContext = createContext(null);

/** Personal preferences kept in this browser (SprintDesk has no accounts). */
export function SettingsProvider({ children }) {
  const { team } = useLookups();
  const [settings, setSettings] = useState(read);

  const update = useCallback((patch) => {
    setSettings((s) => {
      const next = { ...s, ...patch };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    setSettings(DEFAULTS);
  }, []);

  const activeMember = useMemo(
    () => team.find((m) => m.id === settings.activeMemberId) || team[0] || null,
    [team, settings.activeMemberId],
  );

  const value = useMemo(() => ({ settings, update, reset, activeMember }), [settings, update, reset, activeMember]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
