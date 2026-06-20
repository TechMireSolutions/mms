import { useCallback, useState } from 'react';

const SAVED_FLASH_MS = 2500;

/** Brief “saved” indicator for settings panels after a successful persist. */
export function useSavedFlash(): {
  saved: boolean;
  flashSaved: () => void;
  clearSaved: () => void;
} {
  const [saved, setSaved] = useState(false);

  const flashSaved = useCallback((): void => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), SAVED_FLASH_MS);
  }, []);

  const clearSaved = useCallback((): void => {
    setSaved(false);
  }, []);

  return { saved, flashSaved, clearSaved };
}
