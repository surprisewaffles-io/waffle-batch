import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DetailModal } from './DetailModal';

// Mock Chart Comp
const MockChart = ({ data, showXAxis }: any) => (
  <div data-testid="mock-chart">
    Chart with {data.length} items.
    Axis: {showXAxis ? 'Visible' : 'Hidden'}
  </div>
);

describe('DetailModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: "Test Chart",
    data: [{ id: 1, val: 10 }, { id: 2, val: 20 }],
    ChartComponent: MockChart,
    commonProps: { color: 'red' }
  };

  it('renders nothing when closed', () => {
    render(<DetailModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("Test Chart")).toBeNull();
  });

  it('renders content when open', () => {
    render(<DetailModal {...defaultProps} />);
    expect(screen.getByText("Test Chart")).toBeInTheDocument();
    expect(screen.getByTestId("mock-chart")).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.textContent === "2 data points")).toBeInTheDocument();
  });

  it('passes high-fidelity props to chart', () => {
    render(<DetailModal {...defaultProps} />);
    // Our DetailedModal forces showXAxis=true
    expect(screen.getByText(/Axis: Visible/)).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    render(<DetailModal {...defaultProps} />);
    const closeBtn = screen.getByRole('button');
    fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop clicked', () => {
    const { container } = render(<DetailModal {...defaultProps} />);
    // The backdrop is the first div child of the fixed overlay
    // But testing library doesn't easily expose "backdrop".
    // We can look for the div with specific class or just click the outer container?
    // The component structure:
    // <div fixed...>
    //   <div absolute inset-0 ... onClick=onClose /> (Backdrop)
    //   <div panel...>

    // We can select by class using querySelector since we don't have a specific role for backdrop
    const backdrop = container.querySelector('.backdrop-blur-sm');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(defaultProps.onClose).toHaveBeenCalled();
    } else {
      throw new Error("Backdrop not found in test");
    }
  });

  it('calls onClose on Escape key', () => {
    render(<DetailModal {...defaultProps} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
