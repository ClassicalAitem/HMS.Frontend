import React from 'react';

const SettingCard = ({ icon: Icon, title, description, onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-start p-6 rounded-lg shadow-lg bg-base-100 hover:bg-base-200 transition-colors text-left w-full ${className}`}
    >
      <div className="flex items-center justify-center w-12 h-12 mr-4 rounded-full bg-primary/10 flex-shrink-0">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-base-content mb-2">{title}</h3>
        <p className="text-sm text-base-content/70">{description}</p>
      </div>
    </button>
  );
};

export default SettingCard;
