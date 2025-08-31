import React from 'react';
import { Link } from 'react-router-dom';

const Breadcrumb = ({ children }) => {
  return (
    <nav className="inline-block pt-[10px] mb-[10px]" aria-label="Breadcrumb">
      <ol className="inline-flex w-full items-center text-xs space-x-1 rtl:space-x-reverse text-dark-gray md:space-x-2">
        <li className="inline-flex items-center">
          <Link to="/" className="inline-flex items-center text-xs text-gray-700 hover:text-blue-600">
            <svg
              className="h-3 w-3 me-2.5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
            </svg>
            Home
          </Link>
        </li>
        {children}
      </ol>
    </nav>
  );
};

export const BreadCrumbItem = ({ small, to, text }) => {
  return (
    <li className={`${small ? ' sm:block' : ''}`}>
      <div className="flex items-center">
        <svg
          className="mx-1 h-3 w-3 rtl:rotate-180 text-gray-400"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 6 10"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1"
            d="m1 9 4-4-4-4"
          />
        </svg>
        <Link
          to={to || ""}
          className="text-xs text-gray-700 ms-1 text-nowrap line-clamp-1 hover:text-green hover:underline text-ellipsis capitalize"
        >
          {text}
        </Link>
      </div>
    </li>
  );
};

export default Breadcrumb;
