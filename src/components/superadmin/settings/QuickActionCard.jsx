import React from 'react';

const QuickActionCard = ({ icon: Icon, label, onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-6 rounded-lg shadow-lg bg-base-100 hover:bg-base-200 transition-colors ${className}`}
    >
      <div className="flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-primary/10">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <span className="text-sm font-medium text-base-content">{label}</span>
    </button>
  );
};

export default QuickActionCard;
