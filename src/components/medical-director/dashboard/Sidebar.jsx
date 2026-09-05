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
    if (!firstName && !lastName) return "MD";
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : "";
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : "";
    return firstInitial + lastInitial;
  };

  const formatRole = (role) => {
    switch (role) {
      case "medical-director":
        return "Medical Director";
      case "doctor":
        return "Doctor";
      case "nurse":
        return "Nurse";
      case "admin":
        return "Admin";
      case "super-admin":
        return "Super Admin";
      default:
        return role || "Medical Director";
    }
  };

  const isIncomingActive = location.pathname.startsWith("/dashboard/medical-director/incoming");
  const isAdmittedActive =
    location.pathname.startsWith("/dashboard/medical-director/admitted") ||
    location.pathname.startsWith("/dashboard/medical-director/admittedPatients");

  const menuItems = [
    {
      icon: FaThLarge,
      label: "Dashboard",
      path: "/dashboard/medical-director",
      active: location.pathname === "/dashboard/medical-director",
    },
    {
      icon: RiArrowLeftRightFill,
      label: "Incoming",
      path: "/dashboard/medical-director/incoming",
      active: isIncomingActive,
      badge: isIncomingActive ? 0 : incomingCount,
    },
    {
      icon: FaBed,
      label: "Admitted Patients",
      path: "/dashboard/medical-director/admitted",
      active: isAdmittedActive,
      badge: isAdmittedActive ? 0 : admittedCount,
    },
    {
      icon: FaUserCheck,
      label: "Attended Today",
      path: "/dashboard/medical-director/attended-today",
      active: location.pathname === "/dashboard/medical-director/attended-today",
    },
    {
      icon: TbCalendarPlus,
      label: "Appointments",
      path: "/dashboard/medical-director/appointments",
      active: location.pathname === "/dashboard/medical-director/appointments",
    },
    {
      icon: FaUsers,
      label: "Patients",
      path: "/dashboard/medical-director/patients",
      active:
        location.pathname === "/dashboard/medical-director/patients" ||
        location.pathname.startsWith("/dashboard/medical-director/patient"),
    },
    {
      icon: IoReceiptOutline,
      label: "Payment Records",
      path: "/dashboard/medical-director/payment-records",
      active: location.pathname.startsWith("/dashboard/medical-director/payment-records"),
    },
  ];

  const MenuItem = ({ icon: Icon, label, path, active, badge }) => (
    <Link
      to={path}
      onClick={onCloseSidebar}
      className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
        active
          ? "bg-primary text-primary-content font-semibold shadow-xs"
          : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
      }`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {badge > 0 && <NotificationBadge count={badge} />}
    </Link>
  );

  return (
    <div className="flex flex-col w-64 h-full border-r bg-base-100 border-base-200 overflow-y-auto">
      {/* Hospital Logo Header */}
      <div className="p-5 border-b border-base-200">
        <div className="flex justify-center items-center">
          <div className="flex items-center space-x-3">
            <img src={HospitalFavicon} alt="Kolak Hospital" className="w-auto h-10 shrink-0" />
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-base-content leading-none">Kolak</span>
              <span className="text-xs text-base-content/60 font-medium tracking-wide mt-1">- Hospital -</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1.5">
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
      <div className="p-3 space-y-1.5 border-t border-base-200">
        <Link
          to="/change-password"
          onClick={onCloseSidebar}
          className={`flex items-center px-4 py-3 space-x-3 text-sm font-medium rounded-xl transition-all ${
            location.pathname === "/change-password"
              ? "bg-primary text-primary-content font-semibold shadow-xs"
              : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
          }`}
        >
          <MdLockOutline className="w-5 h-5 shrink-0" />
          <span>Change Password</span>
        </Link>

        <button
          onClick={() => setIsLogoutModalOpen(true)}
          className="flex items-center px-4 py-3 space-x-3 w-full text-sm font-medium text-left rounded-xl transition-all text-base-content/70 hover:bg-base-200 hover:text-base-content"
        >
          <FaSignOutAlt className="w-5 h-5 shrink-0" />
          <span>Log Out</span>
        </button>
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-base-200 bg-base-200/40">
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
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-base-content truncate">
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : "Medical Director"}
            </p>
            <p className="text-xs text-primary font-semibold truncate">
              {formatRole(user?.role || user?.accountType)}
            </p>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
      />
    </div>
  );
};

export default Sidebar;