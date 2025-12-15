import React, { useState } from 'react'
import { PharmacistLayout } from '@/layouts/pharmacist'
import { DataTable } from '@/components/common'

const Transactions = () => {
  const [rows] = useState([
    { id: 'TRX-9001', date: '2025-12-02', patient: 'John Doe', description: 'Drug Dispensation', amount: 3500, method: 'Cash', status: 'Successful', time: '09:12 AM' },
    { id: 'TRX-9002', date: '2025-12-02', patient: 'Mary Jane', description: 'Drug Dispensation', amount: 1500, method: 'Transfer', status: 'Successful', time: '10:25 AM' },
    { id: 'TRX-9003', date: '2025-12-02', patient: 'Ahmed Bello', description: 'Stock Out', amount: 0, method: '—', status: 'Logged', time: '11:02 AM' },
    { id: 'TRX-9004', date: '2025-12-02', patient: 'Grace Okafor', description: 'Drug Dispensation', amount: 2200, method: 'POS', status: 'Successful', time: '12:15 PM' }
  ])

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'date', label: 'Date' },
    { key: 'patient', label: 'Patient' },
    { key: 'description', label: 'Description' },
    { key: 'amount', label: 'Amount', render: (v) => `₦${Number(v).toLocaleString()}` },
    { key: 'method', label: 'Method' },
    { key: 'status', label: 'Status' },
    { key: 'time', label: 'Time' }
  ]

  return (
    <PharmacistLayout>
        <div className="p-6">
          <div className="mb-4">
            <h1 className="text-2xl font-semibold text-primary">Transactions</h1>
            <p className="text-xs text-base-content/70">Recent pharmacy transactions</p>
          </div>
          <div className="rounded-xl bg-base-100 border border-base-300">
            <DataTable columns={columns} data={rows} />
          </div>
        </div>
    </PharmacistLayout>
  )
}

export default Transactions
