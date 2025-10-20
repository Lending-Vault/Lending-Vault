// src/components/Dashboard/HealthFactorCard.tsx
import React from 'react';
import { Shield, AlertTriangle, XCircle } from 'lucide-react';
import Card from '../UI/Card';
import { getHealthFactorStatus } from '../../utils/mockData';

interface HealthFactorCardProps {
  healthFactor: number;
}

const HealthFactorCard: React.FC<HealthFactorCardProps> = ({ healthFactor }) => {
  const status = getHealthFactorStatus(healthFactor);

  const getIcon = () => {
    if (healthFactor >= 200) return <Shield className="w-8 h-8 text-success-500" />;
    if (healthFactor >= 150) return <AlertTriangle className="w-8 h-8 text-warning-500" />;
    return <XCircle className="w-8 h-8 text-danger-500" />;
  };

  const getBorderColor = () => {
    if (healthFactor >= 200) return 'border-l-success-500';
    if (healthFactor >= 150) return 'border-l-warning-500';
    return 'border-l-danger-500';
  };

  return (
    <Card className={`border-l-4 ${getBorderColor()}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-dark-textMuted mb-2">
            Health Factor
          </p>
          <p className={`text-3xl font-bold mb-1 ${status.color}`}>
            {healthFactor}%
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${status.bgColor} ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>
        <div className={`p-3 rounded-xl ${status.bgColor}`}>
          {getIcon()}
        </div>
      </div>
    </Card>
  );
};

export default HealthFactorCard;