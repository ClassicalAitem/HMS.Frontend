import { cva } from 'class-variance-authority';
import { cn } from '../../libs/utils';

const buttonVariant = cva(
  'inline-flex items-center transition-colors ease-in-out duration-200 justify-center cursor-pointer text-sm leading-7',
  {
    variants: {
      variant: {
        default: 'bg-green hover:bg-light-green text-white rounded-sm',
        outline:
          'border border-green bg-transparent text-green rounded-sm hover:bg-green hover:text-white'
      },
      size: {
        default: 'py-2 px-3.7 text-sm',
        sm: 'px-2.5 text-sm py-1'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

const Button = ({ className, size, variant, ...props }) => {
  return <button className={cn(buttonVariant({ variant, size, className }))} {...props} />;
};

export { Button, buttonVariant };
