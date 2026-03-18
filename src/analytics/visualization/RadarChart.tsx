interface RadarChartProps {
  metrics?: { label: string; value: number }[];
}

export function RadarChart({ metrics = [] }: RadarChartProps) {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Radar Chart</h3>
      <div className="aspect-square rounded-full bg-muted flex items-center justify-center">
        {metrics.length === 0 ? (
          <span className="text-muted-foreground">No data</span>
        ) : (
          <div className="text-center">
            {metrics.map((m) => (
              <div key={m.label}>
                {m.label}: {m.value}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
