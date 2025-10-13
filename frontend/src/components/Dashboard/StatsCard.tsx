// src/components/Dashboard/StatsCard.tsx
import React from 'react';
import Card from '../UI/Card';

interface StatsCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon?: React.ReactNode;
  highlight?: boolean;
  colorClass?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  highlight = false,
  colorClass = '',
}) => {
  return (
    <Card className={highlight ? 'border-primary-500/50' : ''}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-dark-textMuted mb-2">
            {title}
          </p>
          <p className={`text-3xl font-bold mb-1 ${colorClass || 'text-white'}`}>
            {value}
          </p>
          <p className="text-sm text-dark-textMuted">
            {subtitle}
          </p>
        </div>
        {icon && (
          <div className="ml-4">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatsCard;