import React, { useState } from 'react';
import { Battery, BatteryType } from '../types';

interface AddBatteryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (battery: Omit<Battery, 'id'>) => void;
}

export const AddBatteryModal: React.FC<AddBatteryModalProps> = ({ isOpen, onClose, onSave }) => {
  const initialState: Omit<Battery, 'id'> = {
    name: '',
    type: BatteryType.LiIon,
    capacity: 2000,
    voltage: 3.7,
    chargeLevel: 50,
    cycleCount: 0,
    internalResistance: 20,
    purchaseDate: new Date().toISOString().split('T')[0],
    lastChargeDate: new Date().toISOString().split('T')[0],
    healthThreshold: 80,
    notes: ''
  };

  const [formData, setFormData] = useState(initialState);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' || name === 'voltage' || name === 'chargeLevel' || name === 'cycleCount' || name === 'internalResistance' || name === 'healthThreshold'
        ? Number(value) 
        : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setFormData(initialState);
    onClose();
  };

  if (!isOpen) return null;

  const inputClass = "w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all shadow-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">添加新电池</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">名称标识</label>
            <input required name="name" value={formData.name} onChange={handleChange} className={inputClass} placeholder="例如: Sony VTC6 #1" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">类型</label>
              <select name="type" value={formData.type} onChange={handleChange} className={inputClass}>
                {Object.values(BatteryType).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">容量 (mAh)</label>
              <input type="number" required name="capacity" value={formData.capacity} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">电压 (V)</label>
              <input type="number" step="0.1" required name="voltage" value={formData.voltage} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">内阻 (mΩ)</label>
              <input type="number" required name="internalResistance" value={formData.internalResistance} onChange={handleChange} className={inputClass} />
            </div>
          </div>

           <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">当前电量 (%)</label>
              <input type="number" min="0" max="100" required name="chargeLevel" value={formData.chargeLevel} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">循环次数</label>
              <input type="number" required name="cycleCount" value={formData.cycleCount} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">购买日期</label>
              <input type="date" required name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">上次充电</label>
              <input type="date" required name="lastChargeDate" value={formData.lastChargeDate} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">备注</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} className={inputClass} rows={2}></textarea>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors">
              取消
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-900 font-medium shadow-lg shadow-brand-500/30 transition-all">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};