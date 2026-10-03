export function getLocalStorageItem(key: string, fallback: string | null = null): string | null {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch (error) {
    console.error('Error in getLocalStorageItem:', error);
    return fallback;
  }
}

export function setLocalStorageItem(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, String(value));
  } catch (error) {
    console.error('Error in setLocalStorageItem:', error);
  }
}

export function removeLocalStorageItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error in removeLocalStorageItem:', error);
  }
}

