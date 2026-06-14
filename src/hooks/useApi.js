import { useState, useEffect, useCallback, useRef } from 'react';

export function useApi(apiFn, params = null, deps = []) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const fetch = useCallback(async (overrideParams) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFn(overrideParams ?? params);
      if (mountedRef.current) {
        setData(res.data?.data ?? res.data);
      }
    } catch (err) {
      if (mountedRef.current) setError(err.response?.data?.message || err.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, deps); // eslint-disable-line

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useMutation(apiFn) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const mutate = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFn(...args);
      return { success: true, data: res.data?.data ?? res.data };
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, [apiFn]);

  return { mutate, loading, error };
}
