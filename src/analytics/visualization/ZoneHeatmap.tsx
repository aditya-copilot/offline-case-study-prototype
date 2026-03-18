interface ZoneHeatmapProps {
  zones?: string[];
}

export function ZoneHeatmap({ zones = [] }: ZoneHeatmapProps) {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Zone Heatmap</h3>
      <div className="grid grid-cols-3 gap-2">
        {zones.map((zone) => (
          <div
            key={zone}
            className="h-16 rounded bg-muted flex items-center justify-center"
          >
            {zone}
          </div>
        ))}
      </div>
    </div>
  );
}
