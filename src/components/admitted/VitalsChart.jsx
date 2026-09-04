import React, { useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { formatNigeriaDateTimeShort, formatNigeriaTime } from '@/utils/formatDateTimeUtils'
import {
  FaHeartbeat,
  FaThermometerHalf,
  FaLungs,
  FaChevronDown,
  FaChevronUp,
  FaChartLine,
} from 'react-icons/fa'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0]?.payload
    return (
      <div className="bg-base-100 p-3 rounded-xl shadow-xl border border-base-200 text-xs space-y-1.5 z-50">
        <p className="font-bold text-base-content border-b border-base-200 pb-1 mb-1">
          {dataPoint?.time || label}
        </p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
              {entry.name}:
            </span>
            <span className="font-bold text-base-content">
              {entry.value}{' '}
              {entry.name.includes('Temp')
                ? '°C'
                : entry.name.includes('Pulse')
                ? 'bpm'
                : entry.name.includes('SpO2')
                ? '%'
                : '/min'}
            </span>
          </div>
        ))}
        {dataPoint?.bp && (
          <div className="flex items-center justify-between gap-4 pt-1 border-t border-base-200 text-base-content/70">
            <span>Blood Pressure:</span>
            <span className="font-bold text-base-content">{dataPoint.bp} mmHg</span>
          </div>
        )}
      </div>
    )
  }
  return null
}

const VitalsChart = ({ data = [], vitals }) => {
  const [isCollapsed, setIsCollapsed] = useState(true)

  // Support both vitals and data prop seamlessly
  const vitalsList =
    (Array.isArray(vitals) && vitals.length > 0 ? vitals : null) ||
    (Array.isArray(data) && data.length > 0 ? data : [])

  // Sort chronological (oldest to newest for progressive timeline charting)
  const sorted = [...vitalsList].sort(
    (a, b) => new Date(a.createdAt || a.recordedAt || 0) - new Date(b.createdAt || b.recordedAt || 0)
  )

  const formatted = sorted.map((d, idx) => {
    const rawDate = d.createdAt || d.recordedAt
    const dateObj = rawDate ? new Date(rawDate) : null
    const shortTime = formatNigeriaTime(rawDate)
    const fullDateTime = formatNigeriaDateTimeShort(rawDate)

    // Axis label: show short date + time if valid date, else fallback
    const axisLabel =
      dateObj && !isNaN(dateObj.getTime())
        ? `${dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} ${shortTime}`
        : shortTime || `#${idx + 1}`

    return {
      time: fullDateTime,
      axisLabel,
      shortTime,
      temperature:
        typeof d.temperature === 'number'
          ? d.temperature
          : d.temperature
          ? Number(d.temperature)
          : null,
      pulse: typeof d.pulse === 'number' ? d.pulse : d.pulse ? Number(d.pulse) : null,
      respiration:
        typeof d.respiratoryRate === 'number'
          ? d.respiratoryRate
          : d.respiration
          ? Number(d.respiration)
          : d.respiratoryRate
          ? Number(d.respiratoryRate)
          : null,
      bp: d.bp || null,
      spo2: typeof d.spo2 === 'number' ? d.spo2 : d.spo2 ? Number(d.spo2) : null,
    }
  })

  // Latest reading for stat indicators
  const latest = sorted.length > 0 ? sorted[sorted.length - 1] : null

  return (
    <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden transition-all">
      {/* Header & Mini Stat Pills (Always visible, even when collapsed) */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-pointer hover:bg-base-200/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
            <FaChartLine className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-base-content flex items-center gap-2">
                Continuous Clinical Vitals Observation Chart
              </h3>
              {sorted.length > 0 && (
                <span className="badge badge-primary badge-outline badge-xs sm:badge-sm font-semibold">
                  {sorted.length} {sorted.length === 1 ? 'Reading' : 'Readings'}
                </span>
              )}
            </div>
            <p className="text-xs text-base-content/60 mt-0.5">
              Chronological temperature, pulse, and respiration observation timeline
            </p>
          </div>
        </div>

        {/* Quick summary indicators + Collapse toggle button */}
        <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {latest?.temperature != null && (
            <div className="badge badge-error/15 text-error text-xs font-semibold py-2 px-2.5 gap-1.5 border-error/20">
              <FaThermometerHalf className="w-3 h-3" />
              {latest.temperature}°C
            </div>
          )}
          {latest?.pulse != null && (
            <div className="badge badge-info/15 text-info text-xs font-semibold py-2 px-2.5 gap-1.5 border-info/20">
              <FaHeartbeat className="w-3 h-3" />
              {latest.pulse} bpm
            </div>
          )}
          {(latest?.respiratoryRate != null || latest?.respiration != null) && (
            <div className="badge badge-success/15 text-success text-xs font-semibold py-2 px-2.5 gap-1.5 border-success/20">
              <FaLungs className="w-3 h-3" />
              {latest.respiratoryRate ?? latest.respiration} /min
            </div>
          )}
          {latest?.bp && (
            <div className="badge badge-neutral text-xs font-semibold py-2 px-2.5">
              BP: {latest.bp}
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="btn btn-xs sm:btn-sm btn-ghost gap-1.5 rounded-xl border border-base-200 text-base-content/70 hover:text-base-content ml-auto sm:ml-0"
            title={isCollapsed ? 'Expand Vitals Chart' : 'Collapse Vitals Chart'}
          >
            <span className="text-xs">{isCollapsed ? 'Expand Chart' : 'Collapse Chart'}</span>
            {isCollapsed ? (
              <FaChevronDown className="w-3 h-3 text-primary" />
            ) : (
              <FaChevronUp className="w-3 h-3 text-primary" />
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Chart Body */}
      {!isCollapsed && (
        <div className="border-t border-base-200 p-4 sm:p-5 pt-3">
          {sorted.length === 0 ? (
            <div className="p-8 text-center bg-base-200/30 rounded-xl">
              <FaHeartbeat className="w-10 h-10 mx-auto text-base-content/20 mb-2" />
              <p className="text-sm font-semibold text-base-content">No Clinical Vitals Logged Yet</p>
              <p className="text-xs text-base-content/60 mt-1">
                Record vitals using the button above to start charting observations.
              </p>
            </div>
          ) : (
            <div className="w-full h-56 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formatted} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis
                    dataKey="axisLabel"
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    tickLine={false}
                    interval="preserveStartEnd"
                    minTickGap={25}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    tickLine={false}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    iconType="circle"
                  />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    name="Temperature"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#ef4444', strokeWidth: 1, stroke: '#ffffff' }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="pulse"
                    name="Pulse Rate"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#3b82f6', strokeWidth: 1, stroke: '#ffffff' }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="respiration"
                    name="Respiration"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#10b981', strokeWidth: 1, stroke: '#ffffff' }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default VitalsChart
