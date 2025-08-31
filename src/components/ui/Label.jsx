/* eslint-disable react/display-name */
'use client';
import { cn } from '@/libs/utils';
import React, { forwardRef } from 'react';

const Label = forwardRef(({ className, ...props }, ref) => (
  <label ref={ref} className={cn('inline-block text-sm text-dark mb-2', className)} {...props} />
));

export default Label;
