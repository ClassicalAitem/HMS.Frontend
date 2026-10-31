import React, { useState, useEffect, useMemo } from 'react'
import {
  FaTimes,
  FaClipboardList,
  FaHistory,
  FaMagic,
  FaSave,
  FaCheckCircle,
  FaUserNurse,
  FaHeartbeat,
  FaPills,
  FaTint,
  FaNotesMedical,
  FaClock,
  FaCopy,
  FaPrint,
  FaBed,
  FaCalendarAlt,
} from 'react-icons/fa'
import toast from 'react-hot-toast'
import {
  getAdmissionSummaryData,
  createNurseReport,
  getNurseReports,
} from '@/services/api/admissionApi'
import { formatNigeriaDateTimeShort } from '@/utils/formatDateTimeUtils'

const SHIFT_OPTIONS = [
  'Morning Shift',
  'Afternoon Shift',
  'Night Shift',
  'Clinical Handover',
  'Discharge Nursing Summary',
  'Daily Progress Note',
  'Special Incident Note',
]

const NurseReportModal = ({
  isOpen,
  onClose,
  admissionId,
  patientId,
  dependantId,
  patientName = 'Patient',
  wardName = 'General Ward',
  bedNumber = '',
  onReportSaved,
}) => {
  const [activeTab, setActiveTab] = useState('write') // 'write' | 'history' | 'timeline'
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [summaryData, setSummaryData] = useState(null)
  const [pastReports, setPastReports] = useState([])

  // Form State
  const [shift, setShift] = useState('Morning Shift')
  const [title, setTitle] = useState('')
  const [reportText, setReportText] = useState('')

  useEffect(() => {
    if (isOpen && admissionId) {
      loadData()
    }
  }, [isOpen, admissionId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [summaryRes, reportsRes] = await Promise.allSettled([
        getAdmissionSummaryData(admissionId),
        getNurseReports(admissionId),
      ])

      if (summaryRes.status === 'fulfilled') {
        const sData = summaryRes.value?.data ?? summaryRes.value ?? {}
        setSummaryData(sData)
      }

      if (reportsRes.status === 'fulfilled') {
        const rList = reportsRes.value?.data ?? reportsRes.value ?? []
        setPastReports(Array.isArray(rList) ? rList : [])
      }
    } catch (err) {
      console.warn('Failed to load nursing report summary', err)
    } finally {
      setLoading(false)
    }
  }

  // Compile auto-summary from gathered patient clinical activities
  const handleGenerateSummary = () => {
    if (!summaryData) {
      toast.error('Summary data is still loading')
      return
    }

    const patient = summaryData.patient || {}
    const dep = summaryData.dependant || null
    const adm = summaryData.admission || {}
    const vitals = summaryData.vitals || []
    const rounds = summaryData.wardRounds || []
    const meds = summaryData.medicationAdministrations || []
    const fluids = summaryData.ivFluidEntries || []
    const transfusions = summaryData.bloodTransfusions || []

    const pName = dep
      ? `${dep.firstName || ''} ${dep.lastName || ''}`.trim() || patientName
      : `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || patientName
    const hospId = patient.hospitalId || 'N/A'
    const ward = adm.ward || adm.wardId || wardName
    const bed = adm.bedNumber || bedNumber || 'Not Assigned'
    const admDate = adm.admittedAt ? formatNigeriaDateTimeShort(adm.admittedAt) : 'N/A'
    const nowStr = formatNigeriaDateTimeShort(new Date())

    // Latest Vitals
    let vitalsSection = 'No vitals recorded yet.'
    if (vitals.length > 0) {
      const sorted = [...vitals].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      )
      const latest = sorted[0]
      const parts = []
      if (latest.bloodPressure || (latest.systolic && latest.diastolic)) {
        parts.push(
          `BP: ${latest.bloodPressure || `${latest.systolic}/${latest.diastolic}`} mmHg`
        )
      }
      if (latest.temperature) parts.push(`Temp: ${latest.temperature}°C`)
      if (latest.pulse || latest.heartRate) parts.push(`Pulse: ${latest.pulse || latest.heartRate} bpm`)
      if (latest.respiratoryRate) parts.push(`RR: ${latest.respiratoryRate} cpm`)
      if (latest.spo2 || latest.oxygenSaturation) {
        parts.push(`SpO2: ${latest.spo2 || latest.oxygenSaturation}%`)
      }
      if (latest.bloodSugar || latest.randomBloodSugar) {
        parts.push(`RBS: ${latest.bloodSugar || latest.randomBloodSugar} mg/dL`)
      }
      const vTime = latest.createdAt ? formatNigeriaDateTimeShort(latest.createdAt) : ''
      vitalsSection = `• ${parts.join(' | ')} (Recorded: ${vTime})`
    }

    // Administered Medications
    let medsSection = 'No medications administered yet.'
    if (meds.length > 0) {
      const medLines = meds.slice(0, 10).map((m) => {
        const time = m.administeredAt ? formatNigeriaDateTimeShort(m.administeredAt) : ''
        return `• ${m.drugName || 'Medication'} (${m.dosage || 'Dose'}) - ${m.doseGiven || 1} dose given by ${m.nurseName || 'Nurse'} [${time}]`
      })
      medsSection = medLines.join('\n')
      if (meds.length > 10) medsSection += `\n...and ${meds.length - 10} more administration records.`
    }

    // IV Fluids & Transfusions
    let fluidSection = 'None recorded.'
    const fluidParts = []
    if (fluids.length > 0) {
      fluidParts.push(`• Intake/Output entries: ${fluids.length} records logged`)
    }
    if (transfusions.length > 0) {
      const tLines = transfusions.map(
        (t) => `• Blood Transfusion: ${t.units || 1} unit(s) ${t.bloodGroup || ''} (${t.status || 'ordered'})`
      )
      fluidParts.push(...tLines)
    }
    if (fluidParts.length > 0) fluidSection = fluidParts.join('\n')

    // Doctor Ward Rounds & Orders
    let roundsSection = 'No doctor ward round recorded yet.'
    if (rounds.length > 0) {
      const rSorted = [...rounds].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      )
      const rLines = rSorted.slice(0, 3).map((r) => {
        const rTime = r.createdAt ? formatNigeriaDateTimeShort(r.createdAt) : ''
        const drName = r.doctor
          ? `Dr. ${r.doctor.firstName || ''} ${r.doctor.lastName || ''}`.trim()
          : 'Doctor'
        let text = `• [${rTime}] ${drName}: ${r.note || 'No notes'}`
        if (r.isDischargeRound || r.dischargeNote) {
          text += `\n  - Discharge Clearance: ${r.dischargeNote || 'Patient cleared for discharge'}`
        }
        return text
      })
      roundsSection = rLines.join('\n')
    }

    // Doctor Discharge Clearance Banner
    let doctorDischargeSection = ''
    if (adm.dischargeReady || adm.dischargeOrderNote) {
      doctorDischargeSection = `\n--- DOCTOR DISCHARGE ORDER ---\nDoctor Clearance: ${adm.dischargeOrderNote || 'Patient cleared for discharge by doctor'}\nAuthorized At: ${adm.dischargeOrderedAt ? formatNigeriaDateTimeShort(adm.dischargeOrderedAt) : 'Recent round'}\n`
    }

    const compiledText = `========================================
INPATIENT NURSING REPORT & HANDOVER
========================================
Patient Name: ${pName}
Hospital ID: ${hospId}
Ward: ${ward} | Bed: ${bed}
Admitted: ${admDate}
Report Shift: ${shift}
Report Date & Time: ${nowStr}
${doctorDischargeSection}
--- LATEST VITALS ---
${vitalsSection}

--- MEDICATIONS ADMINISTERED ---
${medsSection}

--- IV FLUIDS & TRANSFUSIONS ---
${fluidSection}

--- DOCTOR WARD ROUND ASSESSMENTS ---
${roundsSection}

--- NURSING OBSERVATIONS & CLINICAL CARE ---
[Type patient clinical progress, wound condition, feeding/hydration, cannula care, complaints, or shift handover notes here...]
`

    setReportText((prev) => (prev ? `${prev}\n\n${compiledText}` : compiledText))
    if (!title) {
      setTitle(`${shift} - ${pName} (${new Date().toLocaleDateString('en-GB')})`)
    }
    toast.success('Patient care summary compiled into report!')
  }

  const handleSaveReport = async () => {
    if (!reportText.trim()) {
      return toast.error('Please write or generate report content before saving')
    }

    setSaving(true)
    try {
      const payload = {
        patientId,
        dependantId: dependantId || undefined,
        shift,
        title: title.trim() || `${shift} Report`,
        report: reportText.trim(),
        summarySnapshot: {
          patientName,
          wardName,
          bedNumber,
          vitalsCount: summaryData?.vitals?.length || 0,
          medsCount: summaryData?.medicationAdministrations?.length || 0,
        },
      }

      const res = await createNurseReport(admissionId, payload)
      toast.success('Nursing report saved successfully!')

      const created = res?.data ?? res
      setPastReports((prev) => [created, ...prev])
      setReportText('')
      setTitle('')
      setActiveTab('history')

      if (onReportSaved) onReportSaved()
    } catch (err) {
      console.error('Failed to save nursing report:', err)
      toast.error(
        err?.response?.data?.error || err?.response?.data?.message || 'Failed to save nursing report'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Report copied to clipboard')
  }

  const handlePrint = (report) => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Nursing Report - ${patientName}</title>
          <style>
            body { font-family: sans-serif; padding: 24px; line-height: 1.6; color: #1f2937; }
            h1 { font-size: 20px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; }
            .meta { font-size: 13px; color: #4b5563; margin-bottom: 16px; }
            pre { font-family: monospace; font-size: 13px; background: #f3f4f6; padding: 16px; border-radius: 8px; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h1>Inpatient Nursing Clinical Report</h1>
          <div class="meta">
            <strong>Patient:</strong> ${patientName} | <strong>Ward:</strong> ${wardName} | <strong>Bed:</strong> ${bedNumber || 'N/A'}<br/>
            <strong>Shift:</strong> ${report.shift || shift} | <strong>Nurse:</strong> ${report.nurseName || 'Nurse'} | <strong>Date:</strong> ${formatNigeriaDateTimeShort(report.createdAt || new Date())}
          </div>
          <pre>${report.report || reportText}</pre>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-base-100 rounded-3xl max-w-4xl w-full shadow-2xl border border-base-300 flex flex-col max-h-[92vh] overflow-hidden animate-scaleUp">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-base-200 bg-base-200/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 sm:p-3 bg-primary/10 text-primary rounded-2xl shrink-0">
              <FaClipboardList className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-bold text-base-content truncate">
                  Inpatient Nursing Report
                </h2>
                <span className="badge badge-primary badge-sm font-semibold shrink-0">
                  Nurse Care
                </span>
              </div>
              <p className="text-xs text-base-content/60 truncate">
                Patient: <strong className="text-base-content">{patientName}</strong> · Ward:{' '}
                {wardName} {bedNumber ? `· Bed ${bedNumber}` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost shrink-0 text-base-content/60 hover:text-base-content"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Doctor Discharge Clearance Banner (if doctor flagged it) */}
        {summaryData?.admission?.dischargeReady && (
          <div className="bg-warning/15 border-b border-warning/30 px-4 py-2.5 flex items-center justify-between gap-2 text-warning-content">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="badge badge-warning badge-sm font-bold animate-pulse">
                Doctor Cleared
              </span>
              <span>
                Doctor recommended discharge:{' '}
                <em>"{summaryData.admission.dischargeOrderNote || 'Cleared for discharge'}"</em>
              </span>
            </div>
            <button
              onClick={() => {
                setReportText((prev) =>
                  `${prev}\n\n[DOCTOR DISCHARGE CLEARANCE]\nNote: ${summaryData.admission.dischargeOrderNote || 'Patient is medically cleared for discharge.'}\n`
                )
                toast.success('Appended doctor discharge note to report')
              }}
              className="btn btn-xs btn-warning text-warning-content font-bold shrink-0"
            >
              + Append to Report
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-base-100 px-4 pt-3 border-b border-base-200 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('write')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'write'
                ? 'border-primary text-primary'
                : 'border-transparent text-base-content/60 hover:text-base-content'
            }`}
          >
            <FaClipboardList className="w-4 h-4" />
            Write / Draft Report
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-primary text-primary'
                : 'border-transparent text-base-content/60 hover:text-base-content'
            }`}
          >
            <FaHistory className="w-4 h-4" />
            Report History ({pastReports.length})
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'border-primary text-primary'
                : 'border-transparent text-base-content/60 hover:text-base-content'
            }`}
          >
            <FaHeartbeat className="w-4 h-4" />
            Patient Care Summary Data
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="text-xs sm:text-sm text-base-content/60">
                Gathering patient admission activities & records...
              </p>
            </div>
          ) : (
            <>
              {/* TAB 1: WRITE REPORT */}
              {activeTab === 'write' && (
                <div className="space-y-4">
                  {/* Controls Bar: Shift Selector & Auto-Generate Button */}
                  <div className="bg-base-200/50 p-3 sm:p-4 rounded-2xl border border-base-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-base-content/60 uppercase tracking-wider block mb-1">
                          Duty Shift / Category
                        </label>
                        <select
                          value={shift}
                          onChange={(e) => setShift(e.target.value)}
                          className="select select-bordered select-sm rounded-xl font-semibold text-xs"
                        >
                          {SHIFT_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex-1 min-w-[200px]">
                        <label className="text-[11px] font-bold text-base-content/60 uppercase tracking-wider block mb-1">
                          Report Title / Subject (Optional)
                        </label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g. Morning Handover, Vitals Stable"
                          className="input input-bordered input-sm rounded-xl text-xs w-full"
                        />
                      </div>
                    </div>

                    <div className="self-end md:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={handleGenerateSummary}
                        className="btn btn-sm btn-outline btn-primary rounded-xl font-semibold gap-2 shadow-xs"
                        title="Auto-compile vitals, medications, fluids, and doctor rounds into the report"
                      >
                        <FaMagic className="w-3.5 h-3.5 text-primary" />
                        <span>Auto-Compile Care Summary</span>
                      </button>
                    </div>
                  </div>

                  {/* Report Textarea */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-base-content/60">
                      <span className="font-semibold text-base-content/70">
                        Nursing Report & Handover Details*
                      </span>
                      <span>{reportText.length} characters</span>
                    </div>

                    <textarea
                      value={reportText}
                      onChange={(e) => setReportText(e.target.value)}
                      placeholder="Type the nursing report, patient observations, condition, administered care, fluid status, or clinical handover here... You can also click 'Auto-Compile Care Summary' above to automatically gather all patient data since admission."
                      rows={14}
                      className="textarea textarea-bordered w-full rounded-2xl text-xs sm:text-sm font-mono leading-relaxed bg-base-100 focus:outline-primary p-4"
                    />
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-base-200">
                    <div className="flex items-center gap-2">
                      {reportText.trim() && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCopy(reportText)}
                            className="btn btn-sm btn-ghost rounded-xl text-xs gap-1.5"
                          >
                            <FaCopy className="w-3.5 h-3.5" /> Copy
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePrint({ report: reportText, shift })}
                            className="btn btn-sm btn-ghost rounded-xl text-xs gap-1.5"
                          >
                            <FaPrint className="w-3.5 h-3.5" /> Print Draft
                          </button>
                          <button
                            type="button"
                            onClick={() => setReportText('')}
                            className="btn btn-sm btn-ghost text-error rounded-xl text-xs"
                          >
                            Clear Text
                          </button>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-sm btn-ghost rounded-xl text-xs"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveReport}
                        disabled={saving || !reportText.trim()}
                        className="btn btn-sm btn-primary rounded-xl font-bold gap-2 shadow-sm"
                      >
                        {saving ? (
                          <>
                            <span className="loading loading-spinner loading-xs"></span>
                            Saving Report...
                          </>
                        ) : (
                          <>
                            <FaSave className="w-3.5 h-3.5" />
                            Save Nursing Report
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PAST REPORTS */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  {pastReports.length === 0 ? (
                    <div className="py-16 text-center space-y-3 bg-base-200/30 rounded-2xl border border-dashed border-base-300">
                      <div className="w-12 h-12 rounded-full bg-base-300 text-base-content/40 flex items-center justify-center mx-auto">
                        <FaClipboardList className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-sm text-base-content">
                        No nursing reports saved yet
                      </p>
                      <p className="text-xs text-base-content/60 max-w-sm mx-auto">
                        Nurses on duty can write and save shift handover reports, progress notes, and
                        care summaries.
                      </p>
                      <button
                        onClick={() => setActiveTab('write')}
                        className="btn btn-sm btn-primary rounded-xl font-semibold gap-2"
                      >
                        <FaClipboardList className="w-3.5 h-3.5" /> Write First Report
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pastReports.map((item, idx) => (
                        <div
                          key={item._id || item.id || idx}
                          className="bg-base-200/40 rounded-2xl border border-base-200 p-4 space-y-3 transition-all hover:border-primary/40"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-base-200 pb-2.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="badge badge-primary font-bold text-xs py-2 px-3">
                                {item.shift || 'Nursing Report'}
                              </span>
                              {item.title && (
                                <span className="font-bold text-sm text-base-content">
                                  {item.title}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-base-content/60">
                              <span className="flex items-center gap-1 font-semibold text-base-content/80">
                                <FaUserNurse className="w-3.5 h-3.5 text-primary" />
                                {item.nurseName || 'Nurse'}
                              </span>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <FaClock className="w-3 h-3" />
                                {formatNigeriaDateTimeShort(item.createdAt || new Date())}
                              </span>
                            </div>
                          </div>

                          <pre className="text-xs sm:text-sm font-mono whitespace-pre-wrap leading-relaxed text-base-content/90 bg-base-100 p-3.5 rounded-xl border border-base-200 overflow-x-auto">
                            {item.report}
                          </pre>

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              onClick={() => handleCopy(item.report)}
                              className="btn btn-xs btn-ghost gap-1 font-semibold"
                            >
                              <FaCopy className="w-3 h-3" /> Copy
                            </button>
                            <button
                              onClick={() => handlePrint(item)}
                              className="btn btn-xs btn-ghost gap-1 font-semibold"
                            >
                              <FaPrint className="w-3 h-3" /> Print
                            </button>
                            <button
                              onClick={() => {
                                setReportText((prev) =>
                                  prev ? `${prev}\n\n${item.report}` : item.report
                                )
                                setActiveTab('write')
                                toast.success('Loaded past report into editor')
                              }}
                              className="btn btn-xs btn-outline btn-primary gap-1 font-semibold"
                            >
                              Load into Editor
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PATIENT CARE SUMMARY DATA */}
              {activeTab === 'timeline' && summaryData && (
                <div className="space-y-4">
                  <div className="p-3 bg-base-200/50 rounded-xl border border-base-200 text-xs text-base-content/70 flex items-center justify-between">
                    <span>
                      Aggregated record of all activities for this inpatient stay. Click "Insert into
                      Editor" on any section to add it directly to your draft.
                    </span>
                    <button
                      onClick={handleGenerateSummary}
                      className="btn btn-xs btn-primary gap-1 font-bold shrink-0"
                    >
                      <FaMagic className="w-3 h-3" /> Compile All
                    </button>
                  </div>

                  {/* Vitals Summary Card */}
                  <div className="bg-base-100 rounded-2xl border border-base-200 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-base-content flex items-center gap-2">
                        <FaHeartbeat className="text-error" /> Vitals Records (
                        {summaryData.vitals?.length || 0})
                      </h4>
                    </div>
                    {summaryData.vitals?.length === 0 ? (
                      <p className="text-xs text-base-content/50">No vitals recorded yet.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {summaryData.vitals.slice(0, 5).map((v, i) => (
                          <div
                            key={v._id || v.id || i}
                            className="text-xs p-2 bg-base-200/40 rounded-lg flex items-center justify-between"
                          >
                            <span>
                              BP: {v.bloodPressure || `${v.systolic || '--'}/${v.diastolic || '--'}`}{' '}
                              | Temp: {v.temperature || '--'}°C | Pulse:{' '}
                              {v.pulse || v.heartRate || '--'} bpm | SpO2:{' '}
                              {v.spo2 || v.oxygenSaturation || '--'}%
                            </span>
                            <span className="text-[11px] text-base-content/50">
                              {formatNigeriaDateTimeShort(v.createdAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Medication Administrations Card */}
                  <div className="bg-base-100 rounded-2xl border border-base-200 p-4 space-y-3">
                    <h4 className="font-bold text-sm text-base-content flex items-center gap-2">
                      <FaPills className="text-secondary" /> Administered Medications (
                      {summaryData.medicationAdministrations?.length || 0})
                    </h4>
                    {summaryData.medicationAdministrations?.length === 0 ? (
                      <p className="text-xs text-base-content/50">
                        No medications administered yet.
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {summaryData.medicationAdministrations.map((m, i) => (
                          <div
                            key={m._id || m.id || i}
                            className="text-xs p-2 bg-base-200/40 rounded-lg flex items-center justify-between"
                          >
                            <div>
                              <strong className="text-base-content">{m.drugName}</strong> (
                              {m.dosage || 'Dose'}) · Given by {m.nurseName}
                            </div>
                            <span className="text-[11px] text-base-content/50">
                              {formatNigeriaDateTimeShort(m.administeredAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Doctor Ward Rounds Card */}
                  <div className="bg-base-100 rounded-2xl border border-base-200 p-4 space-y-3">
                    <h4 className="font-bold text-sm text-base-content flex items-center gap-2">
                      <FaNotesMedical className="text-primary" /> Doctor Ward Rounds (
                      {summaryData.wardRounds?.length || 0})
                    </h4>
                    {summaryData.wardRounds?.length === 0 ? (
                      <p className="text-xs text-base-content/50">
                        No doctor ward rounds recorded yet.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-44 overflow-y-auto">
                        {summaryData.wardRounds.map((r, i) => (
                          <div
                            key={r._id || r.id || i}
                            className="text-xs p-2.5 bg-base-200/40 rounded-xl space-y-1"
                          >
                            <div className="flex items-center justify-between text-base-content/70">
                              <span className="font-semibold text-primary">
                                {r.doctor ? `Dr. ${r.doctor.firstName || ''} ${r.doctor.lastName || ''}` : 'Doctor'}
                              </span>
                              <span className="text-[11px]">
                                {formatNigeriaDateTimeShort(r.createdAt)}
                              </span>
                            </div>
                            <p className="text-base-content/90 font-mono text-[11px]">{r.note}</p>
                            {r.dischargeNote && (
                              <p className="text-warning-content bg-warning/10 p-1.5 rounded text-[11px]">
                                <strong>Discharge Instruction:</strong> {r.dischargeNote}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default NurseReportModal

