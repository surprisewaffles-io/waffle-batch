# Waffle Batch 🧇

**High-Performance React Faceting Engine**

`waffle-batch` is a specialized charting engine designed to render **thousands of small multiples** ("trellis charts") efficiently. It solves the performance bottlenecks of rendering massive dashboard grids by leveraging virtualization, shared resource scaling, and optimized data splitting.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-19-blue)
![Vite](https://img.shields.io/badge/vite-6-purple)

## 🚀 Features

-   **High-Performance Rendering**: Uses `react-intersection-observer` to virtualize charts, rendering only what is in the viewport (with skeleton loading states).
-   **Trellis Architecture**: Automatically groups flat datasets into faceted grids based on any key (e.g., `Region`, `Category`).
-   **Shared Scales**: Calculates global min/max domains across the entire dataset to ensure visual consistency between charts.
-   **Statistical Sorting**: Built-in analytics engine to sort charts by:
    -   **Total Value** (Sum)
    -   **Volatility** (Standard Deviation)
    -   **Trend Direction** (Linear Regression Slope)
    -   **Custom Logic** (User-defined functions)
-   **Interactive Search**: Real-time debounce filtering of charts.
-   **Responsive Layout**: CSS Grid-based layout that adapts chart width to available screen space.

## 🛠 Usage

### The `Trellis` Component

The core of the library is the `Trellis` component.

```tsx
import { Trellis } from './components/Trellis';

// 1. Prepare your data (flat array)
const salesData = [
  { region: 'West', month: 'Jan', value: 400 },
  { region: 'West', month: 'Feb', value: 300 },
  // ...
  { region: 'East', month: 'Jan', value: 200 },
];

// 2. Render
<Trellis
  data={salesData}
  facetKey="region" // Group by 'region'
  valueKey="value"  // Metric for scaling/sorting
  ChartComponent={MyChartComponent} // Your chart renderer
  minChartWidth={300}
  height={150}
  sharedScale={true} // Enforce same Y-axis across all charts
  sortConfig={{
    type: 'trend', // Sort by growth trend
    direction: 'desc'
  }}
/>
```

### sorting

The `sortConfig` prop accepts predefined algorithms or custom functions:

```typescript
// Sort by Volatility (Standard Deviation)
sortConfig={{ type: 'deviation', direction: 'desc' }}

// Sort by Custom Function (e.g., Max Value)
sortConfig={{ 
  type: (data) => Math.max(...data.map(d => d.value)),
  direction: 'desc' 
}}
```

## 🏗 Architecture

### Virtualization Strategy
Rendering 1,000 D3/SVG charts simultaneously will freeze the DOM. `waffle-batch` wraps every chart in an `IntersectionObserver`. 
-   **In View**: The heavy `ChartComponent` is mounted and rendered.
-   **Out of View**: A lightweight DOM node (skeleton) preserves the exact height/width to prevent layout thrashing.

### Faceting Pipeline
1.  **Group**: `d3-array.group` splits the flat dataset into Map entries.
2.  **Filter**: Search queries filter keys (debounced).
3.  **Calculate Metrics**: Statistical aggregations (Sum, Trend) are computed for visible groups.
4.  **Sort**: Groups are ordered based on metrics.
5.  **Render**: The sorted list is mapped to grid items.

## 📦 Installation

```bash
git clone https://github.com/mbuchthal/waffle-batch.git
cd waffle-batch
npm install
npm run dev
```

## ✅ Testing

Unit tests are written in **Vitest**.

```bash
npm test
```

Includes coverage for:
-   Faceting logic
-   Search debouncing
-   Sorting algorithms (including custom functions)
-   Shared scale calculation

## 📄 License

MIT
