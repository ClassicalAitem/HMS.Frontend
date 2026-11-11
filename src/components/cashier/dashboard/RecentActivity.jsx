import React from 'react';
import ActivityItem from './ActivityItem';
import KolakLoader from '@/components/common/KolakLoader';

const RecentActivity = ({ items = [], lastUpdated, scrollable = true, loading = false, currentPage = 1, totalPages = 1, onPageChange, onPrevPage, onNextPage }) => {
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
          <div className="py-12 flex justify-center items-center">
            <KolakLoader size="md" />
          </div>
        ) : (
          items.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))
        )}
      </div>
      
      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-base-300">
          <div className="flex items-center gap-2">
            <button
              onClick={onPrevPage}
              disabled={currentPage === 1}
              className="btn btn-sm btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`btn btn-sm ${currentPage === page ? 'btn-primary' : 'btn-outline'}`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={onNextPage}
              disabled={currentPage === totalPages}
              className="btn btn-sm btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="text-sm text-base-content/70">
            Showing {((currentPage - 1) * items.length) + 1} to {Math.min(currentPage * items.length, totalPages * items.length)} of {totalPages * items.length} entries
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;