import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SearchBar } from './SearchBar';
import type { AppTranslationKey } from '@mms/shared';

declare global {
   
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: AppTranslationKey) => {
      const map: Partial<Record<AppTranslationKey, string>> = {
        'common.searchPlaceholder': 'Search...',
        'common.clearSearch': 'Clear search',
      };
      return map[key] ?? key;
    },
  }),
}));

describe('SearchBar Component', () => {
  it('renders default search placeholder when none is provided', () => {
    const html = renderToStaticMarkup(<SearchBar value="" onChange={vi.fn()} />);
    expect(html).toContain('placeholder="Search..."');
  });

  it('renders custom placeholder, aria-label, and canonical ID when supplied', () => {
    const html = renderToStaticMarkup(
      <SearchBar
        id="custom-search-id"
        value=""
        onChange={vi.fn()}
        placeholder="Filter records..."
        ariaLabel="Filter records input"
      />,
    );
    expect(html).toContain('placeholder="Filter records..."');
    expect(html).toContain('id="custom-search-id"');
    expect(html).toContain('aria-label="Filter records input"');
  });

  it('renders clear search button only when value is present and not disabled', () => {
    const emptyHtml = renderToStaticMarkup(<SearchBar value="" onChange={vi.fn()} />);
    expect(emptyHtml).not.toContain('Clear search');

    const filledHtml = renderToStaticMarkup(<SearchBar value="Query" onChange={vi.fn()} />);
    expect(filledHtml).toContain('Clear search');

    const disabledHtml = renderToStaticMarkup(
      <SearchBar value="Query" disabled={true} onChange={vi.fn()} />,
    );
    expect(disabledHtml).not.toContain('Clear search');
    expect(disabledHtml).toContain('disabled=""');
  });

  it('applies custom className and inputClassName', () => {
    const html = renderToStaticMarkup(
      <SearchBar
        value=""
        onChange={vi.fn()}
        className="wrapper-custom"
        inputClassName="input-custom"
      />,
    );
    expect(html).toContain('wrapper-custom');
    expect(html).toContain('input-custom');
  });

  it('triggers onChange with empty string when clear button is clicked', async () => {
    const onChange = vi.fn();
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<SearchBar value="Existing query" onChange={onChange} />);
    });

    const clearButton = container.querySelector('button[aria-label="Clear search"]');
    expect(clearButton).not.toBeNull();

    await act(async () => {
      clearButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onChange).toHaveBeenCalledWith('');

    await act(async () => {
      root.unmount();
    });
  });
});
