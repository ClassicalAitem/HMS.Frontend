import React, { useState, useEffect } from 'react';
import LaboratoryLayout from '@/layouts/laboratory';
import KolakLoader from '@/components/common/KolakLoader';
import { getInvestigations } from '@/services/api/investigationRequestAPI';
import { getLabResults } from '@/services/api/labResultsAPI';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { FiRefreshCw, FiPieChart } from 'react-icons/fi';

const StatCard = ({ title, value }) => (
  <div className="p-4 rounded-lg bg-base-100 border border-base-200 shadow-sm">
    <div className="text-sm text-base-content/70">{title}</div>
    <div className="mt-2 text-2xl font-bold text-base-content">{value}</div>
  </div>
);

const LaboratoryReports = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    pending: 0,
    processing: 0,
    completedToday: 0,
    total: 0,
  });
  const [recentResults, setRecentResults] = useState([]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const [invRes, resultsRes] = await Promise.all([
        getInvestigations({ type: 'lab', limit: 100 }).catch(() => getInvestigations({ limit: 100 }).catch(() => [])),
        getLabResults({ limit: 50 }).catch(() => []),
      ]);

      const investigations = Array.isArray(invRes) ? invRes : invRes?.data || [];
      const labResults = Array.isArray(resultsRes) ? resultsRes : resultsRes?.data || [];

      let pendingCount = 0;
      let processingCount = 0;
      let completedTodayCount = 0;

      const todayStr = new Date().toISOString().slice(0, 10);

      investigations.forEach((inv) => {
        const s = String(inv.status || '').toLowerCase();
        if (['pending', 'requested', 'awaiting_lab'].includes(s)) pendingCount++;
        else if (['processing', 'in_progress'].includes(s)) processingCount++;
        else if (s === 'completed') {
          const compDate = (inv.completedAt || inv.updatedAt || '').slice(0, 10);
          if (compDate === todayStr) completedTodayCount++;
        }
      });

      setMetrics({
        pending: pendingCount,
        processing: processingCount,
        completedToday: completedTodayCount,
        total: investigations.length,
      });

      // Recent 5 results
      const recent = labResults.slice(0, 5).map((r) => {
        const testName =
          (Array.isArray(r.tests) && r.tests.map((t) => t.name || t.code).join(', ')) ||
          (Array.isArray(r.result) && (r.result[0]?.code || r.result[0]?.value)) ||
          r.form?.clinicalDiagnosis ||
          'Laboratory Test';

        const patName =
          (r.patient && `${r.patient.firstName || ''} ${r.patient.lastName || ''}`.trim()) ||
          (r.dependant && `${r.dependant.firstName || ''} ${r.dependant.lastName || ''}`.trim()) ||
          (r.opdPatient && r.opdPatient.fullName) ||
          'Patient';

        return {
          id: r._id || r.id,
          name: testName,
          patient: patName,
          date: new Date(r.completedAt || r.createdAt || Date.now()).toLocaleDateString(),
          status: r.status || 'Completed',
        };
      });

      setRecentResults(recent);
    } catch (err) {
      console.error('Failed to load laboratory reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);

  const pieData = [
    { name: 'Pending', value: metrics.pending || 0 },
    { name: 'Processing', value: metrics.processing || 0 },
    { name: 'Completed Today', value: metrics.completedToday || 0 },
  ];
  const COLORS = ['#f59e0b', '#06b6d4', '#10b981'];

  return (
    <LaboratoryLayout>
      {loading && metrics.total === 0 && (
        <KolakLoader fullscreen text="Loading laboratory reports..." />
      )}

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-2">
              <FiPieChart className="w-7 h-7 text-primary" />
              Laboratory Reports
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-1">
              Summary of laboratory workload, status distribution, and verified results
            </p>
          </div>
          <button
            onClick={loadReportData}
            disabled={loading}
            className="btn btn-sm btn-ghost gap-2 border border-base-300 self-start sm:self-auto"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          <StatCard title="Pending Requests" value={metrics.pending} />
          <StatCard title="In Progress" value={metrics.processing} />
          <StatCard title="Completed Today" value={metrics.completedToday} />
          <div className="p-4 rounded-lg bg-base-100 border border-base-200 shadow-sm flex flex-col justify-between">
            <div className="text-sm text-base-content/70 font-medium">Distribution</div>
            <div className="h-32 w-full">
              {metrics.pending === 0 && metrics.processing === 0 && metrics.completedToday === 0 ? (
                <div className="flex items-center justify-center h-full text-xs text-base-content/40">
                  No activity recorded
                </div>
              ) : (
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
              )}
            </div>
          </div>
        </div>

        <div className="bg-base-100 rounded-xl p-5 border border-base-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-3 text-base-content">Recent Lab Activity</h3>
          {recentResults.length === 0 ? (
            <p className="text-sm text-base-content/60 py-6 text-center">No recent test records found.</p>
          ) : (
            <div className="space-y-2 max-h-[60vh] sm:max-h-[65vh] 2xl:max-h-[70vh] overflow-y-auto">
              {recentResults.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-base-200 hover:bg-base-200/40 transition-colors">
                  <div>
                    <div className="font-medium text-sm text-base-content">{r.name}</div>
                    <div className="text-xs text-base-content/60">{r.patient} · {r.date}</div>
                  </div>
                  <div className="text-sm">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${String(r.status).toLowerCase() === 'completed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </LaboratoryLayout>
  );
};

export default LaboratoryReports;
