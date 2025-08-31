import React from 'react';

const UploadGroup = () => {
  return (
    <div>
      <div className="flex items-center gap-3 sm:gap-5">
        <span className="flex items-center justify-center shrink-0 w-20 h-20 rounded-full border-2 border-dotted border-gray">
          <svg
            className="shrink-0 block w-7 h-7 text-dark-gray"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
        </span>

        <div className="grow">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="hover:bg-green text-white flex items-center gap-2 font-semibold text-[10px] sm:text-xs px-3 py-2 rounded-lg border border-transparent bg-light-green"
            >
              <svg
                className="w-4 h-4 block shrink-0 text-white"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" x2="12" y1="3" y2="15" />
              </svg>
              Upload photo
            </button>
            <button
              type="button"
              className="text-danger flex items-center gap-2 hover:bg-light-gray font-medium text-xs px-3 py-2 rounded-lg border border-gray"
            >
              Delete
            </button>
          </div>
          <p className="mt-2 text-xs text-dark-gray">Pick a photo up to 1MB.</p>
        </div>
      </div>
    </div>
  );
};

export default UploadGroup;
