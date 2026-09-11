import { useState } from 'react';

/**
 * Reads and writes a value to localStorage, keeping React state in sync.
 *
 * @template T
 * @param {string} key          - The localStorage key.
 * @param {T}      initialValue - Fallback value when the key does not exist.
 * @returns {[T, (value: T) => void, () => void]} - [storedValue, setValue, removeValue]
 */
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`useLocalStorage [${key}] setValue error:`, error);
    }
  };

  const removeValue = () => {
    try {
      localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`useLocalStorage [${key}] removeValue error:`, error);
    }
  };

  return [storedValue, setValue, removeValue];
}

export default useLocalStorage;
