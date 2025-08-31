/* eslint-disable react/display-name */
'use client';
import { cn } from '@/libs/utils';
import React, { forwardRef } from 'react';

const Input = forwardRef(({ className, sublabel, onChange, ...props }, ref) => (
  <div className="relative">
    <input
      ref={ref}
      className={cn(
        'py-2 px-3 border placeholder:text-sm border-gray text-dark rounded-lg block w-full focus:outline-none focus:ring-2 focus:ring-green focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      onChange={onChange}
      {...props}
    />
    {sublabel && (
      <div className="absolute top-0 bottom-0 z-20 right-1.5 pl-1.5 flex items-center text-xs uppercase text-dark-gray">
        {sublabel}
      </div>
    )}
  </div>
));
export default Input;
