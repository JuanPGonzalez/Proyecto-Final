export const getStorageItem = (key, fallback = null) => {
  try {
    const item = localStorage.getItem(key);
    if (item === null || item === 'undefined') return fallback;
    return JSON.parse(item);
  } catch (e) {
    console.error(`Error parsing localStorage key "${key}":`, e);
    return fallback;
  }
};

export const setStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error setting localStorage key "${key}":`, e);
  }
};
