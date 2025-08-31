/* eslint-disable react/display-name */
import { cn } from '@/libs/utils';
import React, { forwardRef } from 'react';

const Radio = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={'flex items-center'}>
    &#8203;
    <input
      {...props}
      type="checkbox"
      className={cn('size-4 rounded text-green border-gray-300 focus:ring-green', className)}
    />
  </div>
));

export default Radio;
