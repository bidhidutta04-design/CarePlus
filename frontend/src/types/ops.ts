export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  ipAddress: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  shift: "Morning" | "Evening" | "Night";
  phone: string;
  status: "On Duty" | "Off Duty" | "On Leave";
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  minThreshold: number;
  unitCost: number;
  supplier: string;
  lastRestocked: string;
}

export interface Department {
  id: string;
  name: string;
  hod: string;
  opdRooms: number;
  bedCount: number;
  occupiedBeds: number;
  doctorsCount: number;
  icon: string;
}
