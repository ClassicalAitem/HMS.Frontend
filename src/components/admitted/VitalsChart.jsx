import React from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'

const VitalsChart = ({ data = [] }) => {
  if (!Array.isArray(data) || data.length === 0) return <div className="p-4">No vitals to display</div>

  const formatted = data
    .map(d => ({
      time: new Date(d.createdAt).toLocaleString(),
      temperature: d.temperature ?? null,
      pulse: d.pulse ?? null,
      respiration: d.respiratoryRate ?? d.respiration ?? null,
    }))
    .reverse()

  return (
    <div style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer>
        <LineChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" tick={{ fontSize: 10 }} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="temperature" stroke="#ef4444" dot={false} />
          <Line type="monotone" dataKey="pulse" stroke="#3b82f6" dot={false} />
          <Line type="monotone" dataKey="respiration" stroke="#10b981" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default VitalsChart
