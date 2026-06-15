'use client';

import { InfoIcon } from 'lucide-react';

interface RegionalRisk {
  location: string;
  riskPercentage: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  color: string;
  borderColor: string;
}

interface RiskAssessmentMapProps {
  selectedLocation: string;
  onLocationSelect: (location: string) => void;
}

export function RiskAssessmentMap({ selectedLocation, onLocationSelect }: RiskAssessmentMapProps) {
  const regions: RegionalRisk[] = [
    {
      location: 'Kajiado Central',
      riskPercentage: 42,
      riskLevel: 'MODERATE',
      color: 'bg-yellow-50',
      borderColor: 'border-yellow-300',
    },
    {
      location: 'Magadi',
      riskPercentage: 58,
      riskLevel: 'HIGH',
      color: 'bg-red-50',
      borderColor: 'border-red-300',
    },
    {
      location: 'Loitokitok',
      riskPercentage: 18,
      riskLevel: 'LOW',
      color: 'bg-green-50',
      borderColor: 'border-green-300',
    },
    {
      location: 'Namanga',
      riskPercentage: 35,
      riskLevel: 'MODERATE',
      color: 'bg-yellow-50',
      borderColor: 'border-yellow-300',
    },
    {
      location: 'Isinya',
      riskPercentage: 62,
      riskLevel: 'HIGH',
      color: 'bg-red-50',
      borderColor: 'border-red-300',
    },
  ];

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return '#16a34a';
      case 'MODERATE':
        return '#ea580c';
      case 'HIGH':
        return '#dc2626';
      case 'CRITICAL':
        return '#991b1b';
      default:
        return '#64748b';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h3 className="text-xl font-semibold text-slate-900 mb-4">Risk Assessment Map</h3>
      
      <div className="bg-slate-50 rounded-lg p-6 mb-6">
        <p className="text-center text-slate-600 text-sm mb-4">Kajiado County Risk Distribution</p>
        
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 gap-4">
          {regions.map((region) => (
            <button
              key={region.location}
              onClick={() => onLocationSelect(region.location)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedLocation === region.location
                  ? `${region.borderColor} ring-2 ring-blue-400`
                  : `${region.borderColor} border-2`
              } ${region.color} hover:shadow-md`}
            >
              <div className="font-semibold text-slate-900 text-sm">{region.location}</div>
              <div className="text-2xl font-bold mt-2" style={{ color: getRiskColor(region.riskLevel) }}>
                {region.riskPercentage}%
              </div>
              <div className="text-xs font-medium mt-1" style={{ color: getRiskColor(region.riskLevel) }}>
                {region.riskLevel}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-xs text-slate-600">LOW 0-20%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span className="text-xs text-slate-600">MODERATE 20-40%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-xs text-slate-600">HIGH 40-60%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-700 rounded"></div>
          <span className="text-xs text-slate-600">CRITICAL 80-100%</span>
        </div>
      </div>
    </div>
  );
}
