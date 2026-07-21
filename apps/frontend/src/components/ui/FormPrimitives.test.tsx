import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  CardTypeLabel,
  CardRemoveButton,
  INPUT,
  SELECT,
  TEXTAREA,
  LABEL,
  COLLECTION_CARD,
  COLLECTION_BODY,
  TYPE_SELECT_WIDTH,
} from './FormPrimitives';

describe('FormPrimitives', () => {
  describe('CardTypeLabel', () => {
    it('creates a element with uppercase styling classes', () => {
      const element = CardTypeLabel({ children: 'Contact Type' });
      expect(element.type).toBe('span');
      expect(element.props.children).toBe('Contact Type');
      expect(element.props.className).toContain('uppercase');
    });
  });

  describe('CardRemoveButton', () => {
    it('renders a remove button with correct aria-label and click handler', () => {
      const onClick = vi.fn();
      const element = CardRemoveButton({ onClick, label: 'Remove item' });
      expect(element.props['aria-label']).toBe('Remove item');
      expect(element.props.onClick).toBe(onClick);
    });
  });

  describe('Design System Constants', () => {
    it('exports non-empty CSS utility strings', () => {
      expect(INPUT).toBeDefined();
      expect(SELECT).toBeDefined();
      expect(TEXTAREA).toBeDefined();
      expect(LABEL).toBeDefined();
      expect(COLLECTION_CARD).toContain('rounded-xl');
      expect(COLLECTION_BODY).toBe('space-y-3');
      expect(TYPE_SELECT_WIDTH).toBe('w-32');
    });
  });
});
