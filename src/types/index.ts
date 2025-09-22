export interface User {
  id: string;
  email: string;
  name: string;
  userType: 'member' | 'guard' | 'admin' | 'super_admin';
  phone: string;
  createdAt: Date;
  organizationId: string; // Nuevo campo para multi-tenant
  isActive: boolean; // Nuevo campo para estado del usuario
  // Campos para QR (opcionales)
  qrCodeHash?: string;
  qrCodeExpiry?: Date;
  homeAddress?: string;
  accessLevel?: string;
  // Campos del perfil (opcionales)
  birthDate?: string;
  homeNumber?: string;
  parkingSpot?: string;
  buildingInfo?: {
    tower: string;
    apartment: string;
  };
  residenceType?: 'casa' | 'edificio';
  vehicleInfo?: {
    plate: string;
    model: string;
    color: string;
  };
  emergencyContacts?: EmergencyContact[];
}

export interface Organization {
  id: string;
  name: string;
  displayName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  contactInfo: {
    phone: string;
    email: string;
    website?: string;
  };
  settings: {
    theme: {
      primaryColor: string;
      secondaryColor: string;
      logo?: string;
    };
    security: {
      qrCodeExpiryHours: number;
      requirePhotoForGuests: boolean;
      maxGuestsPerResident: number;
      communityCode: string;
    };
    notifications: {
      emailNotifications: boolean;
      pushNotifications: boolean;
      smsNotifications: boolean;
    };
  };
  communityType: 'privada' | 'edificio' | 'mixto'; // Nuevo campo para tipo de comunidad
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  memberCount: number;
  guardCount: number;
  accessPointCount: number;
}

export interface CommunityDocument {
  id: string;
  title: string;
  description: string;
  category: 'reglamento' | 'manual' | 'formulario' | 'informacion' | 'emergencia' | 'otros';
  organizationId: string;
  organizationName: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  status: 'active' | 'draft' | 'archived';
  tags: string[];
  author: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  version: string;
  isPublic: boolean;
  downloadCount: number;
  viewCount: number;
  requiresAcknowledgment: boolean;
  acknowledgmentRequiredBy?: Date;
  lastViewedBy?: {
    memberId: string;
    memberName: string;
    viewedAt: Date;
  }[];
}

export interface Member extends User {
  residentSince: Date;
  homeNumber: string;
  // homeAddress y accessLevel ahora están en User
  familyMembers: FamilyMember[];
  vehicleInfo: VehicleInfo;
  emergencyContacts: EmergencyContact[];
  parkingSpot: string;
  birthDate?: string;
  memberType: 'resident' | 'owner' | 'tenant';
  // Campos específicos para edificios
  buildingInfo?: {
    tower: string;
    apartment: string;
  };
  // Tipo de residencia seleccionada (para comunidades mixtas)
  residenceType?: 'casa' | 'edificio';
}

export interface VehicleInfo {
  plate: string;
  model: string;
  color: string;
  year?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
  priority: 'primary' | 'secondary';
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  age?: number;
  phone?: string;
}

export interface Guard extends User {
  userType: 'guard';
  badgeNumber: string;
  shiftHours?: string;
  // accessLevel ahora está en User
  assignedAccessPoints?: string[]; // IDs de porterías asignadas
  currentShift?: {
    startTime: Date;
    endTime: Date;
    status: 'active' | 'break' | 'ended';
  };
}

export interface Admin extends User {
  userType: 'admin';
  permissions: string[];
  managedOrganizations?: string[]; // Para admins que manejan múltiples orgs
}

export interface SuperAdmin extends User {
  userType: 'super_admin';
  globalPermissions: string[];
  canCreateOrganizations: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
}

export interface Guest {
  id: string;
  organizationId: string; // Nuevo campo para multi-tenant
  fullName: string;
  destination: string;
  idPhotoUrl: string;
  registeredBy: string; // guard ID
  registeredAt: Date;
  status: 'active' | 'completed' | 'expired';
  notes?: string;
  hostMemberId: string; // ID del residente que recibe al invitado
  expectedDeparture?: Date;
  vehicleInfo?: string;
}

export interface AccessLog {
  id: string;
  organizationId: string; // Nuevo campo para multi-tenant
  memberId: string;
  guardId: string;
  accessPointId: string; // Nuevo campo para identificar la portería
  timestamp: Date;
  accessGranted: boolean;
  location: string;
  notes?: string;
  qrCodeUsed: string;
  accessType: 'entry' | 'exit' | 'both';
  verificationMethod: 'qr_scan' | 'manual' | 'card' | 'biometric';
}

export interface AccessPoint {
  id: string;
  organizationId: string;
  name: string;
  location: string;
  type: 'main_gate' | 'pedestrian_gate' | 'service_entrance' | 'emergency_exit';
  status: 'active' | 'inactive' | 'maintenance';
  assignedGuards: string[]; // Array de guard IDs
  features: {
    hasCamera: boolean;
    hasIntercom: boolean;
    hasCardReader: boolean;
    hasBiometric: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
  organizationId?: string; // Opcional para login inicial
}

export interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  switchOrganization: (orgId: string) => Promise<void>;
}
