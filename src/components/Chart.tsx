'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCurrencyPreferences } from './CurrencyPreferencesProvider';

interface TransactionChartProps {
  data: {
    labels: string[];
    income: number[];
    expense: number[];
  };
  minHeight?: number;
}

interface CategoryChartProps {
  data: {
    labels: string[];
    values: number[];
    colors: string[];
  };
  minHeight?: number;
}

function hasAnyPositiveValue(values: number[]) {
  return values.some((value) => Number.isFinite(value) && value > 0);
}

function useCompactCharts() {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const sync = () => setCompact(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener('change', sync);
    return () => mediaQuery.removeEventListener('change', sync);
  }, []);

  return compact;
}

function useHasClientLayout() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  return mounted;
}

function useChartContainerReady<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    let raf = 0;
    let timeoutId: number | null = null;

    const sync = () => {
      const rect = element.getBoundingClientRect();
      setSize({
        width: Math.max(0, Math.floor(rect.width)),
        height: Math.max(0, Math.floor(rect.height)),
      });
    };

    sync();
    raf = window.requestAnimationFrame(sync);
    timeoutId = window.setTimeout(sync, 80);

    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(sync);
    });
    observer.observe(element);

    window.addEventListener('load', sync);

    return () => {
      observer.disconnect();
      window.removeEventListener('load', sync);
      window.cancelAnimationFrame(raf);
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  return {
    ref,
    width: size.width,
    height: size.height,
    ready: size.width > 24 && size.height > 24,
  };
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  const { locale } = useCurrencyPreferences();

  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-1 px-4 py-3 shadow-sm">
      {label ? <div className="mb-2 text-[0.72rem] font-medium text-text-3">{label}</div> : null}
      <div className="grid gap-1.5">
        {payload.map((item) => (
          <div key={`${item.name}-${item.value}`} className="flex items-center gap-2 text-sm text-text-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color || 'var(--accent)' }}
            />
            <span className="font-medium text-text-1">{item.name}</span>
            <span className="ml-auto font-semibold text-text-1">
              {new Intl.NumberFormat(locale).format(item.value || 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutLegend({
  entries,
  compact,
}: {
  entries: Array<{ name: string; value: number; color: string }>;
  compact: boolean;
}) {
  const { locale } = useCurrencyPreferences();

  return (
    <div className={compact ? 'mt-4 grid gap-2 sm:grid-cols-2' : 'grid min-w-[10rem] gap-2'}>
      {entries.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 py-1">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="truncate text-sm text-text-2">{entry.name}</span>
          <span className="ml-auto text-sm font-medium text-text-1">
            {new Intl.NumberFormat(locale).format(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TransactionBarChart({
  data,
  minHeight = 250,
}: TransactionChartProps) {
  const mounted = useHasClientLayout();
  const { ref, ready, width, height } = useChartContainerReady<HTMLDivElement>();

  const chartData = useMemo(
    () =>
      data.labels.map((label, index) => ({
        label,
        Income: data.income[index] ?? 0,
        Expense: data.expense[index] ?? 0,
      })),
    [data]
  );
  const hasChartData = hasAnyPositiveValue(data.income) || hasAnyPositiveValue(data.expense);

  if (!mounted) {
    return <div className="w-full rounded-2xl bg-surface-2" style={{ minHeight }} />;
  }

  return (
    <div ref={ref} className="h-full w-full" style={{ minHeight }}>
      {ready && hasChartData ? (
        <BarChart width={width} height={height} data={chartData} barGap={8} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border-subtle)" strokeDasharray="3 7" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--text-3)', fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--text-3)', fontSize: 12 }}
            width={48}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--accent-soft)', opacity: 0.28, radius: 16 }} />
          <Bar dataKey="Income" fill="var(--success)" radius={[10, 10, 8, 8]} maxBarSize={18} />
          <Bar dataKey="Expense" fill="var(--danger)" radius={[10, 10, 8, 8]} maxBarSize={18} />
        </BarChart>
      ) : (
        <div className="grid h-full w-full place-items-center rounded-2xl bg-surface-2 px-3 text-center text-[var(--font-size-meta)] text-text-3">
          {hasChartData ? 'Preparing chart...' : 'No chart data yet'}
        </div>
      )}
    </div>
  );
}

export function CategoryDoughnutChart({
  data,
  minHeight = 250,
}: CategoryChartProps) {
  const compact = useCompactCharts();
  const mounted = useHasClientLayout();
  const { ref, ready, width, height } = useChartContainerReady<HTMLDivElement>();

  const chartData = useMemo(
    () =>
      data.labels.map((label, index) => ({
        name: label,
        value: data.values[index] ?? 0,
        color: data.colors[index] ?? 'var(--accent)',
      })),
    [data]
  );
  const hasChartData = hasAnyPositiveValue(data.values);

  if (!mounted) {
    return <div className="w-full rounded-2xl bg-surface-2" style={{ minHeight }} />;
  }

  return (
    <div className={compact ? 'grid h-full gap-4' : 'grid h-full grid-cols-[minmax(0,1fr)_11rem] gap-4'}>
      <div ref={ref} className="h-full" style={{ minHeight }}>
        {ready ? (
          hasChartData ? (
          <PieChart width={width} height={height}>
            <Tooltip content={<ChartTooltip />} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={compact ? 54 : 64}
              outerRadius={compact ? 82 : 92}
              paddingAngle={3}
              stroke="hsl(var(--chart-ring-channel) / 0.9)"
              strokeWidth={3}
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
          ) : (
            <div className="grid h-full place-items-center rounded-2xl bg-surface-2 px-3 text-center text-[var(--font-size-meta)] text-text-3">
              No chart data yet
            </div>
          )
        ) : (
          <div className="grid h-full w-full place-items-center rounded-2xl bg-surface-2 px-3 text-center text-[var(--font-size-meta)] text-text-3">
            Preparing chart...
          </div>
        )}
      </div>
      <DonutLegend entries={chartData} compact={compact} />
    </div>
  );
}
