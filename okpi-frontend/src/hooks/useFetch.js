import { useEffect, useState } from "react";

export function useFetch(fetcher, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function run() {
      setLoading(true);
      setError("");

      try {
        const result = await fetcher();
        if (isMounted) {
          setData(result);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError.response?.data?.message ?? fetchError.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    run();

    return () => {
      isMounted = false;
    };
  }, dependencies);

  return { data, loading, error, setData, setError };
}
