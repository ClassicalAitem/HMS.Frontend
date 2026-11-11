import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import { FaBars, FaSearch, FaKeyboard, FaTimes } from "react-icons/fa";
import { SlRefresh } from "react-icons/sl";
import ThemeSwitcher from "./ThemeSwitcher";
import HospitalFavicon from "@/assets/images/favicon.svg";

export const getRolePatientsPath = (role = "") => {
  const norm = (role || "").toLowerCase().trim().replace(/_/g, "-");
  switch (norm) {
    case "doctor":
      return "/dashboard/doctor/patientsHistory";
    case "nurse":
      return "/dashboard/nurse/patient";
    case "front-desk":
    case "frontdesk":
    case "receptionist":
      return "/frontdesk/patients";
    case "cashier":
    case "account-officer":
      return "/cashier/patients";
    case "hmo":
      return "/dashboard/hmo/patients";
    case "admin":
      return "/dashboard/admin/patients";
    case "super-admin":
    case "superadmin":
      return "/superadmin/patients";
    case "pharmacist":
      return "/dashboard/pharmacist/patients";
    case "medical-director":
    case "medical_director":
      return "/dashboard/medical-director/patients";
    case "medical-laboratory":
    case "laboratory":
    case "lab-technician":
      return "/dashboard/laboratory/patients";
    case "sonographer":
      return "/dashboard/sonographer/patients";
    case "surgeon":
      return "/dashboard/surgeon/incoming";
    default:
      return "/frontdesk/patients";
  }
};

