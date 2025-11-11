import React from 'react';
import ActivityItem from './ActivityItem';

const RecentActivity = ({ items = [], lastUpdated, scrollable = true }) => {
  return (
    <div className="p-4 2xl:p-6 rounded-xl bg-base-100 border border-base-300 shadow-sm">
      <div className="flex items-center justify-between mb-6 pr-4">
        <h2 className="text-lg 2xl:text-xl font-normal 2xl:font-bold text-base-content">Recent Activity</h2>
        {lastUpdated && (
          <p className="text-xs 2xl:text-sm text-base-content/50">Last Updated {lastUpdated}</p>
        )}
      </div>
      <div
        className={`space-y-2 2xl:space-y-4 ${scrollable ? 'overflow-y-auto pr-2 max-h-[420px] md:max-h-[420px] lg:max-h-[300px] 2xl:max-h-[500px]' : ''}`}
      >
        {items.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;