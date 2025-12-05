import React from 'react'
import { PharmacistLayout } from '@/layouts/pharmacist'
import { FaPills } from 'react-icons/fa6'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { Link } from 'react-router-dom'

const PharmacistDashboard = () => {
  const today = new Date()
  const dateText = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const stockPercent = 75
  const chartData = [
    { name: 'In Stock', value: 75, color: '#22c55e' },
    { name: 'Low Stock', value: 15, color: '#fb923c' },
    { name: 'Out Of stock', value: 10, color: '#ef4444' },
  ]
  const totalPrescriptions = 150

  const recentRows = [
    { id: 'P-001', description: 'Restock added to inventory', drug: 'Amoxicillin 250mg', qty: 2, date: '01/01/01', status: 'in' },
    { id: 'P-001', description: 'Restock added to inventory', drug: 'Amoxicillin 250mg', qty: 2, date: '01/01/01', status: 'in' },
    { id: 'P-001', description: 'Drug dispensed from inventory', drug: 'Amoxicillin 250mg', qty: 2, date: '01/01/01', status: 'out' },
    { id: 'P-001', description: 'Drug dispensed from inventory', drug: 'Amoxicillin 250mg', qty: 2, date: '01/01/01', status: 'out' },
    { id: 'P-001', description: 'Restock added to inventory', drug: 'Amoxicillin 250mg', qty: 2, date: '01/01/01', status: 'in' },
  ]

  return (
    <PharmacistLayout>
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-primary">Pharmacist Dashboard</h1>
            <div className="flex gap-2">
              <Link to="/dashboard/pharmacist/DrugDispensation" className="btn btn-primary btn-sm">Dispensation</Link>
              <Link to="/dashboard/pharmacist/incoming" className="btn btn-outline btn-sm">Incoming</Link>
            </div>
          </div>
          <p className="text-sm text-base-content/70 mb-6">Overview of today’s pharmacy operations. {dateText}</p>

          <div className="grid grid-cols-1 md:flex gap-4 mb-6">
            <div className="p-6 rounded-xl bg-base-100 border border-base-300 w-3/5 flex gap-6 lg:gap-20">
              <div className=''>
                <div className="text-base font-medium text-base-content mb-4">Stock Update</div>
                <div className="flex items-center gap-8 justify-center">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: chartData[0].color }} /> In Stock</div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: chartData[1].color }} /> Low Stock</div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: chartData[2].color }} /> Out Of stock</div>
                  </div>
                </div>
              </div>

                <div className="relative w-40 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={6} dataKey="value">
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-2xl font-semibold text-primary">{stockPercent}%</div>
                  </div>
              </div>
            </div>
            <div className="p-6 rounded-xl bg-base-100 border border-base-300 w-full flex flex-col justify-center ">
                <div className="text-base font-medium text-base-content mb-4 flex items-center gap-2">
                  <FaPills className="text-primary" />
                  <span>Total Prescriptions Processed</span>
                </div>
                <div className="text-7xl font-bold text-primary">{totalPrescriptions}</div>
              </div>
          </div>

          <div className="p-4 2xl:p-6 rounded-xl bg-base-100 border border-base-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-base-content">Recent Activity</h2>
              <Link to="/dashboard/pharmacist/Transactions" className="btn btn-ghost btn-xs">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr className="bg-base-200">
                    <th>Bath NO</th>
                    <th>Description</th>
                    <th>Drug</th>
                    <th>Quantity</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRows.map((r, idx) => (
                    <tr key={idx}>
                      <td className='border-b py-2'>{r.id}</td>
                      <td className='border-b py-2'>{r.description}</td>
                      <td className='border-b py-2'>{r.drug}</td>
                      <td className='border-b py-2'>{r.qty}</td>
                      <td className='border-b py-2'>{r.date}</td>
                      <td className='border-b py-2'>
                        <span className={`badge ${r.status==='in'?'badge-success':'badge-error'}`}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-base-content/60">
              <div>Showing Recent Activity (150 Total)</div>
              <div className="join">
                <button className="join-item btn btn-ghost btn-xs">‹</button>
                <button className="join-item btn btn-ghost btn-xs">1</button>
                <button className="join-item btn btn-ghost btn-xs">2</button>
                <button className="join-item btn btn-ghost btn-xs">3</button>
                <button className="join-item btn btn-ghost btn-xs">4</button>
                <button className="join-item btn btn-ghost btn-xs">5</button>
                <button className="join-item btn btn-ghost btn-xs">›</button>
              </div>
            </div>
          </div>
        </div>
    </PharmacistLayout>
  )
}

export default PharmacistDashboard
