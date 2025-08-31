/* eslint-disable react/display-name */
'use client';
import { cn } from '@/libs/utils';
import React, { forwardRef, useState } from 'react';

const InputCounter = forwardRef(({ className, ...props }, ref) => {
  const [value, setValue] = useState(0);

  const handleIncrease = () => {
    setValue((prevValue) => prevValue + 1);
  };

  const handleDecrease = () => {
    setValue((prevValue) => (prevValue > 0 ? prevValue - 1 : 0));
  };

  const handleChange = (e) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue)) {
      setValue(newValue);
    } else {
      setValue(0);
    }
  };

  return (
    <div className="w-full flex items-center gap-3 justify-between">
      <input
        ref={ref}
        {...props}
        className={cn(
          'w-full h-6 border-0 border-transparent p-0 min-w-12 block text-sm placeholder:text-sm focus:outline-none focus:ring-0',
          className
        )}
        type="text"
        value={value}
        onChange={handleChange}
      />
      <div className="flex justify-end items-center gap-1.5">
        <button
          type="button"
          onClick={handleDecrease}
          className="rounded-full border border-gray items-center justify-center inline-flex w-[22px] h-[22px]"
        >
          <svg
            className="block shrink-0 w-[14px] h-[14px] text-dark-gray"
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
            <path d="M5 12h14" />
          </svg>
        </button>
        <button
          type="button"
          onClick={handleIncrease}
          className="rounded-full border border-gray items-center justify-center inline-flex w-[22px] h-[22px]"
        >
          <svg
            className="block shrink-0 w-[14px] h-[14px] text-dark-gray"
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
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
        </button>
      </div>
    </div>
  );
});

export default InputCounter;
