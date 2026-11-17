import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import HrLayout from "@/layouts/hr/HrLayout";
import { DataTable } from "@/components/common";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchPatients } from "@/store/slices/patientsSlice";
import KolakLoader from "@/components/common/KolakLoader";
import PatientCardTypeInfo from "@/components/common/PatientCardTypeInfo";
import ViewDependantsModal from "@/components/superadmin/patients/ViewDependantsModal";
import { EmptyState } from "@/components/common";
import toast from "react-hot-toast";
import {
  FaUsers,
  FaUser,
  FaChild,
  FaSearch,
  FaSync,
  FaEye,
  FaPhone,
  FaHospital,
  FaVenusMars,
  FaCalendarAlt,
  FaUserFriends,
} from "react-icons/fa";
import { PiUsersThreeDuotone } from "react-icons/pi";

const calculateAge = (dob) => {
  if (!dob) return "—";
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? `${age} yrs` : "—";
};

const HrPatients = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { patients, isLoading } = useAppSelector((state) => state.patients);

  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'principal' | 'dependants'
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGender, setSelectedGender] = useState("all");
  const [selectedCardType, setSelectedCardType] = useState("all");
  const [selectedPatientForDependants, setSelectedPatientForDependants] = useState(null);
  const [isDependantsModalOpen, setIsDependantsModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchPatients());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchPatients());
    toast.success("Patient directory refreshed");
  };

  // Map primary patients
  const primaryPatients = useMemo(() => {
    return patients.map((patient, index) => {
      const firstName = (patient.firstName || "").trim();
      const middleName = (patient.middleName || "").trim();
      const lastName = (patient.lastName || "").trim();
      const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");
      const displayName = fullName || "Unknown Patient";
      const patientId = patient.id || patient._id;

      return {
        ...patient,
        id: patientId,
        patientId,
        primaryPatientId: patientId,
        serialNumber: index + 1,
        recordType: "primary",
        isDependant: false,
        firstName,
        middleName,
        lastName,
        name: displayName,
        fullName,
        age: calculateAge(patient.dob || patient.dateOfBirth),
        dependantsCount: (patient.dependants || []).length,
        dependantsList: patient.dependants || [],
        cardType: patient.cardType || "personal",
        status: patient.status || "Active",
        patientSnapshot: patient,
      };
    });
  }, [patients]);

  // Map dependants
  const dependantsOnly = useMemo(() => {
    return patients.flatMap((patient) => {
      const guardianFirstName = (patient.firstName || "").trim();
      const guardianMiddleName = (patient.middleName || "").trim();
      const guardianLastName = (patient.lastName || "").trim();
      const guardianName =
        [guardianFirstName, guardianMiddleName, guardianLastName]
          .filter(Boolean)
          .join(" ") || "Unknown Principal";
      const guardianId = patient.id || patient._id;

      return (patient.dependants || []).map((dep, depIndex) => {
        const depFirstName = (dep.firstName || "").trim();
        const depLastName = (dep.lastName || "").trim();
        const depFullName = [depFirstName, depLastName].filter(Boolean).join(" ");
        const depDisplayName = depFullName || "Unknown Dependant";
        const depId = dep.id || dep._id;

        return {
          ...dep,
          id: `${guardianId}-${depId || depIndex}`,
          dependantId: depId,
          primaryPatientId: guardianId,
          primaryPatientName: guardianName,
          guardianHospitalId: patient.hospitalId,
          hospitalId: dep.hospitalId || `${patient.hospitalId || "PAT"}-D`,
          recordType: "dependant",
          isDependant: true,
          relationship: dep.relationship || "Dependant",
          name: depDisplayName,
          fullName: depFullName,
          age: calculateAge(dep.dob || dep.dateOfBirth),
          gender: dep.gender || "—",
          phoneNumber: dep.phoneNumber || patient.phoneNumber || "—",
          cardType: patient.cardType || "personal",
          status: dep.status || patient.status || "Active",
          patientSnapshot: patient,
          dependantSnapshot: dep,
        };
      });
    });
  }, [patients]);

  // All combined
  const allRecords = useMemo(() => {
    return [...primaryPatients, ...dependantsOnly];
  }, [primaryPatients, dependantsOnly]);

  // Filtered by tab, search, gender, cardType
  const filteredData = useMemo(() => {
    let source = allRecords;
    if (activeTab === "principal") source = primaryPatients;
    else if (activeTab === "dependants") source = dependantsOnly;

    return source.filter((item) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        String(item.name || "").toLowerCase().includes(q) ||
        String(item.hospitalId || "").toLowerCase().includes(q) ||
        String(item.phoneNumber || "").toLowerCase().includes(q) ||
        String(item.primaryPatientName || "").toLowerCase().includes(q);

      const matchesGender =
        selectedGender === "all" ||
        String(item.gender || "").toLowerCase() === selectedGender.toLowerCase();

      const matchesCard =
        selectedCardType === "all" ||
        String(item.cardType || "").toLowerCase() === selectedCardType.toLowerCase();

      return matchesSearch && matchesGender && matchesCard;
    });
  }, [allRecords, primaryPatients, dependantsOnly, activeTab, searchTerm, selectedGender, selectedCardType]);

  const handleNavigateToDetails = useCallback(
    (row) => {
      if (row.isDependant) {
        navigate(
          `/dashboard/hr/patients/${row.primaryPatientId || row.patientId}?dependantId=${
            row.dependantId || row.id
          }`,
          {
            state: {
              patientSnapshot: row.patientSnapshot,
              dependantId: row.dependantId || row.id,
              dependantSnapshot: row.dependantSnapshot || row,
            },
          }
        );
      } else {
        navigate(`/dashboard/hr/patients/${row.id || row.patientId}`, {
          state: {
            patientSnapshot: row.patientSnapshot || row,
          },
        });
      }
    },
    [navigate]
  );

  const columns = useMemo(
    () => [
      {
        key: "hospitalId",
        title: "Hospital ID",
        sortable: true,
        className: "text-base-content font-mono font-semibold text-xs",
        render: (value, row) => (
          <button
            type="button"
            onClick={() => handleNavigateToDetails(row)}
            className="text-primary hover:underline font-bold text-left cursor-pointer"
          >
            {value || "—"}
          </button>
        ),
      },
      {
        key: "name",
        title: "Patient / Subject Name",
        sortable: true,
        render: (value, row) =>
          row.isDependant ? (
            <div>
              <button
                type="button"
                onClick={() => handleNavigateToDetails(row)}
                className="font-bold text-sm text-left text-base-content hover:text-primary transition-colors cursor-pointer"
              >
                {value}
              </button>
              <div className="text-[11px] text-base-content/60">
                Dep. of{" "}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/dashboard/hr/patients/${row.primaryPatientId}`);
                  }}
                  className="text-primary hover:underline font-semibold"
                >
                  {row.primaryPatientName}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleNavigateToDetails(row)}
                className="font-bold text-sm text-left text-base-content hover:text-primary transition-colors cursor-pointer"
              >
                {value}
              </button>
              {row.isOldPatient && (
                <span className="badge badge-neutral badge-xs uppercase text-[9px] font-bold">
                  Old Patient
                </span>
              )}
            </div>
          ),
      },
      {
        key: "recordType",
        title: "Type / Cadre",
        render: (value, row) =>
          row.isDependant ? (
            <span className="badge badge-sm badge-secondary gap-1 font-medium capitalize">
              <FaChild className="w-2.5 h-2.5" /> {row.relationship || "Dependant"}
            </span>
          ) : (
            <span className="badge badge-sm badge-outline gap-1 font-medium">
              <FaUser className="w-2.5 h-2.5" /> Primary
            </span>
          ),
      },
      {
        key: "gender",
        title: "Gender",
        sortable: true,
        render: (value) => <span className="capitalize text-xs">{value || "—"}</span>,
      },
      {
        key: "age",
        title: "Age",
        sortable: true,
        render: (value) => <span className="text-xs">{value || "—"}</span>,
      },
      {
        key: "phoneNumber",
        title: "Contact Phone",
        render: (value) => (
          <span className="text-xs font-mono text-base-content/80">{value || "—"}</span>
        ),
      },
      {
        key: "cardType",
        title: "Card Plan",
        render: (value, row) => <PatientCardTypeInfo patient={row} />,
      },
      {
        key: "dependantsCount",
        title: "Dependants",
        className: "text-center",
        render: (value, row) =>
          !row.isDependant && row.dependantsCount > 0 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPatientForDependants(row);
                setIsDependantsModalOpen(true);
              }}
              className="badge badge-sm badge-info gap-1 cursor-pointer hover:badge-primary transition-colors"
              title="Click to view dependants"
            >
              <FaUserFriends className="w-3 h-3" />
              <span>{row.dependantsCount} Dep(s)</span>
            </button>
          ) : (
            <span className="text-xs text-base-content/40">—</span>
          ),
      },
      {
        key: "actions",
        title: "Actions",
        className: "text-right",
        render: (_, row) => (
          <button
            type="button"
            onClick={() => handleNavigateToDetails(row)}
            className="btn btn-xs btn-ghost btn-square text-primary hover:bg-primary/10"
            title="View Full Patient Info"
          >
            <FaEye className="w-4 h-4" />
          </button>
        ),
      },
    ],
    [handleNavigateToDetails, navigate]
  );

  return (
    <HrLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge badge-primary badge-sm font-semibold uppercase tracking-wider">
                Hospital Registry
              </span>
              <span className="text-xs text-base-content/60">
                Patients & Family Dependants
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-base-content mt-1">
              Patient Directory & Records
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70">
              Browse hospital registrants, principal account holders, and family dependants with full read-only detail profiles.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="btn btn-sm btn-outline border-base-300 hover:border-primary gap-2"
            >
              <FaSync className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh Directory</span>
            </button>
          </div>
        </div>

        {/* Top Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl border border-base-200 bg-base-100 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-base-content/60">
                Total Registrants
              </span>
              <PiUsersThreeDuotone className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-base-content mt-2">
              {allRecords.length.toLocaleString()}
            </p>
            <p className="text-xs text-base-content/60 mt-1">All unique individuals</p>
          </div>

          <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-primary">
                Principal Patients
              </span>
              <FaUser className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-primary mt-2">
              {primaryPatients.length.toLocaleString()}
            </p>
            <p className="text-xs text-base-content/60 mt-1">Direct account files</p>
          </div>

          <div className="p-4 rounded-2xl border border-secondary/20 bg-secondary/5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-secondary">
                Family Dependants
              </span>
              <FaChild className="w-4 h-4 text-secondary" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-secondary mt-2">
              {dependantsOnly.length.toLocaleString()}
            </p>
            <p className="text-xs text-base-content/60 mt-1">Linked dependents</p>
          </div>

          <div className="p-4 rounded-2xl border border-info/20 bg-info/5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-info">
                Dependant Ratio
              </span>
              <FaUsers className="w-4 h-4 text-info" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-info mt-2">
              {primaryPatients.length > 0
                ? (dependantsOnly.length / primaryPatients.length).toFixed(2)
                : "0.00"}
            </p>
            <p className="text-xs text-base-content/60 mt-1">Per principal patient</p>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-base-200 pb-3">
          <button
            onClick={() => setActiveTab("all")}
            className={`btn btn-sm rounded-xl gap-2 ${
              activeTab === "all" ? "btn-primary" : "btn-ghost text-base-content/70"
            }`}
          >
            <span>All Individuals</span>
            <span className="badge badge-sm badge-neutral">{allRecords.length}</span>
          </button>

          <button
            onClick={() => setActiveTab("principal")}
            className={`btn btn-sm rounded-xl gap-2 ${
              activeTab === "principal"
                ? "btn-primary"
                : "btn-ghost text-base-content/70"
            }`}
          >
            <FaUser className="w-3.5 h-3.5" />
            <span>Principal Patients Only</span>
            <span className="badge badge-sm badge-primary">
              {primaryPatients.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("dependants")}
            className={`btn btn-sm rounded-xl gap-2 ${
              activeTab === "dependants"
                ? "btn-primary"
                : "btn-ghost text-base-content/70"
            }`}
          >
            <FaChild className="w-3.5 h-3.5" />
            <span>Family Dependants Only</span>
            <span className="badge badge-sm badge-secondary">
              {dependantsOnly.length}
            </span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-4 rounded-2xl border border-base-200 bg-base-100 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by patient name, Hospital ID, phone or guardian..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input input-sm input-bordered w-full pl-10 h-10 rounded-xl"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="select select-sm select-bordered h-10 rounded-xl text-xs"
            >
              <option value="all">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>

            <select
              value={selectedCardType}
              onChange={(e) => setSelectedCardType(e.target.value)}
              className="select select-sm select-bordered h-10 rounded-xl text-xs"
            >
              <option value="all">All Card Types</option>
              <option value="personal">Personal Plan</option>
              <option value="family">Family Plan</option>
              <option value="corporate">Corporate Plan</option>
              <option value="hmo">HMO Insured</option>
            </select>
          </div>
        </div>

        {/* Patients Table */}
        {isLoading ? (
          <div className="py-20 flex justify-center items-center">
            <KolakLoader />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-12 rounded-2xl border border-base-200 bg-base-100 text-center">
            <EmptyState
              title="No Patient Records Found"
              message={
                searchTerm || selectedGender !== "all" || selectedCardType !== "all"
                  ? "No patients match your search criteria."
                  : "No patient records registered in the system."
              }
            />
          </div>
        ) : (
          <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
            <DataTable
              columns={columns}
              data={filteredData}
              pagination={true}
              itemsPerPage={12}
              searchable={false}
              exportable={true}
              exportFileName="kolak_hospital_patients_directory.csv"
            />
          </div>
        )}

        {/* View Dependants Modal */}
        {selectedPatientForDependants && (
          <ViewDependantsModal
            isOpen={isDependantsModalOpen}
            onClose={() => {
              setIsDependantsModalOpen(false);
              setSelectedPatientForDependants(null);
            }}
            patient={selectedPatientForDependants}
          />
        )}
      </div>
    </HrLayout>
  );
};

export default HrPatients;
