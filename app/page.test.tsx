import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

import Page from '@/app/page';

test('renders the app title', () => {
  render(<Page />);
  expect(screen.getByText('Gymmie')).toBeDefined();
});

test('renders the beta badge', () => {
  render(<Page />);
  expect(screen.getByText('Beta')).toBeDefined();
});

test('renders the description', () => {
  render(<Page />);
  expect(screen.getByText('Your personal fitness companion')).toBeDefined();
});

test('renders get started button', () => {
  render(<Page />);
  expect(screen.getByRole('button', { name: 'Get Started' })).toBeDefined();
});

test('renders learn more button', () => {
  render(<Page />);
  expect(screen.getByRole('button', { name: 'Learn More' })).toBeDefined();
});
