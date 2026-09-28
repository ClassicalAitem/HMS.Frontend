import React from "react";
import { FaBars } from "react-icons/fa";
import { SlRefresh } from "react-icons/sl";
import ThemeSwitcher from "./ThemeSwitcher";
import HospitalFavicon from "@/assets/images/favicon.svg";

const Header = ({ onToggleSidebar }) => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="h-16 shrink-0">
      <header className="fixed inset-x-0 top-0 z-[60] h-16 border-b border-base-200 bg-base-100">
        <div className="flex h-full items-center">
          <div className="hidden h-full w-64 shrink-0 items-center gap-2 border-r border-base-200 px-4 lg:flex">
            <img src={HospitalFavicon} alt="Kolak Hospital" className="h-10 w-auto shrink-0" />
            <div className="flex min-w-0 flex-col items-center">
              <span className="text-xl font-bold text-base-content">Kolak</span>
              <span className="text-xs text-base-content/70">- Hospital -</span>
            </div>
          </div>

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

          <div className="ml-auto flex shrink-0 items-center gap-1 px-3 sm:gap-2 lg:px-4">
            <ThemeSwitcher className="2xl:h-4 2xl:w-4" />
            <button
              onClick={handleRefresh}
              className="btn btn-ghost btn-circle btn-sm"
              title="Refresh"
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