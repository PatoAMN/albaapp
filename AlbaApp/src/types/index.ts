export interface User {
  id: string;
  email: string;
  name: string;
  userType: 'member' | 'guard' | 'admin' | 'super_admin';
  phone?: string;
  createdAt: Date;
  organizationId: string;
  isActive: boolean;
  profileImage?: string;
}

export interface Member extends User {
  userType: 'member';
  homeAddress: string;
  vehicleInfo?: string;
  emergencyContacts?: string[];
  accessLevel: 'resident' | 'guest' | 'restricted';
  qrCodeHash: string;
  qrCodeExpiry: Date;
  residentSince: Date;
  homeNumber?: string;
  familyMembers?: string[];
}

export interface Guard extends User {
  userType: 'guard';
  badgeNumber: string;
  shiftHours?: string;
  accessLevel: 'guard' | 'supervisor';
  assignedAccessPoints?: string[];
  currentShift?: {
    startTime: Date;
    endTime: Date;
    status: 'active' | 'break' | 'ended';
  };
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

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'security' | 'maintenance' | 'event' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  organizationId: string;
  organizationName?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  expiresAt?: Date;
  status: 'draft' | 'published' | 'archived';
  isActive: boolean;
  targetAudience: 'all' | 'members' | 'guards' | 'admins';
  tags?: string[];
  readBy?: string[];
  views?: number;
}

export interface AnnouncementAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
}
