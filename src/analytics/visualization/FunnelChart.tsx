interface FunnelChartProps {
  stages?: { name: string; value: number }[];
}

export function FunnelChart({ stages = [] }: FunnelChartProps) {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Funnel</h3>
      <div className="space-y-2">
        {stages.map((stage, i) => (
          <div
            key={i}
            className="h-8 bg-primary rounded"
            style={{ width: `${stage.value}%` }}
          >
            <span className="px-2 text-sm">{stage.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
