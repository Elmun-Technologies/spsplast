import React from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  className,
  as: Component = 'div',
  ...props
}) => {
  return (
    <Component
      className={cn('max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8', className)}
      {...props}
    >
      {children}
    </Component>
  );
};
