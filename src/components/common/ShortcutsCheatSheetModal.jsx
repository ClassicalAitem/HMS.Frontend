import React from 'react';
import { FaKeyboard, FaTimes, FaSearch, FaColumns, FaFont, FaFolderOpen, FaCashRegister } from 'react-icons/fa';

const SHORTCUT_GROUPS = [
  {
    category: 'Global Navigation & Screen',
    icon: FaColumns,
    shortcuts: [
      { keys: ['Ctrl', 'B'], desc: 'Toggle sidebar (collapse for full-width charts, expand to navigate)' },
      { keys: ['Ctrl', 'K'], desc: 'Universal fast search (search patient by full name or ID)' },
      { keys: ['Alt', 'D'], desc: 'Jump directly to your role Dashboard' },
      { keys: ['Ctrl', 'Shift', 'R'], desc: 'Fast refresh active table/queue without full reload' },
      { keys: ['Esc'], desc: 'Close any active modal, search palette, or dropdown' },
      { keys: ['Ctrl', '/'], desc: 'Open this Keyboard Shortcuts cheat sheet' },
    ],
  },
  {
    category: 'Clinical Documentation & Text Speed',
    icon: FaFont,
    shortcuts: [
      { keys: ['Ctrl', 'Shift', 'U'], desc: 'UPPERCASE selected text or current word (e.g. drug/diagnosis)' },
      { keys: ['Ctrl', 'Shift', 'L'], desc: 'lowercase selected text or current word' },
      { keys: ['Ctrl', 'Shift', 'C'], desc: 'Title Case selected text (Capitalize Each Word)' },
      { keys: ['Ctrl', 'Alt', 'T'], desc: 'Insert clinical timestamp [DD/MM/YYYY HH:mm - Staff]: at cursor' },
      { keys: ['Ctrl', 'Enter'], desc: 'Submit / Save active consultation note or clinical form' },
    ],
  },
  {
    category: 'Patient Chart Quick Tabs (Inside Patient Profile)',
    icon: FaFolderOpen,
    shortcuts: [
      { keys: ['Alt', '1'], desc: 'Switch to Vitals & MEWS score tab' },
      { keys: ['Alt', '2'], desc: 'Switch to Medications & Prescriptions tab' },
      { keys: ['Alt', '3'], desc: 'Switch to Investigations & Lab tests tab' },
      { keys: ['Alt', '4'], desc: 'Switch to Consultation History & Notes tab' },
      { keys: ['Alt', '5'], desc: 'Switch to Admission & Ward/Bed Info tab' },
    ],
  },
  {
    category: 'Front Desk & Cashier Fast Actions',
    icon: FaCashRegister,
    shortcuts: [
      { keys: ['Alt', 'N'], desc: 'Quick-open New Patient Registration / OPD Ticket modal' },
      { keys: ['Ctrl', 'P'], desc: 'Quick-print receipt, gate pass, or clinical summary' },
      { keys: ['Alt', 'P'], desc: 'Focus payment method / amount in cashier checkout' },
    ],
  },
];

const ShortcutsCheatSheetModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        className="card w-full max-w-3xl bg-base-100 shadow-2xl border border-base-200 max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-base-200 bg-base-200/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <FaKeyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-base-content flex items-center gap-2">
                Kolak HMS Keyboard Shortcuts
                <span className="badge badge-primary badge-sm">Productivity Suite</span>
              </h3>
              <p className="text-xs text-base-content/70">
                Speed through documentation, patient lookup, and chart reviews without touching your mouse
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-base-content"
            aria-label="Close modal"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {SHORTCUT_GROUPS.map((group, gIdx) => {
            const Icon = group.icon;
            return (
              <div key={gIdx} className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Icon className="w-4 h-4" />
                  <span>{group.category}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {group.shortcuts.map((sc, sIdx) => (
                    <div 
                      key={sIdx} 
                      className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-base-200/40 hover:bg-base-200/80 border border-base-300/40 transition-colors"
                    >
                      <span className="text-xs text-base-content font-medium line-clamp-2">
                        {sc.desc}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {sc.keys.map((k, kIdx) => (
                          <React.Fragment key={kIdx}>
                            <kbd className="kbd kbd-sm bg-base-100 border border-base-300 text-xs font-semibold px-1.5 py-0.5 shadow-xs">
                              {k}
                            </kbd>
                            {kIdx < sc.keys.length - 1 && (
                              <span className="text-[10px] text-base-content/50">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-base-200 bg-base-200/30 flex items-center justify-between shrink-0 text-xs text-base-content/70">
          <span>Tip: Press <kbd className="kbd kbd-xs">Esc</kbd> anytime to dismiss this guide</span>
          <button onClick={onClose} className="btn btn-sm btn-primary">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsCheatSheetModal;

