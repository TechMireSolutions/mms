import { useState, useEffect, useDeferredValue } from 'react';

export interface UseCommandPaletteSearchOptions<T> {
  items: readonly T[];
  onSelect: (item: T) => void;
  onClose: () => void;
}

/**
 * Headless keyboard navigation and selection state for command palette modals.
 */
export function useCommandPaletteSearch<T>({
  items,
  onSelect,
  onClose,
}: UseCommandPaletteSearchOptions<T>) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (items.length > 0 ? (prev + 1) % items.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        items.length > 0 ? (prev - 1 + items.length) % items.length : 0,
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[selectedIndex]) {
        onSelect(items[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return {
    query,
    setQuery,
    deferredQuery,
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
  };
}
