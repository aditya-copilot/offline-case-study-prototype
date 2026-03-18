import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/Card';

export function RetailIntelligencePulse() {
  const [pulse, setPulse] = useState({
    activeUsers: 0,
    avgDwellTime: 0,
    conversionRate: 0
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse({
        activeUsers: Math.floor(Math.random() * 100),
        avgDwellTime: Math.floor(Math.random() * 30),
        conversionRate: Math.floor(Math.random() * 50)
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Retail Intelligence Pulse</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">{pulse.activeUsers}</p>
            <p className="text-sm text-muted-foreground">Active Users</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-accent">{pulse.avgDwellTime}m</p>
            <p className="text-sm text-muted-foreground">Avg Dwell</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-success">{pulse.conversionRate}%</p>
            <p className="text-sm text-muted-foreground">Conversion</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
