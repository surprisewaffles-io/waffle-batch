import { useMemo } from 'react';
import { Trellis } from './components/Trellis';
import type { MetricType } from './components/utils/analytics';
import { useUrlState } from './hooks/useUrlState';
import { LineChart } from '@waffle-charts/components/waffle/LineChart';
import { BarChart } from '@waffle-charts/components/waffle/BarChart';
import { Settings, BarChart2, TrendingUp, ArrowDownAZ, ArrowUpAZ, Link as LinkIcon } from 'lucide-react';
import './index.css';

// --- Mock Data Generation ---
// Generate enough regions/categories for ~1000 charts (True "Batch" Mode)
const REGIONS = Array.from({ length: 50 }, (_, i) => `Region ${i + 1}`);
const CATEGORIES = Array.from({ length: 20 }, (_, i) => `Category ${String.fromCharCode(65 + i)}`); // A-T
const DATES = Array.from({ length: 12 }, (_, i) => new Date(2024, i, 1));

type SalesData = {
  id: string;
  region: string;
  category: string;
  date: Date;
  revenue: number;
};

const generateData = (): SalesData[] => {
  const data: SalesData[] = [];
  console.log(`Generating data for ${REGIONS.length * CATEGORIES.length} charts...`);

  REGIONS.forEach((region, rI) => {
    CATEGORIES.forEach((category, cI) => {
      // Base trend + random noise
      let value = 1000 + Math.random() * 5000;

      // Make "Region 1" and "Electronics" heavy to test shared scale
      if (rI === 0) value *= 3;
      if (cI === 0) value *= 1.5;

      DATES.forEach((date, i) => {
        // Add seasonality
        const seasonal = Math.sin(i / 2) * 1000;
        const random = (Math.random() - 0.5) * 500;
        data.push({
          id: `${region}-${category}-${i}`,
          region,
          category,
          date,
          revenue: Math.max(0, Math.round(value + seasonal + random)),
        });
      });
    });
  });
  return data;
};

const MOCK_DATA = generateData();

