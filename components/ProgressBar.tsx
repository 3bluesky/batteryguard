import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  colorClass?: string;
  showValue?: boolean;
  heightClass?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  value, 
  max = 100, 
  label, 
  colorClass = 'bg-brand-500', 
  showValue = true,
  heightClass = 'h-4'
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1 text-xs font-medium text-slate-500">
          <span>{label}</span>
          {showValue && <span>{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className={`w-full bg-slate-200 rounded-full overflow-hidden ${heightClass}`}>
        <div 
          className={`${colorClass} transition-all duration-500 ease-out h-full rounded-full relative group`} 
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-white/20 bg-[length:10px_10px] bg-repeat-x animate-[pulse_2s_infinite]" style={{backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem'}}></div>
        </div>
      </div>
    </div>
  );
};
