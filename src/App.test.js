import { render, screen } from '@testing-library/react';
import App from './App';

test('renders loading state', () => {
  render(<App />);
  const loadingText = screen.getByText(/Loading your estimates/i);
  expect(loadingText).toBeInTheDocument();
});
