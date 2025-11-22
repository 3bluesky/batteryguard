import React, { useEffect, useState } from 'react';
import { Battery, BatteryType } from './types';
import { db } from './services/db';
import { BatteryCard } from './components/BatteryCard';
import { AddBatteryModal } from './components/AddBatteryModal';
import { DashboardStats } from './components/DashboardStats';
import { UpdateStatusModal } from './components/UpdateStatusModal';
import { BatteryLogModal } from './components/BatteryLogModal';
import { Plus, Zap, Search } from './utils/icons';

const App: React.FC = () => {
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'low' | 'critical'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'grouped'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedBatteryForUpdate, setSelectedBatteryForUpdate] = useState<Battery | null>(null);
  const [updateMode, setUpdateMode] = useState<'CHARGE' | 'DISCHARGE'>('CHARGE');

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedBatteryForLog, setSelectedBatteryForLog] = useState<Battery | null>(null);


  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const result = await db.getAll();
    if (result.success && result.data) {
      setBatteries(result.data);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    // Double confirmation just in case
    if (window.confirm('确定要永久删除这块电池及其所有记录吗？')) {
      await db.delete(id);
      // Ensure state is updated immediately for UI responsiveness
      setBatteries(prev => prev.filter(b => b.id !== id));
      // Reload full data to sync
      loadData();
    }
  };

  const handleAdd = async (battery: Omit<Battery, 'id'>) => {
    await db.add(battery);
    loadData();
  };

  const openUpdateModal = (battery: Battery, mode: 'CHARGE' | 'DISCHARGE') => {
    setSelectedBatteryForUpdate(battery);
    setUpdateMode(mode);
    setIsUpdateModalOpen(true);
  };

  const handleStatusUpdate = async (id: string, updates: Partial<Battery>, logDescription: string, logAction: 'CHARGE' | 'DISCHARGE') => {
    // 1. Update Battery
    await db.update(id, updates);
    
    // 2. Add Log
    await db.addLog({
      batteryId: id,
      timestamp: new Date().toISOString(),
      action: logAction,
      details: logDescription,
      levelAfter: updates.chargeLevel || 0
    });

    loadData();
  };

  const openLogModal = (battery: Battery) => {
    setSelectedBatteryForLog(battery);
    setIsLogModalOpen(true);
  };

  const filteredBatteries = batteries.filter(b => {
    // 1. Status Filter
    let matchesStatus = true;
    if (filter === 'low') matchesStatus = b.chargeLevel < 20;
    if (filter === 'critical') {
       const health = 100 - (b.cycleCount * 0.05);
       matchesStatus = health < 60;
    }

    // 2. Search Filter
    let matchesSearch = true;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      matchesSearch = 
        b.name.toLowerCase().includes(q) || 
        b.type.toLowerCase().includes(q) || 
        (b.notes && b.notes.toLowerCase().includes(q)) || false;
    }

    return matchesStatus && matchesSearch;
  });

  // Grouping Logic
  const groupedBatteries = filteredBatteries.reduce((acc, battery) => {
    const type = battery.type || BatteryType.Other;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(battery);
    return acc;
  }, {} as Record<string, Battery[]>);

  return (
    <div className="min-h-screen bg-slate-100 pb-20 md:pb-10">
      
      {/* Navbar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-md">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-brand-500 p-1.5 rounded-lg text-white shadow-lg shadow-brand-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-brand-800">
              BatteryGuard
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
             {/* Mobile Add Button */}
             <button 
                onClick={() => setIsAddModalOpen(true)}
                className="md:hidden bg-brand-600 text-white p-2 rounded-full shadow-lg hover:bg-brand-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
              
              {/* Desktop Add Button */}
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="hidden md:flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-brand-700 transition-all font-medium text-sm hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4" />
                添加电池
              </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Dashboard Charts */}
        <DashboardStats batteries={batteries} />

        {/* Filters & View Toggle Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 whitespace-nowrap">
             电池列表 
             <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{filteredBatteries.length}</span>
          </h2>
          
          <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto lg:justify-end">
             
             {/* Search Input */}
             <div className="relative w-full sm:w-auto flex-1 sm:flex-none">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                 type="text" 
                 placeholder="搜索电池..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none w-full sm:w-56 shadow-sm transition-shadow"
               />
               {searchQuery && (
                 <button 
                   onClick={() => setSearchQuery('')}
                   className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                 </button>
               )}
             </div>

             {/* View Mode Toggle */}
             <div className="flex bg-white p-1 rounded-lg shadow-sm border border-slate-200 flex-shrink-0">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 text-sm rounded-md font-medium transition-all flex items-center gap-1 ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-700'}`}
                  title="网格视图"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                   <span className="hidden sm:inline">网格</span>
                </button>
                <button
                  onClick={() => setViewMode('grouped')}
                  className={`px-3 py-1.5 text-sm rounded-md font-medium transition-all flex items-center gap-1 ${viewMode === 'grouped' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-700'}`}
                  title="分组视图"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>
                  <span className="hidden sm:inline">分组</span>
                </button>
             </div>

             {/* Filter Toggles */}
             <div className="flex gap-1 bg-white p-1 rounded-lg shadow-sm border border-slate-200 flex-shrink-0 overflow-x-auto max-w-full">
                <button 
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 text-sm rounded-md font-medium transition-all whitespace-nowrap ${filter === 'all' ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  全部
                </button>
                <button 
                  onClick={() => setFilter('low')}
                  className={`px-3 py-1.5 text-sm rounded-md font-medium transition-all whitespace-nowrap ${filter === 'low' ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  低电量
                </button>
                <button 
                  onClick={() => setFilter('critical')}
                  className={`px-3 py-1.5 text-sm rounded-md font-medium transition-all whitespace-nowrap ${filter === 'critical' ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  需维护
                </button>
             </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          </div>
        ) : (
          <>
            {filteredBatteries.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm">
                    <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium">没有找到匹配的电池</p>
                    <div className="flex gap-2 justify-center mt-2">
                      {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="text-brand-600 text-sm hover:underline">
                          清除搜索
                        </button>
                      )}
                      {filter !== 'all' && (
                         <button onClick={() => setFilter('all')} className="text-brand-600 text-sm hover:underline">
                          查看全部
                        </button>
                      )}
                    </div>
                </div>
            )}

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBatteries.map(battery => (
                    <BatteryCard 
                        key={battery.id} 
                        battery={battery} 
                        onDelete={handleDelete}
                        onUpdateStatus={openUpdateModal}
                        onViewLogs={openLogModal}
                    />
                    ))}
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(groupedBatteries).map(([type, group]) => (
                        <div key={type} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-6">
                            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-lg border-b border-slate-100 pb-2">
                                {type}
                                <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{(group as Battery[]).length}</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {(group as Battery[]).map(battery => (
                                    <BatteryCard 
                                        key={battery.id} 
                                        battery={battery} 
                                        onDelete={handleDelete}
                                        onUpdateStatus={openUpdateModal}
                                        onViewLogs={openLogModal}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </>
        )}
      </div>

      <AddBatteryModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSave={handleAdd} 
      />

      <UpdateStatusModal 
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        battery={selectedBatteryForUpdate}
        initialMode={updateMode}
        onSave={handleStatusUpdate}
      />

      <BatteryLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        battery={selectedBatteryForLog}
      />
    </div>
  );
};

export default App;