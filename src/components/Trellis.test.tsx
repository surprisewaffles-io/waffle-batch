import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Trellis } from './Trellis';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock react-intersection-observer to always be in view
vi.mock('react-intersection-observer', () => ({
  useInView: () => ({
    ref: vi.fn(),
    inView: true, // Force visible
  }),
}));

// Mock Chart Component
const MockChart = ({ data, yDomain }: any) => (
  <div data-testid="mock-chart">
    <span data-testid="chart-count">{data.length}</span>
    <span data-testid="chart-ydomain">{JSON.stringify(yDomain)}</span>
  </div>
);

const MOCK_DATA = [
  { region: 'A', category: 'X', value: 10 },
  { region: 'A', category: 'Y', value: 20 },
  { region: 'B', category: 'X', value: 30 },
  { region: 'B', category: 'Y', value: 40 },
];

describe('Trellis Component', () => {

  it('renders correctly with given facets', () => {
    render(
      <Trellis
        data={MOCK_DATA}
        facetKey="region"
        ChartComponent={MockChart}
        minChartWidth={100}
        height={100}
      />
    );

    // Should render 2 facets (Region A and B)
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('filters charts when search is used', async () => {
    render(
      <Trellis
        data={MOCK_DATA}
        facetKey="region"
        ChartComponent={MockChart}
        minChartWidth={100}
        height={100}
        searchable={true}
      />
    );

    const input = screen.getByPlaceholderText('Search charts...');
    fireEvent.change(input, { target: { value: 'A' } });

    // Wait for B to disappear (debounce delay)
    await waitFor(() => {
      expect(screen.queryByText('B')).not.toBeInTheDocument();
    });
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('sorts charts by metric (sum)', () => {
    // A has sum(10, 20) = 30
    // B has sum(30, 40) = 70
    render(
      <Trellis
        data={MOCK_DATA}
        facetKey="region"
        ChartComponent={MockChart}
        valueKey="value"
        sortConfig={{ type: 'sum', direction: 'desc' }}
      />
    );

    const headers = screen.getAllByRole('heading');
    // Descending sort: B (70) should come before A (30)
    expect(headers[0]).toHaveTextContent('B');
    expect(headers[1]).toHaveTextContent('A');
  });

  it('sorts charts by custom function', () => {
    // Custom sort: Sort by number of data points (length)
    // A has 2 points.
    // Let's use custom data where B has MORE points
    const CUSTOM_DATA = [
      { region: 'A', category: 'X', value: 10 },
      { region: 'B', category: 'X', value: 30 },
      { region: 'B', category: 'Y', value: 40 },
      { region: 'B', category: 'Z', value: 50 },
    ];

    render(
      <Trellis
        data={CUSTOM_DATA}
        facetKey="region"
        ChartComponent={MockChart}
        // valueKey not strictly required for custom sort logic unless the custom function uses it
        sortConfig={{
          type: (data) => data.length, // Sort by count
          direction: 'desc'
        }}
      />
    );

    const headers = screen.getAllByRole('heading');
    // B (3 items) > A (1 item)
    expect(headers[0]).toHaveTextContent('B');
    expect(headers[1]).toHaveTextContent('A');
  });

  it('calculates shared scale correctly', () => {
    render(
      <Trellis
        data={MOCK_DATA}
        facetKey="region"
        ChartComponent={MockChart}
        minChartWidth={100}
        height={100}
        sharedScale={true}
        valueKey="value"
      />
    );

    // Global max is 40. Scale should be [0, 40]
    // Check the first chart's yDomain prop
    const firstChart = screen.getAllByTestId('mock-chart')[0];
    const yDomain = firstChart.querySelector('[data-testid="chart-ydomain"]');
    expect(yDomain).toHaveTextContent('[0,40]');
  });
});
