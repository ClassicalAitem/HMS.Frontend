import React, { useState } from 'react'
import { PharmacistLayout } from '@/layouts/pharmacist'
import { DataTable } from '@/components/common'

const Incoming = () => {
  const [rows] = useState([
    { id: 'REQ-1001', patient: 'John Doe', drug: 'Amoxicillin 500mg', quantity: 20, status: 'Pending', requestedAt: '09:10 AM' },
    { id: 'REQ-1002', patient: 'Mary Jane', drug: 'Paracetamol 1g', quantity: 10, status: 'Pending', requestedAt: '09:45 AM' },
    { id: 'REQ-1003', patient: 'Ahmed Bello', drug: 'Ciprofloxacin 500mg', quantity: 14, status: 'Approved', requestedAt: '10:05 AM' },
    { id: 'REQ-1004', patient: 'Grace Okafor', drug: 'Ibuprofen 400mg', quantity: 8, status: 'Pending', requestedAt: '10:20 AM' },
    { id: 'REQ-1005', patient: 'Peter Obi', drug: 'Metformin 500mg', quantity: 30, status: 'Approved', requestedAt: '11:15 AM' }
  ])

  const columns = [
    { key: 'id', label: 'Request ID' },
    { key: 'patient', label: 'Patient' },
    { key: 'drug', label: 'Drug' },
    { key: 'quantity', label: 'Qty' },
    { key: 'status', label: 'Status' },
    { key: 'requestedAt', label: 'Time' }
  ]

  return (
    <PharmacistLayout>
        <div className="p-6">
          <div className="mb-4">
            <h1 className="text-2xl font-semibold text-primary">Incoming Requests</h1>
            <p className="text-xs text-base-content/70">Pharmacy requests received</p>
          </div>
          <div className="rounded-xl bg-base-100 border border-base-300">
            <DataTable columns={columns} data={rows} />
          </div>
        </div>
    </PharmacistLayout>
  )
}

export default Incoming
