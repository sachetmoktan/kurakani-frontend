import { useCallback, useState } from 'react';

export function useLocalStorage<T>(key: string, initialValue?: T) {
  const [value, setValue] = useState<T | undefined>(() => {
    try {
      const item = localStorage.getItem(key);

      if (item !== null) {
        return JSON.parse(item) as T;
      }

      if (initialValue instanceof Function) {
        return initialValue();
      }

      return initialValue;
    } catch {
      return initialValue instanceof Function ? initialValue() : initialValue;
    }
  });

  const get = useCallback(() => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : undefined;
    } catch {
      return undefined;
    }
  }, [key]);

  const hasValue = useCallback(() => {
    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  }, [key]);

  const set = useCallback(
    (newValue: T) => {
      localStorage.setItem(key, JSON.stringify(newValue));
      setValue(newValue);
    },
    [key],
  );

  const remove = useCallback(() => {
    localStorage.removeItem(key);
    setValue(undefined);
  }, [key]);

  const clearAll = useCallback(() => {
    localStorage.clear();
    setValue(undefined);
  }, []);

  return {
    value,
    get,
    hasValue,
    set,
    remove,
    clearAll,
  };
}
