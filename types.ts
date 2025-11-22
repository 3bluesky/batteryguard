
export enum BatteryType {
  LiIon = '锂离子 (18650/21700)',
  LiPo = '锂聚合物 (无人机/软包)',
  NiMH = '镍氢 (AA/AAA)',
  LeadAcid = '铅酸 (汽车/UPS)',
  LiFePO4 = '磷酸铁锂',
  Button = '纽扣电池',
  Other = '其他'
}

export interface Battery {
  id: string;
  name: string;
  type: BatteryType;
  capacity: number; // mAh
  voltage: number; // V
  chargeLevel: number; // 0-100%
  cycleCount: number;
  internalResistance: number; // mΩ (milliohms)
  purchaseDate: string;
  lastChargeDate: string;
  lastAutoUpdate?: string; // Timestamp for self-discharge calculation
  healthThreshold: number; // % below which to warn
  notes?: string;
}

export interface BatteryLog {
  id: string;
  batteryId: string;
  timestamp: string;
  action: 'CHARGE' | 'DISCHARGE' | 'MAINTENANCE' | 'NOTE';
  details: string;
  levelAfter: number;
}

export interface BatteryHealthStatus {
  soh: number; // State of Health %
  status: 'Good' | 'Fair' | 'Poor' | 'Critical';
  color: string;
}

// Mock Database Response wrapper
export interface DBResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
