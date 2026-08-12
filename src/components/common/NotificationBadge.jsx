import React from 'react';

const NotificationBadge = ({ count }) => {
  if (!count || count <= 0) return null;
  return (
    <span className="ml-auto inline-flex items-center justify-center min-w-[25px] h-6 px-1.5 text-[11px] font-bold rounded-full bg-error text-error-content">
      {count > 99 ? '99+' : count}
    </span>
  );
};

export default NotificationBadge;