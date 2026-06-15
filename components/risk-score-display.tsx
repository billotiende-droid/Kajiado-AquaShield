'use client';

import { InfoIcon } from 'lucide-react';

interface RiskScoreDisplayProps {
  riskPercentage: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  affectedAreas?: string[];
}

export function RiskScoreDisplay({ riskPercentage, riskLevel, affectedAreas }: RiskScoreDisplayProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return { text: 'text-green-600', bg: 'bg-green-50', bar: 'bg-green-500' };
      case 'MODERATE':
        return { text: 'text-orange-600', bg: 'bg-orange-50', bar: 'bg-orange-500' };
      case 'HIGH':
        return { text: 'text-red-600', bg: 'bg-red-50', bar: 'bg-red-500' };
      case 'CRITICAL':
        return { text: 'text-red-700', bg: 'bg-red-50', bar: 'bg-red-700' };
      default:
        return { text: 'text-slate-600', bg: 'bg-slate-50', bar: 'bg-slate-500' };
    }
  };

  const colors = getRiskColor(riskLevel);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-semibold text-slate-900">Risk Score</h3>
        <InfoIcon className="w-4 h-4 text-slate-400" />
      </div>

      <div className="mb-4">
        <div className="text-4xl font-bold mb-2" style={{ color: getRiskColor(riskLevel).text.replace('text-', '#') }}>
          {riskPercentage.toFixed(1)}%
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
          <div
            className={`${colors.bar} h-2 rounded-full transition-all`}
            style={{ width: `${Math.min(riskPercentage, 100)}%` }}
          ></div>
        </div>
        <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${colors.text.replace('text-', 'text-')} ${colors.bg}`}>
          {riskLevel}
        </div>
      </div>

      {affectedAreas && affectedAreas.length > 0 && (
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-xs font-semibold text-slate-600 mb-2 uppercase">Affected Areas</h4>
          <div className="space-y-1">
            {affectedAreas.map((area, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                <span className="text-xs text-slate-600">{area}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
