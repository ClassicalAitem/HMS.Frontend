import React, { useState, useEffect } from 'react'
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
  FaChartLine,
  FaTimes,
  FaArrowLeft,
  FaArrowRight
} from 'react-icons/fa'

const ModalTooltip = ({ active, payload, label, unit, chartKey }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0]?.payload
    return (
      <div className="bg-base-100 p-3 rounded-xl shadow-xl border border-base-200 text-xs space-y-1.5 z-[100]">
        <p className="font-bold text-base-content border-b border-base-200 pb-1 mb-1">
          {dataPoint?.time || label}
        </p>
        {chartKey === 'bp' ? (
          <>
             {payload.map((entry, index) => (
                <div key={`item-${index}`} className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                    {entry.name}:
                  </span>
                  <span className="font-bold text-base-content">
                    {entry.value} {unit}
                  </span>
                </div>
             ))}
             {dataPoint?.bp && (
               <div className="flex items-center justify-between gap-4 pt-1 border-t border-base-200 text-base-content/70 mt-1">
                 <span>Raw BP:</span>
                 <span className="font-bold text-base-content">{dataPoint.bp}</span>
               </div>
             )}
          </>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 font-medium" style={{ color: payload[0].color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].color }}></span>
              {payload[0].name}:
            </span>
            <span className="font-bold text-base-content">
              {payload[0].value} {unit}
            </span>
          </div>
        )}
      </div>
    )
  }
  return null
}

