/* eslint-disable react/display-name */
'use client';
import { cn } from '@/libs/utils';
import React, { forwardRef } from 'react';

const Select = forwardRef(({ className, options = [], ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn('py-2 px-3 border border-gray rounded-lg w-full text-sm capitalize', className)}
      {...props}
    >
      {options.map((option, index) => (
        <option key={index} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
));

export default Select;
