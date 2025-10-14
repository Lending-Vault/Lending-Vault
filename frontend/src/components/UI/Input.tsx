import React from 'react';
import clsx from 'clsx';

interface InputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  maxButton?: boolean;
  onMaxClick?: () => void;
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  suffix?: string;
}

const Input: React.FC<InputProps> = ({
  value,
  onChange,
  placeholder = '0.00',
  type = 'text',
  disabled = false,
  maxButton = false,
  onMaxClick,
  label,
  error,
  icon,
  suffix,
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-dark-text mb-2">
          {label}
        </label>
      )}
      
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-textMuted group-focus-within:text-primary-400 transition-colors">
            {icon}
          </div>
        )}
        
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={clsx(
            'w-full bg-dark-card border-2 rounded-xl px-4 py-3.5 text-white placeholder-dark-textMuted transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'hover:border-primary-500/30',
            error ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/50' : 'border-dark-border',
            icon && 'pl-12',
            (maxButton || suffix) && 'pr-20'
          )}
        />
        
        {suffix && !maxButton && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-dark-textMuted font-semibold">
            {suffix}
          </div>
        )}
        
        {maxButton && (
          <button
            onClick={onMaxClick}
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold px-4 py-1.5 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
          >
            MAX
          </button>
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-danger-500 flex items-center gap-1">
          <span>⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;