/* eslint-disable react/display-name */
import { cn } from '@/libs/utils';
import React, { forwardRef } from 'react';

const Badge = forwardRef(({ className, ...props }, ref) => (
  <span
    ref={ref}
    {...props}
    className={cn('whitespace-nowrap text-dark-gray text-sm', className)}
  />
));

export default Badge;
