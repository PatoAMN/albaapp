// Tipos simplificados para evitar conflictos con el sistema existente
export interface SimpleUser {
  id: string;
  email: string;
  name: string;
  role: 'member' | 'guard' | 'admin' | 'super_admin';
  organizationId: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  firebaseUid: string;
}

export interface SimpleOrganization {
  id: string;
  name: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SimpleDocument {
  id: string;
  name: string;
  description?: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  category: 'reglamento' | 'manual' | 'formulario' | 'otro';
  organizationId: string;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface SimpleDocumentCategory {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SimpleDocumentAccess {
  id: string;
  documentId: string;
  userId: string;
  userType: 'member' | 'guard' | 'admin';
  accessType: 'read' | 'write' | 'admin';
  grantedAt: Date;
  grantedBy: string;
}

// Tipo para el portal del administrador
export type AdminPortal = 'member' | 'guard';

export interface AdminPortalContextType {
  currentPortal: AdminPortal;
  switchPortal: (portal: AdminPortal) => void;
}
