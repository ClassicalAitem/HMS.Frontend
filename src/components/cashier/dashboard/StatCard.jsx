import React from 'react';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, subtitle, icon: Icon, actionLabel = 'See All', to, onAction, hideAction = false, loading = false }) => {
  return (
    <div className="p-6 rounded-xl bg-base-100 border border-base-300 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1 2xl:gap-3">
          {loading ? (
            <div className="flex flex-col gap-2">
              <div className="animate-pulse h-3 w-24 rounded bg-base-300" />
              <div className="animate-pulse h-8 w-32 2xl:h-10 2xl:w-44 rounded bg-base-300" />
              {subtitle !== undefined && <div className="animate-pulse h-3 w-20 rounded bg-base-300" />}
              {!hideAction && (to || onAction) && <div className="animate-pulse h-3 w-16 rounded bg-base-300" />}
            </div>
          ) : (
            <>
              <p className="text-xs 2xl:text-sm text-base-content/70">{title}</p>
              <p className="text-lg 2xl:text-4xl font-semibold 2xl:font-normal text-base-content">{value}</p>
              {subtitle && (
                <p className="mt-2 text-xs text-error">{subtitle}</p>
              )}
              {!hideAction && (to || onAction) && (
                <div>
                  {to ? (
                    <Link to={to} className="text-sm text-primary hover:underline">
                      {actionLabel}
                    </Link>
                  ) : (
                    <button onClick={onAction} className="text-sm text-primary hover:underline">
                      {actionLabel}
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        {Icon && (
          loading ? (
            <div className="w-10 h-10 rounded-lg bg-base-300 animate-pulse" />
          ) : (
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Icon className="w-5 h-5 text-primary" />
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default StatCard;
