import React, { useState } from 'react'
import { PharmacistLayout } from '@/layouts/pharmacist'
import { DataTable } from '@/components/common'

const InventoryStocks = () => {
  const [rows, setRows] = useState([
    { code: 'DR-0001', name: 'Amoxicillin 500mg', stock: 120, threshold: 30, unit: 'capsules' },
    { code: 'DR-0002', name: 'Paracetamol 1g', stock: 45, threshold: 25, unit: 'tablets' },
    { code: 'DR-0003', name: 'Ciprofloxacin 500mg', stock: 22, threshold: 20, unit: 'tablets' },
    { code: 'DR-0004', name: 'Ibuprofen 400mg', stock: 18, threshold: 25, unit: 'tablets' },
    { code: 'DR-0005', name: 'Metformin 500mg', stock: 60, threshold: 20, unit: 'tablets' }
  ])

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Drug' },
    { key: 'unit', label: 'Unit' },
    { key: 'stock', label: 'Stock' },
    { key: 'threshold', label: 'Threshold' },
    { key: 'status', label: 'Status', render: (_, row) => (
      <span className={`badge ${row.stock <= row.threshold ? 'badge-error' : 'badge-success'}`}>{row.stock <= row.threshold ? 'Low' : 'OK'}</span>
    )}
  ]

  return (
    <PharmacistLayout>
        <div className="p-6">
          <div className="mb-4">
            <h1 className="text-2xl font-semibold text-primary">Inventory & Stocks</h1>
            <p className="text-xs text-base-content/70">Current inventory levels</p>
          </div>
          <div className="rounded-xl bg-base-100 border border-base-300">
            <DataTable columns={columns} data={rows} />
          </div>
        </div>
    </PharmacistLayout>
  )
}

export default InventoryStocks
