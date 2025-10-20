import React from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  className = '',
}) => {
  const baseStyles = 'font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 relative overflow-hidden';
  
  const variantStyles = {
    primary: 'bg-gradient-to-r from-lisk-600 to-lisk-700 hover:from-lisk-500 hover:to-lisk-600 text-white shadow-lg hover:shadow-lisk-glow',
    secondary: 'bg-dark-card hover:bg-dark-cardHover text-white border-2 border-dark-border hover:border-lisk-500 shadow-card hover:shadow-card-hover',
    danger: 'bg-gradient-to-r from-danger-600 to-danger-700 hover:from-danger-500 hover:to-danger-600 text-white shadow-lg',
    ghost: 'bg-transparent hover:bg-white/5 text-dark-text border border-transparent hover:border-lisk-500/30',
  };
  
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        widthStyle,
        className
      )}
    >
      {loading && <Loader2 className="w-5 h-5 animate-spin" />}
      {!loading && icon && icon}
      {children}
    </button>
  );
};

export default Button;