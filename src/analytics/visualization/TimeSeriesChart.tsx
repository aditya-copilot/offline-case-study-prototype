interface TimeSeriesChartProps {
  data?: { time: string; value: number }[];
}

export function TimeSeriesChart({ data = [] }: TimeSeriesChartProps) {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Time Series</h3>
      <div className="h-48 bg-muted rounded flex items-end p-2 gap-1">
        {data.map((point, i) => (
          <div
            key={i}
            className="flex-1 bg-primary rounded-t"
            style={{ height: `${point.value}%` }}
          />
        ))}
      </div>
    </div>
  );
}
