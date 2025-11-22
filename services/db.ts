
import { Battery, BatteryType, DBResult, BatteryLog } from '../types';

const STORAGE_KEY = 'battery_mgmt_sys_data_v1';
const LOGS_STORAGE_KEY = 'battery_mgmt_sys_logs_v1';

// Helper to simulate async DB call
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const INITIAL_DATA: Battery[] = [
  {
    id: '1',
    name: 'Sony VTC6 - 1',
    type: BatteryType.LiIon,
    capacity: 3000,
    voltage: 3.7,
    chargeLevel: 85,
    cycleCount: 45,
    internalResistance: 12,
    purchaseDate: '2023-01-15',
    lastChargeDate: '2023-10-20',
    lastAutoUpdate: new Date().toISOString(),
    healthThreshold: 80,
    notes: '用于手电筒'
  },
  {
    id: '2',
    name: 'Eneloop Pro AA - Set A',
    type: BatteryType.NiMH,
    capacity: 2500,
    voltage: 1.2,
    chargeLevel: 20,
    cycleCount: 150,
    internalResistance: 45,
    purchaseDate: '2022-05-10',
    lastChargeDate: '2023-09-01',
    lastAutoUpdate: new Date().toISOString(),
    healthThreshold: 70,
    notes: '闪光灯备用'
  },
  {
    id: '3',
    name: 'DJI Mini 2 电池',
    type: BatteryType.LiPo,
    capacity: 2250,
    voltage: 7.7,
    chargeLevel: 100,
    cycleCount: 8,
    internalResistance: 5,
    purchaseDate: '2023-08-05',
    lastChargeDate: '2023-10-24',
    lastAutoUpdate: new Date().toISOString(),
    healthThreshold: 90,
    notes: '切记不可长期满电存放'
  },
  {
    id: '4',
    name: '旧电瓶车电池',
    type: BatteryType.LeadAcid,
    capacity: 12000,
    voltage: 12,
    chargeLevel: 60,
    cycleCount: 400,
    internalResistance: 150,
    purchaseDate: '2020-03-01',
    lastChargeDate: '2023-01-01',
    lastAutoUpdate: new Date().toISOString(),
    healthThreshold: 60,
    notes: '内阻过高，需维护'
  }
];

// Daily self-discharge rates (percentage points per day)
const DECAY_RATES: Record<string, number> = {
  [BatteryType.LiIon]: 0.1,     // ~3% per month
  [BatteryType.LiPo]: 0.15,     // ~4.5% per month
  [BatteryType.NiMH]: 0.5,      // ~15-20% per month (high self discharge)
  [BatteryType.LeadAcid]: 0.15, // ~4-5% per month
  [BatteryType.LiFePO4]: 0.05,  // Very low
  [BatteryType.Button]: 0.01,
  [BatteryType.Other]: 0.1
};

const applySelfDischarge = (batteries: Battery[]): { updated: boolean, batteries: Battery[] } => {
  const now = new Date();
  let hasUpdates = false;

  const newBatteries = batteries.map(b => {
    // If no record, assume just added/migrated, set to now and skip
    if (!b.lastAutoUpdate) {
      hasUpdates = true;
      return { ...b, lastAutoUpdate: now.toISOString() };
    }

    const lastUpdate = new Date(b.lastAutoUpdate);
    const diffMs = now.getTime() - lastUpdate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    // Only update if at least 1 hour has passed to avoid floating point jitter on rapid refreshes
    if (diffDays < 0.04) return b; 

    const rate = DECAY_RATES[b.type] || 0.1;
    const drop = diffDays * rate;

    if (drop >= 0.1 && b.chargeLevel > 0) {
      const newLevel = Math.max(0, parseFloat((b.chargeLevel - drop).toFixed(2)));
      hasUpdates = true;
      return {
        ...b,
        chargeLevel: newLevel,
        lastAutoUpdate: now.toISOString()
      };
    }
    
    return b;
  });

  return { updated: hasUpdates, batteries: newBatteries };
};

export const db = {
  getAll: async (): Promise<DBResult<Battery[]>> => {
    await delay(300);
    const json = localStorage.getItem(STORAGE_KEY);
    
    if (!json) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
      return { success: true, data: INITIAL_DATA };
    }

    let batteries: Battery[] = JSON.parse(json);
    
    // Run self-discharge simulation
    const simulation = applySelfDischarge(batteries);
    if (simulation.updated) {
      batteries = simulation.batteries;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(batteries));
    }

    return { success: true, data: batteries };
  },

  add: async (battery: Omit<Battery, 'id'>): Promise<DBResult<Battery>> => {
    await delay(300);
    const json = localStorage.getItem(STORAGE_KEY);
    const current: Battery[] = json ? JSON.parse(json) : [];
    
    const newBattery: Battery = {
      ...battery,
      id: Date.now().toString(),
      lastAutoUpdate: new Date().toISOString()
    };
    
    const updated = [newBattery, ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return { success: true, data: newBattery };
  },

  update: async (id: string, updates: Partial<Battery>): Promise<DBResult<Battery>> => {
    await delay(200);
    const json = localStorage.getItem(STORAGE_KEY);
    let current: Battery[] = json ? JSON.parse(json) : [];
    
    const index = current.findIndex(b => b.id === id);
    if (index === -1) return { success: false, error: 'Battery not found' };

    current[index] = { 
      ...current[index], 
      ...updates,
      // Reset auto-update timer if charge level is manually changed
      lastAutoUpdate: (updates.chargeLevel !== undefined) ? new Date().toISOString() : current[index].lastAutoUpdate
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    return { success: true, data: current[index] };
  },

  delete: async (id: string): Promise<DBResult<void>> => {
    await delay(200);
    const json = localStorage.getItem(STORAGE_KEY);
    let current: Battery[] = json ? JSON.parse(json) : [];
    
    const updated = current.filter(b => b.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Clean up logs
    const logsJson = localStorage.getItem(LOGS_STORAGE_KEY);
    if (logsJson) {
      const logs: BatteryLog[] = JSON.parse(logsJson);
      const updatedLogs = logs.filter(l => l.batteryId !== id);
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(updatedLogs));
    }

    return { success: true };
  },

  // Logs logic
  getLogs: async (batteryId: string): Promise<DBResult<BatteryLog[]>> => {
    await delay(100);
    const json = localStorage.getItem(LOGS_STORAGE_KEY);
    const allLogs: BatteryLog[] = json ? JSON.parse(json) : [];
    const filtered = allLogs.filter(l => l.batteryId === batteryId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return { success: true, data: filtered };
  },

  addLog: async (log: Omit<BatteryLog, 'id'>): Promise<DBResult<BatteryLog>> => {
    await delay(100);
    const json = localStorage.getItem(LOGS_STORAGE_KEY);
    const allLogs: BatteryLog[] = json ? JSON.parse(json) : [];
    
    const newLog: BatteryLog = {
      ...log,
      id: Date.now().toString() + Math.random().toString().slice(2,5),
    };
    
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify([...allLogs, newLog]));
    return { success: true, data: newLog };
  }
};
