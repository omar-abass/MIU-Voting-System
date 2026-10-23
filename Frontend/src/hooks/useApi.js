import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { errorText } from '../utils/errors.js';

/**
 * Loads data when the component mounts or `deps` change.
 * Returns { data, error (translated text), rawError, loading, reload, setData }.
 * Stale responses from an earlier request are ignored.
 */
export function useApi(loader, deps = [], { enabled = true } = {}) {
  const { t } = useTranslation();
  const [state, setState] = useState({ data: null, rawError: null, loading: enabled });
  const requestId = useRef(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const run = useCallback(async ({ silent = false } = {}) => {
    requestId.current += 1;
    const id = requestId.current;
    if (!silent) setState((s) => ({ ...s, loading: true, rawError: null }));
    try {
      const data = await loaderRef.current();
      if (id === requestId.current) setState({ data, rawError: null, loading: false });
    } catch (err) {
      if (id === requestId.current && err?.name !== 'AbortError') setState((s) => ({ data: silent ? s.data : null, rawError: err, loading: false }));
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, rawError: null, loading: false });
      return undefined;
    }
    run();
    return () => {
      requestId.current += 1; // drop in-flight response after unmount / dependency change
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  const setData = useCallback((updater) => setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater })), []);

  return {
    data: state.data,
    loading: state.loading,
    rawError: state.rawError,
    error: state.rawError ? errorText(t, state.rawError) : null,
    reload: run,
    setData
  };
}