const VitalsChart = ({ data = [], vitals }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeChartIdx, setActiveChartIdx] = useState(0)

  const charts = [
    { title: 'Pulse Rate Chart', key: 'pulse', color: '#3b82f6', unit: 'bpm', icon: <FaHeartbeat /> },
    { title: 'Temperature Chart', key: 'temperature', color: '#ef4444', unit: '°C', icon: <FaThermometerHalf /> },
    { title: 'Respiration Chart', key: 'respiration', color: '#10b981', unit: '/min', icon: <FaLungs /> },
    { title: 'Blood Pressure Chart', key: 'bp', color: '#8b5cf6', unit: 'mmHg', icon: <FaChartLine /> }
  ]

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

    let bpSystolic = null
    let bpDiastolic = null
    if (d.bp && typeof d.bp === 'string' && d.bp.includes('/')) {
      const parts = d.bp.split('/')
      bpSystolic = Number(parts[0])
      bpDiastolic = Number(parts[1])
    } else if (d.bp && !isNaN(Number(d.bp))) {
      bpSystolic = Number(d.bp)
    }

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
      bpSystolic,
      bpDiastolic,
      spo2: typeof d.spo2 === 'number' ? d.spo2 : d.spo2 ? Number(d.spo2) : null,
    }
  })

  const latest = sorted.length > 0 ? sorted[sorted.length - 1] : null

  // Keyboard navigation for modal
  useEffect(() => {
    if (!isModalOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        setActiveChartIdx((prev) => (prev + 1) % charts.length)
      } else if (e.key === 'ArrowLeft') {
        setActiveChartIdx((prev) => (prev - 1 + charts.length) % charts.length)
      } else if (e.key === 'Escape') {
        setIsModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen, charts.length])

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isModalOpen])

  const activeChart = charts[activeChartIdx]
  const dataWidth = Math.max(800, formatted.length * 80) // 80px per data point to allow scrolling

  return (
    <>
      <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden transition-all">
        {/* Header & Mini Stat Pills */}
        <div
          onClick={() => setIsModalOpen(true)}
          className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-pointer hover:bg-base-200/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
              <FaChartLine className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-base-content flex items-center gap-2">
                  Continuous Vitals Observation Chart
                </h3>
                {sorted.length > 0 && (
                  <span className="badge badge-primary badge-outline badge-xs sm:badge-sm font-semibold">
                    {sorted.length} {sorted.length === 1 ? 'Reading' : 'Readings'}
                  </span>
                )}
              </div>
              <p className="text-xs text-base-content/60 mt-0.5">
                Chronological timeline tracking of patient vitals
              </p>
            </div>
          </div>

          {/* Quick summary indicators + Expand button */}
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
              onClick={() => setIsModalOpen(true)}
              className="btn btn-xs sm:btn-sm btn-primary gap-1.5 rounded-xl ml-auto sm:ml-2"
              title="Expand Vitals Chart"
            >
              <span className="text-xs">Expand Charts</span>
              <FaChartLine className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal Chart */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-base-100 w-full max-w-6xl rounded-2xl shadow-2xl flex flex-col overflow-hidden h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-base-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-base-200 text-base-content rounded-xl shrink-0">
                  {activeChart.icon}
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-base-content">{activeChart.title}</h2>
                  <p className="text-sm text-base-content/60 mt-0.5">
                    {sorted.length} readings recorded over time
                  </p>
                </div>
              </div>
              <button 
                className="btn btn-ghost btn-circle bg-base-200 hover:bg-base-300" 
                onClick={() => setIsModalOpen(false)}
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col relative bg-base-50">
              
              {/* Navigation Controls */}
              <div className="flex justify-between items-center mb-6">
                <button 
                  className="btn btn-outline btn-sm sm:btn-md gap-2" 
                  onClick={() => setActiveChartIdx((p) => (p - 1 + charts.length) % charts.length)}
                >
                  <FaArrowLeft /> <span className="hidden sm:inline">Previous Chart</span>
                </button>
                
                {/* Tabs */}
                <div className="flex gap-1 sm:gap-2 overflow-x-auto px-2 no-scrollbar">
                  {charts.map((c, i) => (
                    <button 
                      key={i} 
                      className={`btn btn-sm sm:btn-md ${activeChartIdx === i ? 'btn-primary' : 'btn-ghost border border-base-200'} whitespace-nowrap`}
                      onClick={() => setActiveChartIdx(i)}
                    >
                      {c.title.split(' ')[0]}
                    </button>
                  ))}
                </div>
                
                <button 
                  className="btn btn-outline btn-sm sm:btn-md gap-2" 
                  onClick={() => setActiveChartIdx((p) => (p + 1) % charts.length)}
                >
                  <span className="hidden sm:inline">Next Chart</span> <FaArrowRight />
                </button>
              </div>

              {/* Chart Container */}
              {sorted.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-base-200/30 rounded-2xl border border-base-200 border-dashed">
                  <FaChartLine className="w-16 h-16 text-base-content/20 mb-4" />
                  <h3 className="text-lg font-bold text-base-content">No Data Available</h3>
                  <p className="text-base-content/60 mt-1 max-w-md">
                    There are no recorded vitals to display in this chart.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-x-auto border border-base-200 rounded-2xl bg-base-100 shadow-sm relative custom-scrollbar">
                  <div style={{ width: dataWidth, minWidth: '100%', height: '100%', minHeight: '400px', padding: '1rem' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={formatted} margin={{ top: 20, right: 30, left: 10, bottom: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis
                          dataKey="axisLabel"
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          tickLine={false}
                          axisLine={{ stroke: '#e5e7eb' }}
                          interval="preserveStartEnd"
                          dy={15}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          tickLine={false}
                          axisLine={false}
                          domain={['auto', 'auto']}
                          dx={-10}
                        />
                        <Tooltip content={<ModalTooltip unit={activeChart.unit} chartKey={activeChart.key} />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Legend wrapperStyle={{ paddingTop: 20, bottom: 0 }} />
                        
                        {activeChart.key === 'bp' ? (
                          <>
                            <Line 
                              type="monotone" 
                              dataKey="bpSystolic" 
                              name="Systolic BP" 
                              stroke="#8b5cf6" 
                              strokeWidth={3} 
                              dot={{ r: 5, fill: '#ffffff', stroke: '#8b5cf6', strokeWidth: 2 }} 
                              activeDot={{ r: 8, stroke: '#8b5cf6', strokeWidth: 2, fill: '#fff' }} 
                              connectNulls 
                            />
                            <Line 
                              type="monotone" 
                              dataKey="bpDiastolic" 
                              name="Diastolic BP" 
                              stroke="#ec4899" 
                              strokeWidth={3} 
                              dot={{ r: 5, fill: '#ffffff', stroke: '#ec4899', strokeWidth: 2 }} 
                              activeDot={{ r: 8, stroke: '#ec4899', strokeWidth: 2, fill: '#fff' }} 
                              connectNulls 
                            />
                          </>
                        ) : (
                          <Line 
                            type="monotone" 
                            dataKey={activeChart.key} 
                            name={activeChart.title.split(' ')[0]} 
                            stroke={activeChart.color} 
                            strokeWidth={3} 
                            dot={{ r: 5, fill: '#ffffff', stroke: activeChart.color, strokeWidth: 2 }} 
                            activeDot={{ r: 8, stroke: activeChart.color, strokeWidth: 2, fill: '#fff' }} 
                            connectNulls 
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-base-content/50 gap-2">
                <p>
                  <kbd className="kbd kbd-xs">←</kbd> <kbd className="kbd kbd-xs">→</kbd> to switch charts
                </p>
                <p>Scroll horizontally to view older records</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default VitalsChart

