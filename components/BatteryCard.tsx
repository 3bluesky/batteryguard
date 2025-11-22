import React, { useState } from 'react';
import { Battery, BatteryHealthStatus } from '../types';
import { ProgressBar } from './ProgressBar';
import { AlertTriangle, Zap, Activity, Trash2, Sparkles, History } from '../utils/icons';
import { analyzeBatteryHealth } from '../services/ai';

interface BatteryCardProps {
  battery: Battery;
  onDelete: (id: string) => void;
  onUpdateStatus: (battery: Battery, mode: 'CHARGE' | 'DISCHARGE') => void;
  onViewLogs: (battery: Battery) => void;
}

export const BatteryCard: React.FC<BatteryCardProps> = ({ battery, onDelete, onUpdateStatus, onViewLogs }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);

  const calculateSOH = (): BatteryHealthStatus => {
    let soh = 100;
    soh -= battery.cycleCount * 0.05; 
    if (battery.internalResistance > 50) soh -= (battery.internalResistance - 50) * 0.2;
    soh = Math.min(Math.max(Math.round(soh), 0), 100);

    let status: BatteryHealthStatus['status'] = 'Good';
    let color = 'bg-green-500';

    if (soh < 60) {
      status = 'Critical';
      color = 'bg-red-600';
    } else if (soh < 80) {
      status = 'Poor';
      color = 'bg-orange-500';
    } else if (soh < 90) {
      status = 'Fair';
      color = 'bg-yellow-400';
    }

    return { soh, status, color };
  };

  const health = calculateSOH();
  const isLowPower = battery.chargeLevel < 20;
  const daysSinceCharge = Math.floor((new Date().getTime() - new Date(battery.lastChargeDate).getTime()) / (1000 * 3600 * 24));
  const isStale = daysSinceCharge > 90;

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAiAdvice(null);
    const advice = await analyzeBatteryHealth(battery);
    setAiAdvice(advice);
    setIsAnalyzing(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(battery.id);
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden hover:shadow-lg transition-all relative group transform hover:-translate-y-0.5 duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex justify-between items-start bg-slate-50">
        <div className="flex-1 mr-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-800 text-lg leading-tight">{battery.name}</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-slate-200 bg-white text-slate-600 font-medium whitespace-nowrap">
              {battery.type.split(' ')[0]}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
             上次充电: {daysSinceCharge} 天前 ({battery.lastChargeDate})
          </div>
        </div>
        <div className="flex gap-1">
            <button 
                onClick={() => onViewLogs(battery)}
                className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-white hover:shadow-sm rounded-full transition-all"
                title="历史记录"
            >
                <History className="w-4 h-4" />
            </button>
            <button 
                onClick={handleDeleteClick}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white hover:shadow-sm rounded-full transition-all"
                title="删除电池"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        
        {/* Alerts */}
        {(health.status === 'Critical' || isStale) && (
          <div className="bg-red-50 border border-red-100 text-red-800 text-xs p-2 rounded-md flex items-start gap-2 shadow-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              {health.status === 'Critical' && <p>• 电池健康度极低，建议更换</p>}
              {isStale && <p>• 长期未充电，请检查电压</p>}
            </div>
          </div>
        )}

        {/* Charge Level */}
        <div>
          <ProgressBar 
            value={battery.chargeLevel} 
            label="当前电量" 
            colorClass={isLowPower ? 'bg-red-500' : 'bg-brand-500'}
          />
        </div>

        {/* Health Bar */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between mb-1 text-xs text-slate-500">
              <span>健康度 (SOH)</span>
              <span className={
                health.status === 'Good' ? 'text-green-600' : 
                health.status === 'Critical' ? 'text-red-600' : 'text-yellow-600'
              }>{health.status} ({health.soh}%)</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className={`${health.color} h-full rounded-full`} style={{ width: `${health.soh}%` }}></div>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="flex gap-3 text-center">
            <div>
              <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">循环</div>
              <div className="font-mono text-sm font-bold text-slate-700">{battery.cycleCount}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">内阻</div>
              <div className="font-mono text-sm font-bold text-slate-700">{battery.internalResistance}mΩ</div>
            </div>
          </div>
        </div>

        {/* AI Advice Section */}
        {aiAdvice && (
           <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg text-sm text-indigo-900 mt-2 animate-fade-in shadow-sm">
             <div className="flex items-center gap-2 mb-1 font-semibold text-indigo-700">
               <Sparkles className="w-4 h-4" />
               AI 诊断报告
             </div>
             <div className="whitespace-pre-line text-xs leading-relaxed opacity-90">
               {aiAdvice}
             </div>
           </div>
        )}

      </div>

      {/* Actions */}
      <div className="p-2 bg-slate-50 border-t border-slate-100 grid grid-cols-3 gap-2">
        <button 
          onClick={() => onUpdateStatus(battery, 'CHARGE')}
          className="flex flex-col items-center justify-center py-2 rounded hover:bg-white hover:shadow-sm hover:text-brand-600 transition-all text-xs text-slate-600 font-medium group/btn"
        >
          <Zap className="w-4 h-4 mb-1 text-yellow-500 group-hover/btn:scale-110 transition-transform" />
          记录充电
        </button>
        <button 
           onClick={() => onUpdateStatus(battery, 'DISCHARGE')}
           className="flex flex-col items-center justify-center py-2 rounded hover:bg-white hover:shadow-sm hover:text-blue-600 transition-all text-xs text-slate-600 font-medium group/btn"
        >
          <Activity className="w-4 h-4 mb-1 text-blue-500 group-hover/btn:scale-110 transition-transform" />
          记录放电
        </button>
        <button 
          onClick={handleAIAnalysis}
          disabled={isAnalyzing}
          className="flex flex-col items-center justify-center py-2 rounded hover:bg-white hover:shadow-sm hover:text-indigo-600 transition-all text-xs text-indigo-600 font-medium disabled:opacity-50 group/btn"
        >
          <Sparkles className={`w-4 h-4 mb-1 ${isAnalyzing ? 'animate-spin' : 'group-hover/btn:scale-110 transition-transform'}`} />
          {isAnalyzing ? '分析中' : 'AI 诊断'}
        </button>
      </div>
    </div>
  );
};