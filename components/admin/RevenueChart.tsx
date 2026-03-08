'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import type { MonthlyRevenue } from '@/types'

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, Filler
)

interface RevenueChartProps {
  data: MonthlyRevenue[]
}

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr',
  '05': 'Mai', '06': 'Juin', '07': 'Juil', '08': 'Août',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc',
}

export function RevenueChart({ data }: RevenueChartProps) {
  const labels = data.map((d) => {
    const [year, month] = d.month.split('-')
    return `${MONTH_LABELS[month]} ${year.slice(2)}`
  })

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Boutique',
        data: data.map((d) => d.shop_revenue),
        backgroundColor: 'rgba(201, 168, 76, 0.8)',
        borderColor: '#C9A84C',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Chambres',
        data: data.map((d) => d.booking_revenue),
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderColor: '#6366f1',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: { size: 12 },
          color: '#52525b',
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 8,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: { dataset: { label?: string }; raw: unknown }) =>
            ` ${ctx.dataset.label}: ${Number(ctx.raw).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`,
        },
      },
    },
    scales: {
      x: {
        stacked: false,
        grid: { display: false },
        ticks: { color: '#71717a', font: { size: 11 } },
      },
      y: {
        stacked: false,
        grid: { color: '#f4f4f5' },
        ticks: {
          color: '#71717a',
          font: { size: 11 },
          callback: (value: string | number) =>
            `${Number(value).toLocaleString('fr-FR')} €`,
        },
      },
    },
  }

  return (
    <div className="w-full h-72">
      <Bar data={chartData} options={options} />
    </div>
  )
}
