import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { cn } from '@core/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface SignalGraphProps {
  data: Map<string, Array<{ timestamp: number; rssi: number; filtered?: number }>>;
  maxPoints?: number;
  className?: string;
}

export function SignalGraph({ data, maxPoints = 50, className }: SignalGraphProps) {
  const chartData: ChartData<'line'> = {
    labels: Array.from({ length: maxPoints }, (_, i) => i.toString()),
    datasets: Array.from(data.entries()).map(([beaconId, signals], index) => {
      const recentSignals = signals.slice(-maxPoints);
      const colors = [
        'rgb(59, 130, 246)',
        'rgb(16, 185, 129)',
        'rgb(245, 158, 11)',
        'rgb(239, 68, 68)',
        'rgb(139, 92, 246)',
        'rgb(236, 72, 153)'
      ];
      const color = colors[index % colors.length];

      return {
        label: beaconId.slice(-8),
        data: recentSignals.map(s => s.rssi),
        borderColor: color,
        backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.1)'),
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4
      };
    })
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0
    },
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          boxWidth: 12,
          usePointStyle: true
        }
      },
      title: {
        display: true,
        text: 'RSSI Signal History'
      }
    },
    scales: {
      x: {
        display: false
      },
      y: {
        min: -95,
        max: -45,
        title: {
          display: true,
          text: 'RSSI (dBm)'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  };

  return (
    <div className={cn('bg-card rounded-lg border p-4', className)}>
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
