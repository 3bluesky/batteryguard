import React from 'react';
import { Battery } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { BatteryFull, Activity, Zap } from '../utils/icons';

interface DashboardStatsProps {
  batteries: Battery[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ batteries }) => {
  
  // Metrics requested by user
  const fullChargeCount = batteries.filter(b => b.chargeLevel === 100).length;
  const highCycleCount = batteries.filter(b => b.cycleCount > 60).length;
  const totalCapacity = batteries.reduce((acc, b) => acc + b.capacity, 0);

  // Pie chart data
  const typeData = Object.values(batteries.reduce((acc, curr) => {
    if (!acc[curr.type]) acc[curr.type] = { name: curr.type, value: 0 };
    acc[curr.type].value++;
    return acc;
  }, {} as Record<string, { name: string; value: number }>)) as { name: string; value: number }[];

  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="mb-8 space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Full Charge Count (Green) */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-md shadow-green-500/20 relative overflow-hidden border border-green-600/20">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-green-100 text-sm font-medium mb-1">满电状态电池数</p>
                <h3 className="text-4xl font-bold tracking-tight">{fullChargeCount}</h3>
              </div>
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <BatteryFull className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-xs text-green-50 bg-black/10 inline-block px-2 py-1 rounded backdrop-blur-sm">
              占比 {batteries.length > 0 ? Math.round((fullChargeCount / batteries.length) * 100) : 0}%
            </div>
          </div>
          {/* Decorative bg */}
          <div className="absolute -right-6 -bottom-6 text-white/10 transform rotate-12">
            <BatteryFull className="w-32 h-32" />
          </div>
        </div>

        {/* Card 2: High Cycle Count (Orange) */}
        <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-xl p-6 text-white shadow-md shadow-orange-500/20 relative overflow-hidden border border-orange-500/20">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-orange-100 text-sm font-medium mb-1">循环 {'>'} 60次</p>
                <h3 className="text-4xl font-bold tracking-tight">{highCycleCount}</h3>
              </div>
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Activity className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-xs text-orange-50 bg-black/10 inline-block px-2 py-1 rounded backdrop-blur-sm">
               {highCycleCount > 0 ? '需关注老化风险' : '电池状况良好'}
            </div>
          </div>
          {/* Decorative bg */}
          <div className="absolute -right-6 -bottom-6 text-white/10 transform rotate-12">
            <Activity className="w-32 h-32" />
          </div>
        </div>

        {/* Card 3: Total Capacity (Blue) */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white shadow-md shadow-blue-500/20 relative overflow-hidden border border-blue-500/20">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">电池总容量</p>
                <div className="flex items-baseline gap-1">
                  <h3 className="text-3xl font-bold tracking-tight">{totalCapacity.toLocaleString()}</h3>
                  <span className="text-sm font-medium text-blue-200">mAh</span>
                </div>
              </div>
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Zap className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-blue-50 bg-black/10 px-2 py-1 rounded backdrop-blur-sm w-fit">
               <div className="w-1.5 h-1.5 rounded-full bg-blue-200 animate-pulse"></div>
               <span>含自放电模拟</span>
            </div>
          </div>
          {/* Decorative bg */}
          <div className="absolute -right-6 -bottom-6 text-white/10 transform rotate-12">
            <Zap className="w-32 h-32" />
          </div>
        </div>

      </div>

      {/* Chart Section */}
      {batteries.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-md flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 w-full min-h-[220px]">
            <h3 className="text-slate-600 font-semibold mb-4 text-sm uppercase tracking-wide">电池类型分布</h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '12px', color: '#475569' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-2 w-full content-center">
             {typeData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs text-slate-600 p-2 rounded bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                    <div className="flex-1 min-w-0 group relative">
                        <span className="truncate font-medium block">{d.name.split(' ')[0]}</span>
                        {/* Tooltip for full name on hover */}
                        <span className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                            {d.name}
                        </span>
                    </div>
                    <span className="ml-auto bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-mono shadow-sm">{d.value}</span>
                </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
