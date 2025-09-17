import { useState, useEffect } from 'react';

export function useApiFallback<T>(apiUrl: string, mockUrl: string, options?: RequestInit) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(apiUrl, options)
      .then((res) => {
        if (!res.ok) throw new Error('API error');
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      })
      .catch(() => {
        fetch(mockUrl)
          .then((res) => res.json())
          .then((json) => {
            if (!cancelled) {
              setData(json);
              setError('Using mock data');
            }
          })
          .catch((err) => {
            if (!cancelled) {
              setError('Failed to load data');
            }
          });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiUrl, mockUrl, options]);

  return { data, error, loading };
}
