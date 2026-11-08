import { useCallback, useEffect, useRef, useState } from 'react';
import { errMsg } from '../services/api';

/** Runs an async loader on mount / when deps change. `reload()` refreshes without a loading flash. */
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const run = useRef(0);

  const load = useCallback(async (silent) => {
    const id = ++run.current;
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fnRef.current();
      if (id === run.current) setState({ data, loading: false, error: null });
    } catch (e) {
      if (id === run.current) setState((s) => ({ data: silent ? s.data : null, loading: false, error: errMsg(e) }));
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(false); }, deps);

  return { ...state, reload: () => load(true), refetch: () => load(false) };
}