const Checkbox = ({ checked, onChange, label }: { checked: boolean, onChange: (checked: boolean) => void, label: string }) => (
  <label className="flex items-center gap-2 cursor-pointer text-sm hover:text-indigo-500 transition-colors group select-none">
    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${checked
      ? 'bg-indigo-600 border-indigo-600'
      : 'bg-white border-gray-300 group-hover:border-indigo-400'
      }`}>
      {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
    </div>
    {label}
    <input
      type="checkbox"
      className="hidden"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
  </label>
);

function App() {
  const [sharedScale, setSharedScale] = useUrlState<boolean>('scale', true);
  const [showAxes, setShowAxes] = useUrlState<boolean>('axes', false);
  const [isDrilldown, setIsDrilldown] = useUrlState<boolean>('drill', false);
  const [chartType, setChartType] = useUrlState<'line' | 'bar'>('chart', 'line');
  const [sortType, setSortType] = useUrlState<MetricType | 'max'>('sort', 'default');
  const [sortDirection, setSortDirection] = useUrlState<'asc' | 'desc'>('dir', 'desc');
  const [searchQuery, setSearchQuery] = useUrlState<string>('search', '');

  const ChartComponent = useMemo(() => {
    return (props: any) => {
      const commonProps = {
        ...props,
        yKey: "revenue",
        showYAxis: showAxes,
        showXAxis: true,
        showGridRows: true, // Grid rows help compare across charts
        margin: { top: 10, right: 10, bottom: 25, left: showAxes ? 40 : 10 },
      };

      if (chartType === 'line') {
        return (
          <LineChart
            {...commonProps}
            xKey="date"
            lineColor="#6366f1"
            areaColor="text-indigo-500"
          />
        );
      }

      return (
        <BarChart
          {...commonProps}
          xKey="date"
          barColor="#8b5cf6"
          tickFormat={(d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short' })}
        />
      );
    }
  }, [showAxes, chartType]);

  return (
    <div className="min-h-screen bg-canvas-bg text-canvas-fg p-8">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Waffle Batch</h1>
          <p className="text-canvas-fg/60 max-w-2xl">
            High-performance faceting engine.
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
              {REGIONS.length * CATEGORIES.length} Charts
            </span>
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-6 mb-8 p-4 border border-canvas-border rounded-lg bg-canvas-subtle sticky top-4 z-10 shadow-sm backdrop-blur-md bg-opacity-90">
        <div className="flex items-center gap-2 pr-6 border-r border-canvas-border">
          <Settings className="w-4 h-4 text-canvas-fg/50" />
          <span className="text-xs font-semibold uppercase tracking-wider text-canvas-fg/40">Config</span>
        </div>

        {/* Visibility Controls */}
        <div className="flex flex-col gap-2">
          <Checkbox
            label="Enforce Shared Scale"
            checked={sharedScale}
            onChange={(checked) => setSharedScale(checked)}
          />
          <Checkbox
            label="Show Y-Axis"
            checked={showAxes}
            onChange={(checked) => setShowAxes(checked)}
          />
          <div className="flex items-center gap-2">
            <Checkbox
              label="Enable Drill-Down"
              checked={isDrilldown}
              onChange={(checked) => setIsDrilldown(checked)}
            />
            {isDrilldown && <LinkIcon className="w-3 h-3 text-indigo-500" />}
          </div>
        </div>

        {/* Chart Type Control */}
        <div className="flex items-center bg-white border border-canvas-border rounded-lg p-1">
          <button
            onClick={() => setChartType('line')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${chartType === 'line' ? 'bg-indigo-50 text-indigo-700' : 'text-canvas-fg/60 hover:text-canvas-fg'
              }`}
          >
            <TrendingUp className="w-4 h-4" /> Line
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${chartType === 'bar' ? 'bg-indigo-50 text-indigo-700' : 'text-canvas-fg/60 hover:text-canvas-fg'
              }`}
          >
            <BarChart2 className="w-4 h-4" /> Bar
          </button>
        </div>

        {/* Sorting Controls */}
        <div className="flex items-center gap-2 ml-auto pl-6 border-l border-canvas-border">
          <span className="text-xs text-canvas-fg/50 font-medium">Sort by</span>
          <select
            value={sortType}
            onChange={(e) => setSortType(e.target.value as MetricType)}
            className="text-sm bg-white border border-canvas-border rounded-md px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="default">Default (A-Z)</option>
            <option value="max">Max Revenue (Custom)</option>
            <option value="sum">Total Revenue</option>
            <option value="deviation">Volatility</option>
            <option value="trend">Trend Direction</option>
          </select>
          <button
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            className="p-1.5 bg-white border border-canvas-border rounded-md hover:bg-gray-50 text-canvas-fg/70"
            title={sortDirection === 'asc' ? "Ascending" : "Descending"}
          >
            {sortDirection === 'asc' ? <ArrowUpAZ className="w-4 h-4" /> : <ArrowDownAZ className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <main className="space-y-12">
        <section>
          <h2 className="text-xl font-semibold mb-4">Sales Performance (Region x Category)</h2>
          <p className="text-sm text-canvas-fg/60 mb-6">
            Rendering {REGIONS.length * CATEGORIES.length} interactive charts with shared scales and virtualization.
          </p>
          <Trellis
            data={MOCK_DATA}
            // Create a unique composite key for each chart (Region + Category)
            // This ensures each chart only sees 12 months of unique data, fixing key collisions.
            facetKey={(d) => `${d.region} • ${d.category}`}
            ChartComponent={ChartComponent}
            sharedScale={sharedScale}
            valueKey="revenue"
            height={160}
            minChartWidth={280}
            searchable={true}
            query={searchQuery}
            onSearchChange={setSearchQuery}
            onChartClick={isDrilldown ? (key) => {
              // Parse "Region • Category" back to just "Region" if needed, 
              // or simply pass the whole key if the dashboard supports generic filtering.
              // For now, let's assume we want to filter by the Region part.
              const region = key.split(' • ')[0];
              const url = `https://mbuchthal.github.io/waffle-board/#/dashboard?region=${encodeURIComponent(region)}`;
              window.open(url, '_blank');
            } : undefined}
            sortConfig={{
              type: sortType === 'max'
                ? (subset) => Math.max(...subset.map(d => d.revenue))
                : sortType as MetricType,
              direction: sortDirection
            }}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
