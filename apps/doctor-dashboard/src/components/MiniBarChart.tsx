export interface MiniBarChartProps {
  data: { label: string; value: number }[];
  color?: string;
}

/** A small, dependency-free bar chart - real data in, real bars out, no fabricated numbers. */
export function MiniBarChart({ data, color = 'fill-primary-600' }: MiniBarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const barWidth = 100 / data.length;

  return (
    <div>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-24 w-full overflow-visible">
        {data.map((d, i) => {
          const height = (d.value / max) * 36;
          return (
            <rect
              key={i}
              x={i * barWidth + barWidth * 0.2}
              y={40 - height}
              width={barWidth * 0.6}
              height={height}
              rx={1}
              className={color}
            />
          );
        })}
      </svg>
      <div className="mt-1 flex text-[10px] text-neutral-400">
        {data.map((d, i) => (
          <span key={i} style={{ width: `${barWidth}%` }} className="text-center">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
