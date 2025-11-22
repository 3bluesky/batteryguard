import React, { useEffect, useState } from 'react';
import { Battery, BatteryLog } from '../types';
import { db } from '../services/db';
import { X, Zap, Activity, Sparkles } from '../utils/icons';

interface BatteryLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  battery: Battery | null;
}

export const BatteryLogModal: React.FC<BatteryLogModalProps> = ({ isOpen, onClose, battery }) => {
  const [logs, setLogs] = useState<BatteryLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && battery) {
      loadLogs(battery.id);
    }
  }, [isOpen, battery]);

  const loadLogs = async (id: string) => {
    setLoading(true);
    const res = await db.getLogs(id);
    if (res.success && res.data) {
      setLogs(res.data);
    }
    setLoading(false);
  };

  if (!isOpen || !battery) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'CHARGE': return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'DISCHARGE': return <Activity className="w-4 h-4 text-blue-500" />;
      case 'MAINTENANCE': return <Sparkles className="w-4 h-4 text-purple-500" />;
      default: return <div className="w-2 h-2 rounded-full bg-slate-400"></div>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col animate-fade-in">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
          <div>
            <h3 className="font-bold text-slate-800">{battery.name}</h3>
            <p className="text-xs text-slate-500">历史记录</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
          {loading ? (
            <div className="text-center py-10 text-slate-400">加载中...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 text-slate-400">暂无记录</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex gap-3 relative">
                {/* Timeline line */}
                <div className="absolute left-[19px] top-8 bottom-[-16px] w-[1px] bg-slate-100"></div>
                
                <div className="relative z-10 w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                  {getIcon(log.action)}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-semibold text-slate-700">
                      {log.action === 'CHARGE' ? '充电' : log.action === 'DISCHARGE' ? '放电使用' : '维护'}
                    </p>
                    <span className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{log.details}</p>
                  {log.levelAfter !== undefined && (
                     <div className="mt-2 inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded font-mono">
                       电量: {log.levelAfter}%
                     </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
           <button onClick={onClose} className="w-full py-2 bg-white border border-slate-200 rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-50">关闭</button>
        </div>
      </div>
    </div>
  );
};