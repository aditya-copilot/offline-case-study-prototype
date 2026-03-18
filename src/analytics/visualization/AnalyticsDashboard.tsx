import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/Card';

export function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState({
    totalSessions: 0,
    avgDuration: 0
  });

  useEffect(() => {
    setMetrics({
      totalSessions: 0,
      avgDuration: 0
    });
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Sessions</p>
              <p className="text-2xl font-bold">{metrics.totalSessions}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Duration</p>
              <p className="text-2xl font-bold">{metrics.avgDuration}m</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
