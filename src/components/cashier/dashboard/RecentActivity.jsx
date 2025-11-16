import React from 'react';
import ActivityItem from './ActivityItem';

const RecentActivity = ({ items = [], lastUpdated, scrollable = true, loading = false }) => {
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
        {loading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="2xl:p-4 rounded-xl bg-base-100 border border-base-300 p-2">
              <div className="grid grid-cols-12 gap-4 items-center ">
                <div className="col-span-12 md:col-span-4 flex items-center gap-3">
                  <div className="animate-pulse w-10 h-10 2xl:w-12 2xl:h-12 rounded-full bg-base-300" />
                  <div className="flex flex-col gap-1">
                    <div className="animate-pulse h-4 w-24 2xl:w-32 rounded bg-base-300" />
                    <div className="animate-pulse h-3 w-20 rounded bg-base-300" />
                  </div>
                </div>
                <div className="col-span-12 md:col-span-5 md:border-l md:pl-4 border-base-300">
                  <div className="animate-pulse h-4 w-40 2xl:w-56 rounded bg-base-300" />
                  <div className="animate-pulse h-3 w-24 mt-2 rounded bg-base-300" />
                </div>
                <div className="col-span-12 md:col-span-3 text-right">
                  <div className="animate-pulse h-3 w-24 ml-auto rounded bg-base-300" />
                  <div className="animate-pulse h-5 w-20 ml-auto mt-2 rounded bg-base-300" />
                </div>
              </div>
            </div>
          ))
        ) : (
          items.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
