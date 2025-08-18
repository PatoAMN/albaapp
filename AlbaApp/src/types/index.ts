export interface User {
  id: string;
  email: string;
  name: string;
  userType: 'member' | 'guard';
  phone?: string;
  createdAt: Date;
}

export interface Member extends User {
  userType: 'member';
  homeAddress: string;
  vehicleInfo?: string;
  emergencyContacts?: string[];
  accessLevel: 'resident' | 'guest' | 'restricted';
  qrCodeHash: string;
  qrCodeExpiry: Date;
}

export interface Guard extends User {
  userType: 'guard';
  badgeNumber: string;
  shiftHours?: string;
  accessLevel: 'guard' | 'supervisor';
}

export interface Guest {
  id: string;
  fullName: string;
  destination: string;
  idPhotoUrl: string;
  registeredBy: string; // guard ID
  registeredAt: Date;
  status: 'active' | 'completed' | 'expired';
  notes?: string;
}

export interface AccessLog {
  id: string;
  memberId: string;
  guardId: string;
  timestamp: Date;
  accessGranted: boolean;
  location: string;
  notes?: string;
  qrCodeUsed: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}
