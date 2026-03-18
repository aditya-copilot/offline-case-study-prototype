import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import type { FilteredSignal } from '@ble/types';

interface SignalChartProps {
  signals: FilteredSignal[];
  beaconColors: Map<string, string>;
  maxDataPoints?: number;
  height?: number;
}

export function SignalChart({
  signals,
  beaconColors,
  maxDataPoints = 50,
  height = 200
}: SignalChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const dataBuffers = useRef<Map<string, { x: number; y: number }[]>>(new Map());

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: []
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              boxWidth: 8
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            type: 'linear',
            display: true,
            title: {
              display: true,
              text: 'Time (s)'
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'RSSI (dBm)'
            },
            min: -90,
            max: -40,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          }
        }
      }
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;

    const now = Date.now() / 1000;

    signals.forEach(signal => {
      let buffer = dataBuffers.current.get(signal.beaconId);
      if (!buffer) {
        buffer = [];
        dataBuffers.current.set(signal.beaconId, buffer);
      }

      buffer.push({
        x: now,
        y: signal.filteredRSSI
      });

      while (buffer.length > maxDataPoints) {
        buffer.shift();
      }
    });

    const datasets = Array.from(dataBuffers.current.entries()).map(([beaconId, data]) => ({
      label: beaconId.slice(-8),
      data: [...data],
      borderColor: beaconColors.get(beaconId) || '#3b82f6',
      backgroundColor: beaconColors.get(beaconId) || '#3b82f6',
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      tension: 0.4
    }));

    chartRef.current.data.datasets = datasets;
    chartRef.current.update('none');
  }, [signals, beaconColors, maxDataPoints]);

  return (
    <div style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
