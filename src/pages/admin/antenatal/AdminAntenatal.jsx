/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useMemo } from "react";
import AdminLayout from "@/layouts/admin/AdminLayout";
import {
  FaSearch,
  FaFileExport,
  FaInfoCircle,
  FaChevronLeft,
  FaChevronRight,
  FaBaby,
} from "react-icons/fa";
import { MdPregnantWoman } from "react-icons/md";
import { getAllAnteNatalRecords } from "@/services/api/anteNatalAPI";
import { exportRowsToCsv } from "../reports/adminReportUtils";
import { formatNigeriaDate } from "@/utils/formatDateTimeUtils";

const AdminAntenatal = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    let mounted = true;
    const fetchAntenatal = async () => {
      setLoading(true);
      try {
        const res = await getAllAnteNatalRecords();
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res)
          ? res
          : [];
        if (mounted) setRecords(list);
      } catch (err) {
        console.error("Error fetching antenatal records:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAntenatal();
    return () => {
      mounted = false;
    };
  }, []);

  const formattedAntenatal = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return records
      .map((rec, idx) => {
        const patient = rec.patient || {};
        const present = rec.presentPregnancyHistory || {};
        const exam = Array.isArray(rec.examinations) ? rec.examinations[rec.examinations.length - 1] : {};
        const isDelivered = rec.isDelivered || Boolean(rec.deliveryDate);
        const deliveryType = rec.deliveryMode || rec.modeOfDelivery || (isDelivered ? "SVD (Normal Vaginal Delivery)" : "Active Gestation");

        return {
          id: rec._id || rec.id || `anc-${idx}`,
          patientName:
            [patient.firstName, patient.lastName].filter(Boolean).join(" ").trim() ||
            patient.fullName ||
            rec.patientName ||
            "—",
          hospitalId: patient.hospitalId || rec.patientHospitalId || "—",
          bookingDate: present.dateOfBooking || rec.createdAt || "",
          lmp: present.LMP || "—",
          edd: present.EDD || "—",
          ega: exam?.EGA || present.durationOfPregnancyInWeek ? `${exam?.EGA || present.durationOfPregnancyInWeek} wks` : "—",
          deliveryType,
          foetalHeart: exam?.foetalHeart || "Normal",
          status: isDelivered ? "Delivered" : "Antenatal Booking Active",
        };
      })
      .filter((row) => {
        return (
          !term ||
          row.patientName.toLowerCase().includes(term) ||
          row.hospitalId.toLowerCase().includes(term) ||
          row.deliveryType.toLowerCase().includes(term) ||
          row.status.toLowerCase().includes(term)
        );
      });
  }, [records, searchTerm]);

  const totalRows = formattedAntenatal.length;
  const totalPages = Math.ceil(totalRows / itemsPerPage) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return formattedAntenatal.slice(start, start + itemsPerPage);
  }, [formattedAntenatal, currentPage, itemsPerPage]);

  const handleExport = () => {
    const columns = [
      { key: "hospitalId", label: "Hospital ID" },
      { key: "patientName", label: "Mother / Patient Name" },
      { key: "bookingDate", label: "Booking Date" },
      { key: "lmp", label: "LMP" },
      { key: "edd", label: "EDD" },
      { key: "ega", label: "Gestational Age" },
      { key: "deliveryType", label: "Delivery Mode" },
      { key: "foetalHeart", label: "Foetal Heart Rate" },
      { key: "status", label: "Status" },
    ];
    exportRowsToCsv(formattedAntenatal, columns, `antenatal_maternity_svd_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-accent/10 text-accent">
                Maternity & Obstetrics
              </span>
              <span className="text-xs text-base-content/60">Antenatal Care & Delivery Mode</span>
            </div>
            <h1 className="text-2xl font-bold text-base-content mt-1">
              Antenatal Care & Maternity / SVD Reports
            </h1>
            <p className="text-sm text-base-content/70 mt-0.5">
              Track expectant mothers, gestational timelines, LMP, EDD, and delivery outcomes including Spontaneous Vaginal Deliveries (SVD).
            </p>
          </div>

          <button
            onClick={handleExport}
            disabled={!formattedAntenatal.length}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-primary text-primary-content hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
          >
            <FaFileExport className="w-4 h-4" />
            <span>Export Antenatal</span>
          </button>
        </div>

        {/* Clinical Note Banner for SVD */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary-content">
          <FaInfoCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-primary">
              Medical Explanation: What is SVD (Spontaneous Vaginal Delivery)?
            </h4>
            <p className="text-xs text-base-content/85 mt-1 leading-relaxed">
              <strong>SVD</strong> stands for <strong>Spontaneous Vaginal Delivery</strong>. It is the natural, unassisted delivery of a baby through the vaginal canal without needing Caesarean surgery (C-Section) or vacuum/forceps extraction. Tracking SVD vs Caesarean sections is one of the most critical health indicators in hospital maternal care audits.
            </p>
          </div>
        </div>

        {/* Counter Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">Registered Mothers</p>
            <p className="text-2xl font-extrabold text-base-content mt-1">{records.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">Active Pregnancies</p>
            <p className="text-2xl font-extrabold text-accent mt-1">
              {formattedAntenatal.filter((r) => r.status.includes("Active")).length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">SVD Deliveries</p>
            <p className="text-2xl font-extrabold text-success mt-1">
              {formattedAntenatal.filter((r) => r.deliveryType.toLowerCase().includes("svd")).length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">Delivered Cases</p>
            <p className="text-2xl font-extrabold text-primary mt-1">
              {formattedAntenatal.filter((r) => r.status.includes("Delivered")).length}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-base-100 p-4 rounded-xl border border-base-200">
          <div className="relative">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by mother's name, hospital ID, delivery mode, or status..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="input input-sm w-full pl-10 bg-base-200/50 border-base-300 rounded-lg"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="text-sm text-base-content/60 mt-4">Loading antenatal data...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full text-left">
                <thead className="bg-base-200/60 text-xs font-bold text-base-content uppercase border-b border-base-200">
                  <tr>
                    <th className="py-3.5 px-4">Hospital ID</th>
                    <th className="px-4">Mother's Name</th>
                    <th className="px-4">Booking Date</th>
                    <th className="px-4">LMP</th>
                    <th className="px-4">EDD</th>
                    <th className="px-4">Gestational Age</th>
                    <th className="px-4">Foetal Heart</th>
                    <th className="px-4">Delivery Mode</th>
                    <th className="px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-200 text-sm">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-base-content/50">
                        No antenatal records found.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((anc, idx) => (
                      <tr key={anc.id || idx} className="hover:bg-base-200/40">
                        <td className="px-4 py-3 font-semibold text-accent">{anc.hospitalId}</td>
                        <td className="px-4 py-3 font-medium text-base-content">{anc.patientName}</td>
                        <td className="px-4 py-3 text-base-content/80 whitespace-nowrap">
                          {anc.bookingDate ? formatNigeriaDate(anc.bookingDate) : "—"}
                        </td>
                        <td className="px-4 py-3 text-base-content/80 whitespace-nowrap">{anc.lmp}</td>
                        <td className="px-4 py-3 text-base-content/80 whitespace-nowrap font-semibold">
                          {anc.edd}
                        </td>
                        <td className="px-4 py-3 text-base-content/80">{anc.ega}</td>
                        <td className="px-4 py-3 text-base-content/80">{anc.foetalHeart}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              anc.deliveryType.includes("SVD")
                                ? "bg-success/10 text-success"
                                : "bg-base-200 text-base-content/80"
                            }`}
                          >
                            {anc.deliveryType}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              anc.status.includes("Active")
                                ? "bg-info/10 text-info"
                                : "bg-success/10 text-success"
                            }`}
                          >
                            {anc.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-base-200 bg-base-100">
              <span className="text-xs text-base-content/60">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, totalRows)} of {totalRows}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-base-200 hover:bg-base-300 disabled:opacity-40 transition-colors"
                >
                  <FaChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-semibold px-3 py-1.5 bg-base-200 rounded-lg">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-base-200 hover:bg-base-300 disabled:opacity-40 transition-colors"
                >
                  <FaChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAntenatal;

