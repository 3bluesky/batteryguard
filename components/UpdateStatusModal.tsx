import React, { useState, useEffect } from 'react';
import { Battery } from '../types';
import { Zap, Activity, X } from '../utils/icons';

interface UpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  battery: Battery | null;
  initialMode: 'CHARGE' | 'DISCHARGE';
  onSave: (id: string, updates: Partial<Battery>, logDescription: string, logAction: 'CHARGE' | 'DISCHARGE') => void;
}

export const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({ isOpen, onClose, battery, initialMode, onSave }) => {
  const [mode, setMode] = useState<'CHARGE' | 'DISCHARGE'>(initialMode);
  const [chargeLevel, setChargeLevel] = useState(0);
  const [isFullCharge, setIsFullCharge] = useState(false);
  const [voltage, setVoltage] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (battery) {
      setChargeLevel(battery.chargeLevel);
      setVoltage(battery.voltage);
      setIsFullCharge(false);
      setNotes('');
    }
  }, [battery, isOpen]);

  useEffect(() => {
    setMode(initialMode);
    if (initialMode === 'CHARGE' && battery) {
        setIsFullCharge(true);
        setChargeLevel(100);
    } else {
        setIsFullCharge(false);
    }
  }, [initialMode, battery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!battery) return;

    const updates: Partial<Battery> = {
      chargeLevel,
      voltage,
      lastChargeDate: mode === 'CHARGE' ? new Date().toISOString().split('T')[0] : battery.lastChargeDate
    };

    if (mode === 'CHARGE' && isFullCharge) {
      updates.cycleCount = battery.cycleCount + 1;
    }

    const actionDescription = mode === 'CHARGE' 
      ? `充电至 ${chargeLevel}%${isFullCharge ? ' (完整循环)' : ''}. ${notes}`
      : `放电/使用至 ${chargeLevel}%. ${notes}`;

    onSave(battery.id, updates, actionDescription, mode);
    onClose();
  };

  if (!isOpen || !battery) return null;

  const inputClass = "w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all shadow-sm";
  
  // Determine slider fill color based on mode
  const sliderFillColor = mode === 'CHARGE' ? '#22c55e' : '#3b82f6';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800">{battery.name} - 状态更新</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
        </div>

        <div className="flex border-b border-slate-100">
          <button 
            onClick={() => setMode('CHARGE')} 
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${mode === 'CHARGE' ? 'bg-white text-brand-600 border-b-2 border-brand-500' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            <Zap className="w-4 h-4" /> 记录充电
          </button>
          <button 
            onClick={() => setMode('DISCHARGE')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${mode === 'DISCHARGE' ? 'bg-white text-blue-600 border-b-2 border-blue-500' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            <Activity className="w-4 h-4" /> 记录放电
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Charge Level Control */}
          <div>
            <div className="flex justify-between mb-2">
               <label className="text-sm font-medium text-slate-700">当前电量</label>
               <span className={`text-lg font-bold ${mode === 'CHARGE' ? 'text-brand-600' : 'text-blue-600'}`}>{chargeLevel}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={chargeLevel} 
              onChange={(e) => {
                const val = Number(e.target.value);
                setChargeLevel(val);
                if (mode === 'CHARGE' && val < 100) setIsFullCharge(false);
                if (mode === 'CHARGE' && val === 100) setIsFullCharge(true);
              }}
              style={{
                background: `linear-gradient(to right, ${sliderFillColor} 0%, ${sliderFillColor} ${chargeLevel}%, #e2e8f0 ${chargeLevel}%, #e2e8f0 100%)`
              }}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${mode === 'CHARGE' ? 'accent-brand-500' : 'accent-blue-500'}`}
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Context Specific Options */}
          {mode === 'CHARGE' && (
            <div className="flex items-center gap-2 bg-brand-50 p-3 rounded-lg border border-brand-100">
              <input 
                type="checkbox" 
                id="fullCharge" 
                checked={isFullCharge} 
                onChange={(e) => {
                  setIsFullCharge(e.target.checked);
                  if(e.target.checked) setChargeLevel(100);
                }}
                className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
              />
              <label htmlFor="fullCharge" className="text-sm text-brand-900">这是一个完整的充电循环 (循环数 +1)</label>
            </div>
          )}

          {/* Voltage Input (Optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">当前电压 (V)</label>
            <input 
              type="number" 
              step="0.01" 
              value={voltage} 
              onChange={(e) => setVoltage(Number(e.target.value))}
              className={inputClass}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">备注</label>
            <input 
              type="text" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              placeholder="例如：存放前补电..."
              className={`${inputClass} text-sm`}
            />
          </div>

          <button 
            type="submit" 
            className={`w-full py-3 rounded-lg text-white font-medium shadow-md transition-all ${mode === 'CHARGE' ? 'bg-brand-600 hover:bg-brand-700 shadow-brand-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
          >
            保存记录
          </button>

        </form>
      </div>
    </div>
  );
};