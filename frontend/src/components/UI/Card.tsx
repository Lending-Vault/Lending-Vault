import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  glass?: boolean;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '',
  padding = 'md',
  hover = false,
  glass = false,
}) => {
  const paddingStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={clsx(
        'rounded-2xl border transition-all duration-300',
        glass ? 'glass' : 'bg-dark-card border-dark-border shadow-card',
        hover && 'hover:shadow-card-hover hover:border-lisk-500/30 hover:-translate-y-1 cursor-pointer hover:shadow-lisk-glow',
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </div>
  );
};

export default Card;