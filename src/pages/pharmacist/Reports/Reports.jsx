import React from 'react'
import { PharmacistLayout } from '@/layouts/pharmacist'

const MetricCard = ({ title, value, hint }) => (
  <div className="p-4 rounded-xl bg-base-100 border border-base-300">
    <div className="text-sm text-base-content/70">{title}</div>
    <div className="mt-2 text-2xl font-semibold text-base-content">{value}</div>
    <div className="mt-1 text-xs text-base-content/60">{hint}</div>
  </div>
)

const Reports = () => {
  const metrics = [
    { title: 'Dispensed Today', value: 76, hint: 'vs yesterday +8%' },
    { title: 'Incoming Requests', value: 19, hint: 'awaiting approval' },
    { title: 'Stock In', value: 320, hint: 'last 7 days' },
    { title: 'Stock Out', value: 275, hint: 'last 7 days' }
  ]

  return (
    <PharmacistLayout>
        <div className="p-6">
          <div className="mb-4">
            <h1 className="text-2xl font-semibold text-primary">Pharmacy Reports</h1>
            <p className="text-xs text-base-content/70">Summary metrics</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4 mb-6">
            {metrics.map((m, i) => <MetricCard key={i} title={m.title} value={m.value} hint={m.hint} />)}
          </div>
          <div className="p-6 rounded-xl bg-base-100 border border-base-300">
            <div className="text-base-content">Charts unavailable in static mode</div>
            <div className="mt-2 text-base-content/60 text-sm">Integrate with chosen chart library later</div>
          </div>
        </div>
    </PharmacistLayout>
  )
}

export default Reports
