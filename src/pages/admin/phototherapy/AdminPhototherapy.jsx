/* eslint-disable no-unused-vars */
import React from "react";
import AdminLayout from "@/layouts/admin/AdminLayout";
import {
  FaSun,
  FaBaby,
  FaCheckCircle,
  FaTools,
  FaInfoCircle,
  FaTemperatureHigh,
  FaClock,
  FaHeartbeat,
} from "react-icons/fa";

const AdminPhototherapy = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-warning/10 text-warning">
                Neonatal & Paediatrics
              </span>
              <span className="text-xs text-base-content/60">Hyperbilirubinemia Unit</span>
            </div>
            <h1 className="text-2xl font-bold text-base-content mt-1">
              Phototherapy Unit Overview
            </h1>
            <p className="text-sm text-base-content/70 mt-0.5">
              Supervision of neonatal jaundice phototherapy beds, incubator warmth controls, and paediatric clinical monitoring.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-warning/10 text-warning text-xs font-bold border border-warning/20">
            <FaTools className="w-4 h-4" />
            <span>Unit Hardware Expansion In Progress</span>
          </div>
        </div>

        {/* Informational Guidance Banner */}
        <div className="flex items-start gap-3 p-5 rounded-2xl bg-base-100 border border-base-200 shadow-sm">
          <FaInfoCircle className="w-6 h-6 text-primary shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="text-base font-bold text-base-content">
              About the Hospital Phototherapy Unit & Current Operational Status
            </h3>
            <p className="text-xs text-base-content/70 leading-relaxed">
              <strong>What is Phototherapy?</strong> Phototherapy is a safe, non-invasive medical light treatment utilizing special blue-spectrum light (460–490 nm wavelength) to break down excess unconjugated bilirubin in newborns suffering from neonatal hyperbilirubinemia (jaundice), preventing bilirubin encephalopathy (kernicterus).
            </p>
            <p className="text-xs text-base-content/70 leading-relaxed">
              <strong>Current Deployment Status:</strong> The hospital clinical protocols, laboratory bilirubin test thresholds (TSB/TcB), neonatal vital signs logs, and incubator temperature monitoring are fully functional in software. Physical multi-tube phototherapy bed hardware and telemetry sensors are currently being expanded.
            </p>
          </div>
        </div>

        {/* Configured Units Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-base-100 border border-base-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <FaSun className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-base-content">
                    Phototherapy Unit Bed 01
                  </h4>
                  <span className="text-xs text-base-content/60">
                    Neonatal Intensive Care (NICU Room 2)
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-success/10 text-success">
                Clinical Ready
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-lg bg-base-200/50">
                <span className="text-base-content/50 block">Light Source</span>
                <span className="font-semibold text-base-content">Blue LED Spectrum (465nm)</span>
              </div>
              <div className="p-3 rounded-lg bg-base-200/50">
                <span className="text-base-content/50 block">Target Irradiance</span>
                <span className="font-semibold text-base-content">30 μW/cm²/nm</span>
              </div>
              <div className="p-3 rounded-lg bg-base-200/50">
                <span className="text-base-content/50 block">Incubator Mode</span>
                <span className="font-semibold text-base-content">Servo-controlled Warmth</span>
              </div>
              <div className="p-3 rounded-lg bg-base-200/50">
                <span className="text-base-content/50 block">Serial Bilirubin</span>
                <span className="font-semibold text-base-content">Every 6-12 Hours</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-base-100 border border-base-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-secondary/10 text-secondary">
                  <FaSun className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-base-content">
                    Phototherapy Unit Bed 02
                  </h4>
                  <span className="text-xs text-base-content/60">
                    Special Care Baby Unit (SCBU 1)
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-warning/10 text-warning">
                Hardware Setup
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-lg bg-base-200/50">
                <span className="text-base-content/50 block">Light Source</span>
                <span className="font-semibold text-base-content">Overhead Fluorescent Lamps</span>
              </div>
              <div className="p-3 rounded-lg bg-base-200/50">
                <span className="text-base-content/50 block">Eye Protection</span>
                <span className="font-semibold text-base-content">Neonatal Eye Shields Protocol</span>
              </div>
              <div className="p-3 rounded-lg bg-base-200/50">
                <span className="text-base-content/50 block">Hydration & Feed</span>
                <span className="font-semibold text-base-content">Breastmilk / Formula q2h</span>
              </div>
              <div className="p-3 rounded-lg bg-base-200/50">
                <span className="text-base-content/50 block">Thermal Monitor</span>
                <span className="font-semibold text-base-content">Skin Probe Continuous</span>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Protocol Checklist for Admin */}
        <div className="bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-base-content">
            Phototherapy Quality Assurance & Administrative Checklist
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-base-200 flex items-start gap-3">
              <FaCheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-base-content block">Bilirubin Lab Diagnostic Link</span>
                <span className="text-base-content/70 mt-1 block">
                  Automated laboratory bilirubin flag triggers neonatal doctor notification for phototherapy initiation.
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-base-200 flex items-start gap-3">
              <FaCheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-base-content block">Thermoregulation Oversight</span>
                <span className="text-base-content/70 mt-1 block">
                  Continuous auxiliary temperature tracking (36.5°C – 37.5°C) to prevent hyperthermia or hypothermia under lamps.
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-base-200 flex items-start gap-3">
              <FaCheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-base-content block">Photometer Lamp Calibration</span>
                <span className="text-base-content/70 mt-1 block">
                  Scheduled lamp bulb replacement at 2,000 operational hours to guarantee therapeutic spectral radiance.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPhototherapy;