const Header = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAppSelector((state) => state.auth);
  const userRole = user?.role || user?.accountType || "";

  const urlSearch = searchParams.get("search") || searchParams.get("q") || "";
  const [headerSearch, setHeaderSearch] = useState(() => urlSearch || "");
  const [isSearchExpanded, setIsSearchExpanded] = useState(() => Boolean(urlSearch));
  const inputRef = useRef(null);

  // Sync with URL param if it changes
  useEffect(() => {
    if (urlSearch !== undefined) {
      setHeaderSearch((prev) => (urlSearch !== prev ? urlSearch : prev));
      if (urlSearch) setIsSearchExpanded(true);
    }
  }, [urlSearch]);

  // Two-way sync: listen to updates typed directly in the table search box
  useEffect(() => {
    const handleSyncFromTable = (e) => {
      const q = e?.detail?.query ?? "";
      setHeaderSearch(q);
      if (q) setIsSearchExpanded(true);
    };
    window.addEventListener("sync-header-search", handleSyncFromTable);
    return () => window.removeEventListener("sync-header-search", handleSyncFromTable);
  }, []);

  // Allow global shortcut (Ctrl+K) to focus this header search input
  useEffect(() => {
    const handleFocusSearch = () => {
      setIsSearchExpanded(true);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 30);
    };
    window.addEventListener("focus-header-search", handleFocusSearch);
    return () => window.removeEventListener("focus-header-search", handleFocusSearch);
  }, []);

  // Auto-focus and expand the search bar when opening or navigating to patient pages so the user can immediately type
  useEffect(() => {
    const isPatientPage = location.pathname.includes("/patient") || location.pathname.includes("/allPatients");
    if (isPatientPage) {
      setIsSearchExpanded(true);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const handleRefresh = () => {
    window.location.reload();
  };

  // Real-time keystroke synchronization between Top Search and Table
  const handleSearchChange = (val) => {
    setHeaderSearch(val);

    // Live broadcast to DataTable / active patient queues
    window.dispatchEvent(new CustomEvent("apply-table-search", { detail: { query: val } }));

    // If currently on a patient list page, update the browser URL search query without reloads
    const isPatientPage = location.pathname.includes("/patient") || location.pathname.includes("/allPatients");
    if (isPatientPage) {
      const newUrl = new URL(window.location.href);
      if (val.trim()) {
        newUrl.searchParams.set("search", val.trim());
      } else {
        newUrl.searchParams.delete("search");
      }
      window.history.replaceState({}, "", newUrl.toString());
    }
  };

  const handleClearSearch = () => {
    handleSearchChange("");
    inputRef.current?.focus();
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const query = headerSearch.trim();
    const targetPath = getRolePatientsPath(userRole);
    const isOnTarget = location.pathname === targetPath;

    if (!isOnTarget) {
      if (query) {
        navigate(`${targetPath}?search=${encodeURIComponent(query)}`);
      } else {
        navigate(targetPath);
      }
    }

    // Ensure table receives the final search term
    window.dispatchEvent(new CustomEvent("apply-table-search", { detail: { query } }));
  };

  const handleOpenShortcuts = () => {
    if (typeof window.openShortcutsGuide === "function") {
      window.openShortcutsGuide();
    } else {
      window.dispatchEvent(new CustomEvent("open-shortcuts-guide"));
    }
  };

  return (
    <div className="h-16 shrink-0">
      <header className="fixed inset-x-0 top-0 z-[60] h-16 border-b border-base-200 bg-base-100">
        <div className="flex h-full items-center">
          {/* Desktop Logo */}
          <div className="hidden h-full w-64 shrink-0 items-center border-r border-base-200 px-4 lg:flex">
            <div className="flex items-center gap-2">
              <img src={HospitalFavicon} alt="Kolak Hospital" className="h-10 w-auto shrink-0" />
              <div className="flex min-w-0 flex-col items-center">
                <span className="text-xl font-bold text-base-content">Kolak</span>
                <span className="text-xs text-base-content/70">- Hospital -</span>
              </div>
            </div>
          </div>

          {/* Mobile Menu & Logo */}
          <div className="flex h-full items-center gap-2 px-3 lg:hidden">
            <button
              onClick={onToggleSidebar}
              className="btn btn-ghost btn-circle btn-sm shrink-0"
              title="Toggle Menu"
              aria-label="Toggle menu"
            >
              <FaBars className="h-4 w-4" />
            </button>
            <img src={HospitalFavicon} alt="" className="h-9 w-auto shrink-0" />
            <div className="flex flex-col">
              <span className="text-base font-bold text-base-content">Kolak</span>
              <span className="text-[10px] text-base-content/70">- Hospital -</span>
            </div>
          </div>

          {/* Right Action Icons (with Expandable Search) */}
          <div className="ml-auto flex shrink-0 items-center gap-1 px-3 sm:gap-2 lg:px-4">
            {/* Expandable Search Input (Collapses to icon next to keyboard icon) */}
            <div className="relative flex items-center">
              {isSearchExpanded ? (
                <form
                  onSubmit={handleSearchSubmit}
                  className="relative flex items-center transition-all duration-300 ease-in-out w-48 sm:w-64 md:w-80"
                >
                  <FaSearch className="absolute left-3 text-primary text-xs pointer-events-none" />
                  <input
                    ref={inputRef}
                    id="header-patient-search"
                    type="text"
                    placeholder="Search patient... (Ctrl+K)"
                    value={headerSearch}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        handleSearchChange("");
                        setIsSearchExpanded(false);
                      }
                    }}
                    autoComplete="off"
                    spellCheck={false}
                    className="input input-sm w-full pl-9 pr-14 text-xs bg-base-200/90 border border-base-300 rounded-xl focus:bg-base-100 focus:border-primary transition-all text-base-content shadow-xs"
                    autoFocus
                  />
                  <div className="absolute right-1 flex items-center gap-0.5">
                    {headerSearch && (
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        className="btn btn-ghost btn-circle btn-xs text-base-content/50"
                        title="Clear search"
                      >
                        <FaTimes className="w-2.5 h-2.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSearchChange("");
                        setIsSearchExpanded(false);
                      }}
                      className="btn btn-ghost btn-circle btn-xs text-base-content/40 hover:text-base-content"
                      title="Collapse search"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchExpanded(true);
                    setTimeout(() => inputRef.current?.focus(), 30);
                  }}
                  className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-base-content"
                  title="Search patients (Ctrl+K)"
                  aria-label="Open search"
                >
                  <FaSearch className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={handleOpenShortcuts}
              className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-base-content"
              title="Keyboard Shortcuts Cheat Sheet (Ctrl+/)"
              aria-label="Shortcuts guide"
            >
              <FaKeyboard className="h-4 w-4" />
            </button>
            <ThemeSwitcher className="2xl:h-4 2xl:w-4" />
            <button
              onClick={handleRefresh}
              className="btn btn-ghost btn-circle btn-sm"
              title="Refresh (Ctrl+Shift+R)"
              aria-label="Refresh page"
            >
              <SlRefresh className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
