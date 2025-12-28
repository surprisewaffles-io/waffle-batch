import React, { useMemo, useState, useEffect } from 'react';
import { group } from 'd3-array';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useInView } from 'react-intersection-observer';
import { Search } from 'lucide-react';
import { calculateMetric, type MetricType } from './utils/analytics.js';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// Hook: useDebounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export type SortConfig<T> = {
  type: MetricType | ((data: T[]) => number);
  direction: 'asc' | 'desc';
};

export type TrellisProps<T> = {
  data: T[];
  facetKey: keyof T | ((d: T) => string);
  ChartComponent: React.ComponentType<{ data: T[]; width?: number; height?: number; yDomain?: [number, number] }>;
  valueKey?: keyof T | ((d: T) => number);
  yDomain?: [number, number];
  sharedScale?: boolean;
  className?: string;
  minChartWidth?: number;
  height?: number;
  SkeletonComponent?: React.ComponentType<{ height: number }>;
  searchable?: boolean;
  /** Controlled search query. If provided, Trellis filters based on this. */
  query?: string;
  /** Callback when search input changes. Required if query is provided. */
  onSearchChange?: (query: string) => void;
  /** Optional callback when a chart is clicked */
  onChartClick?: (key: string, data: T[]) => void;
  sortConfig?: SortConfig<T>;
};

// Default Shimmer Skeleton
const DefaultSkeleton = ({ height }: { height: number }) => (
  <div
    className="w-full animate-pulse bg-canvas-subtle rounded-md overflow-hidden"
    style={{ height }}
  >
    <div className="h-full w-full bg-gradient-to-r from-transparent via-canvas-border/50 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
  </div>
);

// Internal component for lazy loading
const TrellisItem = <T,>({
  facetKey,
  data,
  ChartComponent,
  SkeletonComponent = DefaultSkeleton,
  height,
  yDomain,
  onClick,
}: {
  facetKey: string;
  data: T[];
  ChartComponent: TrellisProps<T>['ChartComponent'];
  SkeletonComponent?: React.ComponentType<{ height: number }>;
  height: number;
  yDomain?: [number, number];
  onClick?: (key: string, data: T[]) => void;
}) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px 0px',
  });

  const isClickable = !!onClick;

  return (
    <div
      ref={ref}
      onClick={() => isClickable && onClick(facetKey, data)}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick(facetKey, data);
        }
      }}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      className={cn(
        "flex flex-col border border-canvas-border rounded-lg p-4 bg-canvas-subtle/30 transition-all duration-300",
        isClickable && "cursor-pointer hover:border-indigo-400 hover:ring-2 hover:ring-indigo-100 hover:shadow-md active:scale-[0.99]"
      )}
      style={{ opacity: inView ? 1 : 0.6 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-canvas-fg/70 truncate" title={facetKey}>{facetKey}</h3>
        {isClickable && <div className="text-xs text-indigo-400/0 group-hover:text-indigo-500/100 transition-opacity">↗</div>}
      </div>

      <div style={{ height, position: 'relative' }}>
        {inView ? (
          <ChartComponent
            data={data}
            width={undefined}
            height={height}
            yDomain={yDomain}
          />
        ) : (
          <SkeletonComponent height={height} />
        )}
      </div>
    </div>
  );
};

export function Trellis<T>({
  data,
  facetKey,
  ChartComponent,
  valueKey,
  yDomain: explicitYDomain,
  sharedScale = true,
  className,
  minChartWidth = 300,
  height = 200,
  SkeletonComponent,
  searchable,
  query,
  onSearchChange,
  onChartClick,
  sortConfig = { type: 'default', direction: 'asc' }, // Default sort
}: TrellisProps<T>) {
  // Use internal state if not controlled, otherwise use prop
  const [internalSearchQuery, setInternalSearchQuery] = useState('');

  const isControlled = query !== undefined;
  const activeQuery = isControlled ? query : internalSearchQuery;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (isControlled && onSearchChange) {
      onSearchChange(val);
    } else {
      setInternalSearchQuery(val);
    }
  };

  const debouncedQuery = useDebounce(activeQuery, 300);

  // 1. Split: Group data by facet key
  const facets = useMemo(() => {
    return Array.from(
      group(data, (d) => {
        if (typeof facetKey === 'function') return facetKey(d);
        return String(d[facetKey]);
      })
    );
  }, [data, facetKey]);

  // 2. Filter & Sort
  const processedFacets = useMemo(() => {
    // A. Filter
    let result = facets;
    if (debouncedQuery) {
      result = facets.filter(([key]) =>
        key.toLowerCase().includes(debouncedQuery.toLowerCase())
      );
    }

    // B. Sort
    if (sortConfig.type !== 'default') {
      // Calculate metric for each facet once
      const withMetrics = result.map(([key, subset]) => {
        let metric = 0;
        if (typeof sortConfig.type === 'function') {
          metric = sortConfig.type(subset);
        } else if (valueKey && typeof sortConfig.type === 'string') {
          metric = calculateMetric(subset, valueKey, sortConfig.type);
        }

        return {
          key,
          subset,
          metric
        };
      });

      withMetrics.sort((a, b) => {
        return sortConfig.direction === 'asc'
          ? a.metric - b.metric
          : b.metric - a.metric;
      });

      return withMetrics.map(item => [item.key, item.subset] as [string, T[]]);
    }

    // Default alphanumeric sort if no metric
    return result.sort((a, b) => a[0].localeCompare(b[0]));

  }, [facets, debouncedQuery, sortConfig, valueKey]);

  // 2. Shared Scale Logic
  const globalYDomain = useMemo(() => {
    if (!sharedScale && !explicitYDomain) return undefined;
    if (explicitYDomain) return explicitYDomain;
    if (!valueKey) return undefined;

    let min = Infinity;
    let max = -Infinity;

    // Use all data for global scale, not just filtered
    data.forEach((d) => {
      const val = typeof valueKey === 'function' ? valueKey(d) : Number(d[valueKey]);
      if (val < min) min = val;
      if (val > max) max = val;
    });

    if (min > 0) min = 0;

    return [min, max] as [number, number];
  }, [data, sharedScale, explicitYDomain, valueKey]);

  return (
    <div className={cn("w-full space-y-4", className)}>
      {searchable && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-canvas-fg/40" />
          <input
            type="text"
            placeholder="Search charts..."
            value={activeQuery} // Bind to immediate state
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-2 text-sm border border-canvas-border rounded-md bg-canvas-bg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-canvas-fg/40 font-mono">
            {processedFacets.length} / {facets.length}
          </div>
        </div>
      )}

      {processedFacets.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-canvas-border rounded-lg text-canvas-fg/50">
          No charts match your filter.
        </div>
      ) : (
        <div
          className='grid gap-4 w-full'
          style={{
            gridTemplateColumns: `repeat(auto-fill, minmax(${minChartWidth}px, 1fr))`,
          }}
        >
          {processedFacets.map(([key, subset]) => (
            <TrellisItem
              key={key}
              facetKey={key}
              data={subset}
              ChartComponent={ChartComponent}
              SkeletonComponent={SkeletonComponent}
              height={height}
              yDomain={globalYDomain}
              onClick={onChartClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
