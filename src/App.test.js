import { render, screen } from '@testing-library/react';
import App from './App';

describe('Budget Overview App', () => {
  test('renders main heading', () => {
    render(<App />);
    const headingElement = screen.getByText(/Yearly Budget Overview/i);
    expect(headingElement).toBeInTheDocument();
  });

  test('shows loading state initially', () => {
    render(<App />);
    const loadingElement = screen.getByText(/Loading.../i);
    expect(loadingElement).toBeInTheDocument();
  });
});
