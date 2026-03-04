import React from 'react';
import { Header } from "@/components/common";
import LaboratorySidebar from "@/components/laboratory/dashboard/LaboratorySidebar";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const StatCard = ({ title, value }) => (
  <div className="p-4 rounded-lg bg-base-100 border border-base-200">
    <div className="text-sm text-base-content/70">{title}</div>
    <div className="mt-2 text-2xl font-semibold text-base-content">{value}</div>
  </div>
);

const LaboratoryReports = () => {
  // placeholder metrics — these can be wired to real APIs
  const metrics = {
    pending: 12,
    processing: 4,
    completedToday: 8,
  };

  const pieData = [
    { name: 'Pending', value: metrics.pending },
    { name: 'Processing', value: metrics.processing },
    { name: 'Completed', value: metrics.completedToday },
  ];
  const COLORS = ['#f59e0b', '#06b6d4', '#10b981'];

  const recent = [
    { id: 1, name: 'Full Blood Count', date: '2026-03-03', status: 'Completed' },
    { id: 2, name: 'Lipid Panel', date: '2026-03-03', status: 'Processing' },
    { id: 3, name: 'Liver Function', date: '2026-03-02', status: 'Completed' },
  ];

  return (
    <div className="flex h-screen bg-base-200">
      <LaboratorySidebar />

      <div className="flex overflow-hidden flex-col flex-1">
        <Header />

        <div className="overflow-y-auto flex-1">
          <section className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-semibold text-primary">Laboratory Reports</h1>
                <p className="text-xs text-base-content/70">Summary of laboratory workload and recent results</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4 items-center">
              <StatCard title="Pending Requests" value={metrics.pending} />
              <StatCard title="Processing" value={metrics.processing} />
              <StatCard title="Completed Today" value={metrics.completedToday} />
              <div className="p-4 rounded-lg bg-base-100 border border-base-200">
                <div className="text-sm text-base-content/70">Distribution</div>
                <div className="mt-2 h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={28} outerRadius={48} paddingAngle={2}>
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-base-100 rounded-md p-3 border">
              <h3 className="text-lg font-semibold mb-3">Recent Lab Results</h3>
              <div className="space-y-2">
                {recent.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-2 rounded hover:bg-base-200">
                    <div>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-base-content/60">{r.date}</div>
                    </div>
                    <div className="text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${r.status === 'Completed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LaboratoryReports;
