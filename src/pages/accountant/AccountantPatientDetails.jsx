import React, { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import AccountantLayout from "@/layouts/accountant/AccountantLayout";
import accountantAPI from "@/services/api/accountantAPI";
import KolakLoader from "@/components/common/KolakLoader";
import { formatNigeriaDateTime } from "@/utils/formatDateTimeUtils";
import { formatNaira, exportToCsv, usePagination, PaginationBar } from "./accountantUtils";
import { FaArrowLeft, FaDownload, FaReceipt, FaFileInvoiceDollar } from "react-icons/fa";
import toast from "react-hot-toast";

const AccountantPatientDetails = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = searchParams.get("type") === "dependant" ? "dependant" : "patient";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    profile: null,
    summary: { totalBilled: 0, totalDiscount: 0, totalPaid: 0, totalOutstanding: 0, billsCount: 0 },
    bills: [],
  });

  const loadFinancials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await accountantAPI.getPatientFinancials(id, type);
      if (res?.data) setData(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load patient financial history");
    } finally {
      setLoading(false);
    }
  }, [id, type]);

  useEffect(() => {
    loadFinancials();
  }, [loadFinancials]);

  const handleExportCsv = () => {
    const rows = [];
    for (const bill of data.bills) {
      const itemsText = (bill.itemDetails || [])
        .map((it) => `${it.description || it.service || "Item"} (x${it.quantity || 1}: ${it.total || 0})`)
        .join("; ");
      rows.push([
        formatNigeriaDateTime(bill.createdAt),
        bill.id,
        itemsText,
        bill.totalAmount,
        bill.discountAmount,
        bill.amountPaid,
        bill.outstandingBill,
        bill.isCleared ? "Cleared" : "Outstanding",
      ]);
    }
    exportToCsv(
      `patient-financials-${data.profile?.hospitalId || id}.csv`,
      ["Date", "Bill ID", "Billed Items", "Total Bill (NGN)", "Discount", "Paid (NGN)", "Outstanding (NGN)", "Status"],
      rows
    );
    toast.success("Patient financial statement exported to CSV");
  };

  const { profile, summary, bills } = data;
  const billsPagination = usePagination(bills, 10);

  return (
    <AccountantLayout>
      {loading && <KolakLoader fullscreen text="Loading patient financial details..." />}

      <div className="space-y-6">
        {/* Top Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-sm btn-ghost bg-base-200/70 rounded-xl mt-1"
            >
              <FaArrowLeft className="w-3.5 h-3.5" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-base-content">
                  {profile?.name || "Patient"}
                </h1>
                <span className="badge badge-primary badge-sm uppercase">
                  {profile?.type === "dependant" ? "Dependant" : "Patient"}
                </span>
                <span className="badge badge-ghost badge-sm font-mono">
                  {profile?.hospitalId || "—"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-base-content/70 mt-1">
                Phone: {profile?.phone || "—"} • Gender: {profile?.gender || "—"} • Card:{" "}
                <span className="uppercase font-semibold">{profile?.cardType || "—"}</span>
                {profile?.principalName && ` • Principal: ${profile.principalName}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="btn btn-sm btn-primary rounded-xl gap-1.5"
          >
            <FaDownload className="w-3.5 h-3.5" />
            Export Statement CSV
          </button>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-base-content/60">Total Billed</p>
            <p className="text-2xl font-extrabold text-base-content mt-2">
              {formatNaira(summary.totalBilled)}
            </p>
            <p className="text-xs text-base-content/60 mt-1">{summary.billsCount} bill(s)</p>
          </div>
          <div className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-base-content/60">Total Paid</p>
            <p className="text-2xl font-extrabold text-success mt-2">
              {formatNaira(summary.totalPaid)}
            </p>
            <p className="text-xs text-base-content/60 mt-1">Confirmed receipts</p>
          </div>
          <div className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-base-content/60">Discounts</p>
            <p className="text-2xl font-extrabold text-base-content mt-2">
              {formatNaira(summary.totalDiscount)}
            </p>
            <p className="text-xs text-base-content/60 mt-1">Approved waivers</p>
          </div>
          <div className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-base-content/60">Outstanding</p>
            <p className="text-2xl font-extrabold text-error mt-2">
              {formatNaira(summary.totalOutstanding)}
            </p>
            <p className="text-xs text-base-content/60 mt-1">Balance remaining</p>
          </div>
        </div>

        {/* Detailed Bills & Payments History */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-base-content flex items-center gap-2">
            <FaFileInvoiceDollar className="text-primary" />
            All Bills & Itemized Payments
          </h2>

          {bills.length === 0 ? (
            <div className="bg-base-100 rounded-2xl border border-base-200 p-8 text-center text-sm text-base-content/60">
              No billing records found for this patient.
            </div>
          ) : (
            <>
              {billsPagination.paginatedItems.map((bill) => (
              <div
                key={bill.id}
                className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-base-200">
                  <div>
                    <p className="text-sm font-bold text-base-content">
                      Bill #{bill.id.slice(0, 8).toUpperCase()}
                      {bill.dependantName && (
                        <span className="ml-2 text-xs font-normal text-base-content/60">
                          (For Dependant: {bill.dependantName})
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-base-content/60">
                      {formatNigeriaDateTime(bill.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                    <span>
                      Total: <strong>{formatNaira(bill.totalAmount)}</strong>
                    </span>
                    <span className="text-success">
                      Paid: <strong>{formatNaira(bill.amountPaid)}</strong>
                    </span>
                    {bill.outstandingBill > 0 && (
                      <span className="text-error">
                        Due: <strong>{formatNaira(bill.outstandingBill)}</strong>
                      </span>
                    )}
                    <span
                      className={`badge badge-sm ${
                        bill.isCleared ? "badge-success text-white" : "badge-warning"
                      }`}
                    >
                      {bill.isCleared ? "Cleared" : "Pending"}
                    </span>
                  </div>
                </div>

                {/* Itemized Services / Drugs */}
                <div className="overflow-x-auto">
                  <table className="table table-xs sm:table-sm w-full">
                    <thead>
                      <tr className="text-xs uppercase text-base-content/60">
                        <th>Service / Item Paid For</th>
                        <th>Category</th>
                        <th className="text-center">Qty</th>
                        <th className="text-right">Unit Price</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(bill.itemDetails || []).map((it, idx) => (
                        <tr key={idx}>
                          <td className="font-medium">{it.description || it.service || "Item"}</td>
                          <td className="capitalize text-xs text-base-content/70">
                            {it.category || "general"}
                          </td>
                          <td className="text-center">{it.quantity || 1}</td>
                          <td className="text-right">
                            {formatNaira(it.unitPrice ?? it.price ?? it.total ?? 0)}
                          </td>
                          <td className="text-right font-semibold">{formatNaira(it.total || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Receipts paid against this bill */}
                {bill.receipts && bill.receipts.length > 0 && (
                  <div className="bg-base-200/50 rounded-xl p-3 space-y-2">
                    <p className="text-xs font-bold uppercase text-base-content/70 flex items-center gap-1.5">
                      <FaReceipt className="w-3 h-3 text-primary" />
                      Payment Receipts
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {bill.receipts.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between bg-base-100 rounded-lg px-3 py-2 border border-base-200 text-xs"
                        >
                          <div>
                            <p className="font-mono font-semibold">{r.reference}</p>
                            <p className="text-base-content/60">
                              {formatNigeriaDateTime(r.paidAt)} • {r.cashierName}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-success">{formatNaira(r.amountPaid)}</p>
                            <span className="badge badge-outline badge-xs uppercase">
                              {r.paymentMethod} • {r.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
              <PaginationBar
                currentPage={billsPagination.currentPage}
                totalPages={billsPagination.totalPages}
                totalItems={billsPagination.totalItems}
                pageSize={billsPagination.pageSize}
                onPageChange={billsPagination.setCurrentPage}
                onPageSizeChange={billsPagination.setPageSize}
              />
            </>
          )}
        </div>
      </div>
    </AccountantLayout>
  );
};

export default AccountantPatientDetails;
