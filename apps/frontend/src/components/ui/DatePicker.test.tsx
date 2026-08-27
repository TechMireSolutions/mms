import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DatePicker, type DatePickerProps } from './DatePicker';
import type { AppTranslationKey } from '@mms/shared';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: AppTranslationKey, params?: Record<string, string | number>) => {
      const map: Partial<Record<AppTranslationKey, string>> = {
        'datePicker.openAria': 'Open calendar',
        'datePicker.clearAria': 'Clear date',
        'datePicker.clear': 'Clear',
        'datePicker.today': 'Today',
        'datePicker.enterFormatAria': `Enter date in format ${params?.format ?? 'DD/MM/YYYY'}`,
      };
      return map[key] ?? key;
    },
  }),
}));

function changeInput(input: HTMLInputElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  descriptor?.set?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('DatePicker Component', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  async function renderDatePicker(props: DatePickerProps) {
    await act(async () => {
      root.render(<DatePicker {...props} />);
    });
    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    return { container, input };
  }

  it('renders with formatted display value and custom placeholder', async () => {
    const onChange = vi.fn();
    const { input } = await renderDatePicker({
      value: '2026-07-21',
      onChange,
      placeholder: 'Select a date',
      id: 'custom-date-id',
      name: 'birthDate',
    });

    expect(input).toBeTruthy();
    expect(input.value).toBe('21/07/2026');
    expect(input.id).toBe('custom-date-id');
    expect(input.name).toBe('birthDate');
    expect(input.placeholder).toBe('Select a date');

    const hiddenInput = container.querySelector('input[name="birthDate_hidden"]') as HTMLInputElement;
    expect(hiddenInput).toBeTruthy();
    expect(hiddenInput.value).toBe('2026-07-21');
  });

  it('auto-formats user typing numbers by inserting / between segments', async () => {
    const onChange = vi.fn();
    const { input } = await renderDatePicker({ value: '', onChange });
    expect(input.value).toBe('');

    // User types "21"
    await act(async () => {
      changeInput(input, '21');
    });
    expect(input.value).toBe('21/');

    // User continues typing "21/07"
    await act(async () => {
      changeInput(input, '21/07');
    });
    expect(input.value).toBe('21/07/');

    // User finishes typing "21/07/2026"
    await act(async () => {
      changeInput(input, '21/07/2026');
    });
    expect(input.value).toBe('21/07/2026');
    expect(onChange).toHaveBeenCalledWith('2026-07-21');
  });

  it('allows backspacing without re-inserting trailing separator immediately', async () => {
    const onChange = vi.fn();
    const { input } = await renderDatePicker({ value: '', onChange });

    await act(async () => {
      changeInput(input, '21');
    });
    expect(input.value).toBe('21/');

    // User deletes trailing separator
    await act(async () => {
      changeInput(input, '21');
    });
    expect(input.value).toBe('21');
  });

  it('auto-formats pasted 8-digit strings into full date with / separators', async () => {
    const onChange = vi.fn();
    const { input } = await renderDatePicker({ value: '', onChange });

    await act(async () => {
      changeInput(input, '21072026');
    });

    expect(input.value).toBe('21/07/2026');
    expect(onChange).toHaveBeenCalledWith('2026-07-21');
  });

  it('triggers onChange with empty string when clear button is clicked', async () => {
    const onChange = vi.fn();
    await renderDatePicker({ value: '2026-07-21', onChange });

    const clearButton = container.querySelector('button[aria-label="Clear date"]') as HTMLButtonElement;
    expect(clearButton).toBeTruthy();

    await act(async () => {
      clearButton.click();
    });

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('disables trigger button and input when disabled prop is true', async () => {
    const onChange = vi.fn();
    const { input } = await renderDatePicker({ value: '2026-07-21', onChange, disabled: true });

    expect(input.disabled).toBe(true);

    const triggerButton = container.querySelector('button[aria-label="Open calendar"]') as HTMLButtonElement;
    expect(triggerButton.disabled).toBe(true);

    // Clear button should not be rendered when disabled
    const clearButton = container.querySelector('button[aria-label="Clear date"]');
    expect(clearButton).toBeNull();
  });

  it('renders required helper input when required is true and value is empty', async () => {
    const onChange = vi.fn();
    await renderDatePicker({
      value: '',
      onChange,
      required: true,
      id: 'test-req',
      name: 'testReq',
    });

    const helper = container.querySelector('input[id="test-req-required-helper"]') as HTMLInputElement;
    expect(helper).toBeTruthy();
    expect(helper.required).toBe(true);
  });

  it('handles null value and null min/max bounds props safely', async () => {
    const onChange = vi.fn();
    const { input } = await renderDatePicker({
      value: null,
      onChange,
      min: null,
      max: null,
    });

    expect(input).toBeTruthy();
    expect(input.value).toBe('');
  });

  it('opens and closes popover via trigger button click', async () => {
    const onChange = vi.fn();
    await renderDatePicker({ value: '2026-07-21', onChange });

    const triggerButton = container.querySelector('button[aria-label="Open calendar"]') as HTMLButtonElement;
    expect(triggerButton).toBeTruthy();

    await act(async () => {
      triggerButton.click();
    });

    // Popover is open: input aria-expanded is true
    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    expect(input.getAttribute('aria-expanded')).toBe('true');
  });

  it('reverts invalid or incomplete dates on blur', async () => {
    const onChange = vi.fn();
    const { input } = await renderDatePicker({ value: '2026-07-21', onChange });

    // User types invalid date
    await act(async () => {
      changeInput(input, '30/02/2026');
    });
    expect(input.value).toBe('30/02/2026');
    expect(onChange).not.toHaveBeenCalled();

    // User blurs field: should revert to last valid date
    await act(async () => {
      input.focus();
      input.blur();
    });
    expect(input.value).toBe('21/07/2026');
  });

  it('enforces min and max bounds during typing', async () => {
    const onChange = vi.fn();
    const { input } = await renderDatePicker({
      value: '',
      onChange,
      min: '2026-06-01',
      max: '2026-06-30',
    });

    // Out of bounds: May 15 (before min)
    await act(async () => {
      changeInput(input, '15/05/2026');
    });
    expect(onChange).not.toHaveBeenCalled();

    // In bounds: June 15
    await act(async () => {
      changeInput(input, '15/06/2026');
    });
    expect(onChange).toHaveBeenCalledWith('2026-06-15');
  });

  it('forwards accessibility attributes and custom className', async () => {
    const { input } = await renderDatePicker({
      value: '',
      onChange: vi.fn(),
      'aria-label': 'Student birth date',
      'aria-invalid': true,
      'aria-describedby': 'date-error-hint',
      className: 'custom-date-picker-class',
    });

    expect(input.getAttribute('aria-label')).toBe('Student birth date');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('date-error-hint');
    expect(container.firstElementChild?.classList.contains('custom-date-picker-class')).toBe(true);
  });

  it('clears value when user deletes all text from input', async () => {
    const onChange = vi.fn();
    const { input } = await renderDatePicker({ value: '2026-07-21', onChange });
    expect(input.value).toBe('21/07/2026');

    await act(async () => {
      changeInput(input, '');
    });

    expect(input.value).toBe('');
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('selects today and closes popover when Today button is clicked in calendar footer', async () => {
    const onChange = vi.fn();
    const { input } = await renderDatePicker({ value: '', onChange });

    const triggerButton = container.querySelector('button[aria-label="Open calendar"]') as HTMLButtonElement;
    await act(async () => {
      triggerButton.click();
    });

    const todayButton = Array.from(document.body.querySelectorAll('button')).find(
      (btn) => btn.textContent === 'Today',
    );
    expect(todayButton).toBeTruthy();

    await act(async () => {
      todayButton?.click();
    });

    expect(onChange).toHaveBeenCalled();
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });

  it('clears value when Clear button is clicked in calendar footer', async () => {
    const onChange = vi.fn();
    await renderDatePicker({ value: '2026-07-21', onChange });

    const triggerButton = container.querySelector('button[aria-label="Open calendar"]') as HTMLButtonElement;
    await act(async () => {
      triggerButton.click();
    });

    const footerClearButton = Array.from(document.body.querySelectorAll('button')).find(
      (btn) => btn.textContent === 'Clear',
    );
    expect(footerClearButton).toBeTruthy();

    await act(async () => {
      footerClearButton?.click();
    });

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('commits typed date and closes popover when Enter key is pressed', async () => {
    const onChange = vi.fn();
    const { input } = await renderDatePicker({ value: '', onChange });

    const triggerButton = container.querySelector('button[aria-label="Open calendar"]') as HTMLButtonElement;
    await act(async () => {
      triggerButton.click();
    });
    expect(input.getAttribute('aria-expanded')).toBe('true');

    await act(async () => {
      changeInput(input, '15/08/2026');
    });

    await act(async () => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });

    expect(input.value).toBe('15/08/2026');
    expect(onChange).toHaveBeenCalledWith('2026-08-15');
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });

  it('updates displayed input value when parent value prop changes', async () => {
    const onChange = vi.fn();
    const { input } = await renderDatePicker({ value: '2026-07-21', onChange });
    expect(input.value).toBe('21/07/2026');

    // Parent updates value prop
    await act(async () => {
      root.render(<DatePicker value="2026-08-15" onChange={onChange} />);
    });
    expect(input.value).toBe('15/08/2026');
  });

  it('opens popover when ArrowDown key is pressed on the input', async () => {
    const onChange = vi.fn();
    const { input } = await renderDatePicker({ value: '', onChange });
    expect(input.getAttribute('inputmode')).toBe('numeric');
    expect(input.getAttribute('aria-expanded')).toBe('false');

    await act(async () => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    });

    expect(input.getAttribute('aria-expanded')).toBe('true');
  });
});
