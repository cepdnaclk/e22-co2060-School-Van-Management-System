import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    // BrowserRouter uses basename="/portal", so JSDOM URL must match
    window.history.pushState({}, '', '/portal/');
  });

  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });
});
