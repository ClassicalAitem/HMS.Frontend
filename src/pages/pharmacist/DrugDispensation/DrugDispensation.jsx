import React, { useState } from 'react'
import { PharmacistLayout } from '@/layouts/pharmacist'
import { DataTable } from '@/components/common'

const DrugDispensation = () => {
  const [rows, setRows] = useState([
    { id: 'RX-2001', patient: 'John Doe', drug: 'Amoxicillin 500mg', dose: '1 cap x3', quantity: 21, status: 'Pending' },
    { id: 'RX-2002', patient: 'Mary Jane', drug: 'Paracetamol 1g', dose: '1 tab x2', quantity: 12, status: 'Pending' },
    { id: 'RX-2003', patient: 'Ahmed Bello', drug: 'Ciprofloxacin 500mg', dose: '1 tab x2', quantity: 14, status: 'Pending' },
    { id: 'RX-2004', patient: 'Grace Okafor', drug: 'Ibuprofen 400mg', dose: '1 tab x3', quantity: 9, status: 'Pending' }
  ])

  const columns = [
    { key: 'id', label: 'Prescription' },
    { key: 'patient', label: 'Patient' },
    { key: 'drug', label: 'Drug' },
    { key: 'dose', label: 'Dose' },
    { key: 'quantity', label: 'Qty' },
    { key: 'status', label: 'Status' },
    { key: 'action', label: 'Action', render: (_, row) => (
      <button
        className="btn btn-primary btn-xs"
        onClick={() => setRows(prev => prev.map(r => r.id===row.id ? { ...r, status: 'Dispensed' } : r))}
      >
        Mark Dispensed
      </button>
    ) }
  ]

  return (
    <PharmacistLayout>
        <div className="p-6">
          <div className="mb-4">
            <h1 className="text-2xl font-semibold text-primary">Drug Dispensation</h1>
            <p className="text-xs text-base-content/70">Pending prescriptions</p>
          </div>
          <div className="rounded-xl bg-base-100 border border-base-300">
            <DataTable columns={columns} data={rows} />
          </div>
        </div>
    </PharmacistLayout>
  )
}

export default DrugDispensation
