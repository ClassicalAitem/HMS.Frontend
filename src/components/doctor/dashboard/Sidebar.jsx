import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaThLarge, FaUsers, FaSignOutAlt, FaUserCheck, FaBed } from "react-icons/fa";
import { RiArrowLeftRightFill } from "react-icons/ri";
import { IoReceiptOutline } from "react-icons/io5";
import { TbCalendarPlus } from "react-icons/tb";
import { MdLockOutline } from "react-icons/md";
import { LogoutModal } from "@/components/modals";
import { useAppSelector } from "@/store/hooks";
import HospitalFavicon from "@/assets/images/favicon.svg";
import NotificationBadge from "@/components/common/NotificationBadge";
import { useNotifications } from "@/contexts/NotificationContext";
import { getAdmissions } from "@/services/api/admissionApi";

const Sidebar = ({ onCloseSidebar }) => {
  const location = useLocation();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [admittedCount, setAdmittedCount] = useState(0);
  const { user } = useAppSelector((state) => state.auth);
  const { incomingCount } = useNotifications();

  useEffect(() => {
    let mounted = true;
    const fetchAdmittedCount = async () => {
      try {
        const res = await getAdmissions();
        const raw = res?.data ?? res ?? [];
        const list = Array.isArray(raw) ? raw : [];
        const active = list.filter((a) => a.status !== "discharged" && !!a.confirmedAt);
        if (mounted) {
          setAdmittedCount(active.length);
        }
      } catch (e) {
        // quiet fallback
      }
    };
    fetchAdmittedCount();
    const interval = setInterval(fetchAdmittedCount, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const generateInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return "Dr";
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : "";
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : "";
    return firstInitial + lastInitial;
  };

  const formatRole = (role) => {
    switch (role) {
      case "doctor":
        return "Doctor";
      case "nurse":
        return "Nurse";
      case "admin":
        return "Admin";
      case "super-admin":
        return "Super Admin";
      default:
        return role || "Medical Staff";
    }
  };

  const isIncomingActive = location.pathname.startsWith("/dashboard/doctor/incoming");
  const isAdmittedActive =
    location.pathname.startsWith("/dashboard/doctor/admitted") ||
    location.pathname.startsWith("/dashboard/doctor/admittedPatients");

  const menuItems = [
    {
      icon: FaThLarge,
      label: "Dashboard",
      path: "/dashboard/doctor",
      active: location.pathname === "/dashboard/doctor",
    },
    {
      icon: RiArrowLeftRightFill,
      label: "Incoming",
      path: "/dashboard/doctor/incoming",
      active: isIncomingActive,
      badge: isIncomingActive ? 0 : incomingCount,
    },
    {
      icon: FaBed,
      label: "Admitted Patients",
      path: "/dashboard/doctor/admitted",
      active: isAdmittedActive,
      badge: isAdmittedActive ? 0 : admittedCount,
    },
    {
      icon: FaUsers,
      label: "Patients",
      path: "/dashboard/doctor/patientshistory",
      active:
        location.pathname === "/dashboard/doctor/patientshistory" ||
        location.pathname.startsWith("/dashboard/doctor/patient"),
    },
    {
      icon: IoReceiptOutline,
      label: "Payment Records",
      path: "/dashboard/doctor/payment-records",
      active: location.pathname.startsWith("/dashboard/doctor/payment-records"),
    },
    {
      icon: TbCalendarPlus,
      label: "Appointments",
      path: "/dashboard/doctor/appointments",
      active: location.pathname.startsWith("/dashboard/doctor/appointments"),
    },
    {
      icon: FaUserCheck,
      label: "Attended Today",
      path: "/dashboard/doctor/attended-today",
      active: location.pathname === "/dashboard/doctor/attended-today",
    },
  ];

  const MenuItem = ({ icon: Icon, label, path, active, badge }) => (
    <Link
      to={path}
      onClick={onCloseSidebar}
      className={`flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
        active
          ? "bg-primary text-primary-content shadow-xs"
          : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
      }`}
    >
      <div className="flex items-center space-x-3 min-w-0">
        <Icon className="w-5 h-5 shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      {badge > 0 && <NotificationBadge count={badge} />}
    </Link>
  );

  return (
    <div className="flex flex-col w-64 h-full border-r border-base-200 bg-base-100">
      {/* Kolak Logo Header */}
      <div className="p-5 border-b border-base-200">
        <div className="flex items-center justify-center space-x-2.5">
          <img src={HospitalFavicon} alt="Kolak Hospital" className="w-auto h-10" />
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold text-base-content tracking-tight">Kolak</span>
            <span className="text-xs font-semibold text-base-content/60">- Hospital -</span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item, index) => (
          <MenuItem
            key={index}
            icon={item.icon}
            label={item.label}
            path={item.path}
            active={item.active}
            badge={item.badge}
          />
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 space-y-1.5 border-t border-base-200">
        <Link
          to="/change-password"
          onClick={onCloseSidebar}
          className={`flex items-center px-4 py-2.5 space-x-3 text-sm font-semibold rounded-xl transition-all ${
            location.pathname === "/change-password"
              ? "bg-primary text-primary-content shadow-xs"
              : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
          }`}
        >
          <MdLockOutline className="w-5 h-5 shrink-0" />
          <span>Change Password</span>
        </Link>

        <button
          onClick={() => setIsLogoutModalOpen(true)}
          className="flex items-center px-4 py-2.5 space-x-3 w-full text-sm font-semibold text-left rounded-xl transition-all text-base-content/70 hover:bg-base-200 hover:text-base-content"
        >
          <FaSignOutAlt className="w-5 h-5 shrink-0" />
          <span>Log Out</span>
        </button>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-base-200">
        <div className="flex items-center space-x-3">
          <div className="flex justify-center items-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={`${user.firstName} ${user.lastName}`}
                className="object-cover w-10 h-10 rounded-full"
              />
            ) : (
              <span className="text-sm font-bold text-primary">
                {generateInitials(user?.firstName, user?.lastName)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-base-content truncate">
              {user?.firstName && user?.lastName
                ? `Dr. ${user.firstName} ${user.lastName}`
                : "Dr. Clinician"}
            </p>
            <p className="text-xs text-primary font-semibold">{formatRole(user?.role)}</p>
          </div>
        </div>
      </div>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
      />
    </div>
  );
};

export default Sidebar;