// src/components/UI/InfoBox.tsx
import React from 'react';
import clsx from 'clsx';

interface InfoBoxProps {
  label: string;
  value: string;
  subValue?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const InfoBox: React.FC<InfoBoxProps> = ({
  label,
  value,
  subValue,
  variant = 'default',
}) => {
  const variantStyles = {
    default: 'bg-dark-bg border-dark-border',
    success: 'bg-success-500/10 border-success-500/30',
    warning: 'bg-warning-500/10 border-warning-500/30',
    danger: 'bg-danger-500/10 border-danger-500/30',
  };

  return (
    <div className={clsx('rounded-lg border-2 p-3 sm:p-4', variantStyles[variant])}>
      <p className="text-xs sm:text-sm text-dark-textMuted mb-1">{label}</p>
      <p className="text-lg sm:text-xl font-bold text-white">{value}</p>
      {subValue && <p className="text-xs sm:text-sm text-dark-textMuted mt-1">{subValue}</p>}
    </div>
  );
};

export default InfoBox;