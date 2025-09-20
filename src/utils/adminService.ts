import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Admin, SpecialPermission, AdminPortal, AdminSession, User } from '../types';

class AdminService {
  private unsubscribeFunctions: (() => void)[] = [];

  /**
   * Verificar si un usuario es administrador
   */
  isAdmin(user: User): boolean {
    const isAdminUser = user.role === 'admin' || user.role === 'super_admin';
    console.log('🔐 [ADMIN_SERVICE] isAdmin check:', {
      userId: user.id,
      userRole: user.role,
      isAdmin: isAdminUser
    });
    return isAdminUser;
  }

  /**
   * Verificar si un administrador tiene un permiso específico
   */
  hasPermission(admin: Admin, permission: string): boolean {
    if (admin.role === 'super_admin') return true;
    return admin.permissions.includes(permission);
  }

  /**
   * Verificar si un administrador tiene un permiso especial
   */
  hasSpecialPermission(admin: Admin, permissionCode: string): boolean {
    if (admin.role === 'super_admin') return true;
    
    const specialPermission = admin.specialPermissions.find(
      perm => perm.code === permissionCode && perm.isActive
    );
    
    if (!specialPermission) return false;
    
    // Verificar si el permiso ha expirado
    if (specialPermission.expiresAt && specialPermission.expiresAt < new Date()) {
      return false;
    }
    
    return true;
  }

  /**
   * Obtener permisos especiales de un administrador
   */
  async getSpecialPermissions(adminId: string): Promise<SpecialPermission[]> {
    try {
      console.log('🔐 [ADMIN] Obteniendo permisos especiales para admin:', adminId);
      
      const q = query(
        collection(db, 'specialPermissions'),
        where('adminId', '==', adminId),
        where('isActive', '==', true),
        orderBy('grantedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const permissions: SpecialPermission[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        permissions.push({
          id: doc.id,
          ...data,
          grantedAt: data.grantedAt?.toDate() || new Date(),
          expiresAt: data.expiresAt?.toDate() || undefined,
        } as SpecialPermission);
      });
      
      console.log('✅ [ADMIN] Permisos especiales obtenidos:', permissions.length);
      return permissions;
      
    } catch (error) {
      console.error('❌ [ADMIN] Error obteniendo permisos especiales:', error);
      throw new Error('No se pudieron obtener los permisos especiales');
    }
  }

  /**
   * Otorgar un permiso especial a un administrador
   */
  async grantSpecialPermission(
    adminId: string,
    permissionData: Omit<SpecialPermission, 'id' | 'grantedAt' | 'isActive'>
  ): Promise<string> {
    try {
      console.log('🔐 [ADMIN] Otorgando permiso especial:', permissionData.code);
      
      const permissionRef = await addDoc(collection(db, 'specialPermissions'), {
        ...permissionData,
        adminId,
        grantedAt: serverTimestamp(),
        isActive: true,
      });
      
      console.log('✅ [ADMIN] Permiso especial otorgado:', permissionRef.id);
      return permissionRef.id;
      
    } catch (error) {
      console.error('❌ [ADMIN] Error otorgando permiso especial:', error);
      throw new Error('No se pudo otorgar el permiso especial');
    }
  }

  /**
   * Revocar un permiso especial
   */
  async revokeSpecialPermission(permissionId: string): Promise<void> {
    try {
      console.log('🚫 [ADMIN] Revocando permiso especial:', permissionId);
      
      const permissionRef = doc(db, 'specialPermissions', permissionId);
      await updateDoc(permissionRef, {
        isActive: false,
        revokedAt: serverTimestamp(),
      });
      
      console.log('✅ [ADMIN] Permiso especial revocado');
      
    } catch (error) {
      console.error('❌ [ADMIN] Error revocando permiso especial:', error);
      throw new Error('No se pudo revocar el permiso especial');
    }
  }

  /**
   * Obtener portales disponibles para un administrador
   */
  async getAvailablePortals(admin: Admin): Promise<AdminPortal[]> {
    try {
      console.log('🚪 [ADMIN] Obteniendo portales disponibles para:', admin.id);
      
      const portals: AdminPortal[] = [];
      
      // Portal de Guardias
      if (admin.canAccessGuardPortal || admin.role === 'super_admin') {
        portals.push({
          id: 'guard-portal',
          name: 'guard',
          displayName: 'Portal de Guardias',
          description: 'Gestionar guardias, turnos y acceso',
          icon: 'shield',
          permissions: ['manage_guards', 'view_guard_analytics', 'manage_shifts'],
          isActive: true,
        });
      }
      
      // Portal de Miembros
      if (admin.canAccessMemberPortal || admin.role === 'super_admin') {
        portals.push({
          id: 'member-portal',
          name: 'member',
          displayName: 'Portal de Miembros',
          description: 'Gestionar residentes, visitas y acceso',
          icon: 'people',
          permissions: ['manage_members', 'view_member_analytics', 'manage_guests'],
          isActive: true,
        });
      }
      
      // Portal de Documentos
      if (admin.canManageDocuments || admin.role === 'super_admin') {
        portals.push({
          id: 'document-portal',
          name: 'document',
          displayName: 'Portal de Documentos',
          description: 'Gestionar biblioteca y reglamentos',
          icon: 'library',
          permissions: ['manage_documents', 'manage_categories', 'view_document_analytics'],
          isActive: true,
        });
      }
      
      // Portal de Sistema
      if (admin.canManageSystem || admin.role === 'super_admin') {
        portals.push({
          id: 'system-portal',
          name: 'system',
          displayName: 'Portal de Sistema',
          description: 'Configuración avanzada del sistema',
          icon: 'settings',
          permissions: ['manage_system', 'view_system_analytics', 'manage_organizations'],
          isActive: true,
        });
      }
      
      console.log('✅ [ADMIN] Portales disponibles:', portals.length);
      return portals;
      
    } catch (error) {
      console.error('❌ [ADMIN] Error obteniendo portales:', error);
      throw new Error('No se pudieron obtener los portales disponibles');
    }
  }

  /**
   * Cambiar al portal especificado
   */
  async switchPortal(adminId: string, portalName: 'guard' | 'member' | 'document' | 'system'): Promise<void> {
    try {
      console.log('🔄 [ADMIN] Cambiando al portal:', portalName);
      
      // Crear o actualizar sesión del administrador
      const sessionQuery = query(
        collection(db, 'adminSessions'),
        where('adminId', '==', adminId),
        where('isActive', '==', true)
      );
      
      const sessionSnapshot = await getDocs(sessionQuery);
      
      if (!sessionSnapshot.empty) {
        // Actualizar sesión existente
        const sessionDoc = sessionSnapshot.docs[0];
        await updateDoc(sessionDoc.ref, {
          currentPortal: portalName,
          lastActivity: serverTimestamp(),
        });
        console.log('✅ [ADMIN] Sesión actualizada al portal:', portalName);
      } else {
        // Crear nueva sesión
        await addDoc(collection(db, 'adminSessions'), {
          adminId,
          currentPortal: portalName,
          lastActivity: serverTimestamp(),
          permissions: [], // Se llenarán según el admin
          isActive: true,
        });
        console.log('✅ [ADMIN] Nueva sesión creada para portal:', portalName);
      }
      
    } catch (error) {
      console.error('❌ [ADMIN] Error cambiando portal:', error);
      throw new Error('No se pudo cambiar al portal especificado');
    }
  }

  /**
   * Obtener sesión activa del administrador
   */
  async getActiveSession(adminId: string): Promise<AdminSession | null> {
    try {
      console.log('🔍 [ADMIN] Obteniendo sesión activa para:', adminId);
      
      const q = query(
        collection(db, 'adminSessions'),
        where('adminId', '==', adminId),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const sessionDoc = querySnapshot.docs[0];
        const data = sessionDoc.data();
        
        const session: AdminSession = {
          id: sessionDoc.id,
          ...data,
          lastActivity: data.lastActivity?.toDate() || new Date(),
        } as AdminSession;
        
        console.log('✅ [ADMIN] Sesión activa encontrada:', session.currentPortal);
        return session;
      }
      
      console.log('⚠️ [ADMIN] No se encontró sesión activa');
      return null;
      
    } catch (error) {
      console.error('❌ [ADMIN] Error obteniendo sesión activa:', error);
      return null;
    }
  }

  /**
   * Cerrar sesión del administrador
   */
  async closeSession(sessionId: string): Promise<void> {
    try {
      console.log('🚪 [ADMIN] Cerrando sesión:', sessionId);
      
      const sessionRef = doc(db, 'adminSessions', sessionId);
      await updateDoc(sessionRef, {
        isActive: false,
        closedAt: serverTimestamp(),
      });
      
      console.log('✅ [ADMIN] Sesión cerrada exitosamente');
      
    } catch (error) {
      console.error('❌ [ADMIN] Error cerrando sesión:', error);
      throw new Error('No se pudo cerrar la sesión');
    }
  }

  /**
   * Obtener estadísticas del portal actual
   */
  async getPortalStats(adminId: string, portalName: string): Promise<any> {
    try {
      console.log('📊 [ADMIN] Obteniendo estadísticas del portal:', portalName);
      
      let stats = {};
      
      switch (portalName) {
        case 'guard':
          stats = await this.getGuardPortalStats(adminId);
          break;
        case 'member':
          stats = await this.getMemberPortalStats(adminId);
          break;
        case 'document':
          stats = await this.getDocumentPortalStats(adminId);
          break;
        case 'system':
          stats = await this.getSystemPortalStats(adminId);
          break;
        default:
          console.log('⚠️ [ADMIN] Portal no reconocido:', portalName);
      }
      
      console.log('✅ [ADMIN] Estadísticas obtenidas para portal:', portalName);
      return stats;
      
    } catch (error) {
      console.error('❌ [ADMIN] Error obteniendo estadísticas:', error);
      return {};
    }
  }

  /**
   * Estadísticas del portal de guardias
   */
  private async getGuardPortalStats(adminId: string) {
    try {
      const guardsQuery = query(collection(db, 'users'), where('role', '==', 'guard'));
      const guardsSnapshot = await getDocs(guardsQuery);
      
      return {
        totalGuards: guardsSnapshot.size,
        activeGuards: guardsSnapshot.docs.filter(doc => doc.data().status === 'active').length,
        inactiveGuards: guardsSnapshot.docs.filter(doc => doc.data().status === 'inactive').length,
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de guardias:', error);
      return {};
    }
  }

  /**
   * Estadísticas del portal de miembros
   */
  private async getMemberPortalStats(adminId: string) {
    try {
      const membersQuery = query(collection(db, 'users'), where('role', '==', 'member'));
      const membersSnapshot = await getDocs(membersQuery);
      
      return {
        totalMembers: membersSnapshot.size,
        activeMembers: membersSnapshot.docs.filter(doc => doc.data().status === 'active').length,
        inactiveMembers: membersSnapshot.docs.filter(doc => doc.data().status === 'inactive').length,
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de miembros:', error);
      return {};
    }
  }

  /**
   * Estadísticas del portal de documentos
   */
  private async getDocumentPortalStats(adminId: string) {
    try {
      const documentsQuery = query(collection(db, 'documents'), where('isActive', '==', true));
      const documentsSnapshot = await getDocs(documentsQuery);
      
      return {
        totalDocuments: documentsSnapshot.size,
        documentsByCategory: this.groupDocumentsByCategory(documentsSnapshot.docs),
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de documentos:', error);
      return {};
    }
  }

  /**
   * Estadísticas del portal de sistema
   */
  private async getSystemPortalStats(adminId: string) {
    try {
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      
      return {
        totalUsers: usersSnapshot.size,
        usersByRole: this.groupUsersByRole(usersSnapshot.docs),
        systemHealth: 'excellent',
        lastBackup: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas del sistema:', error);
      return {};
    }
  }

  /**
   * Agrupar documentos por categoría
   */
  private groupDocumentsByCategory(documents: any[]) {
    const grouped: { [key: string]: number } = {};
    
    documents.forEach(doc => {
      const category = doc.data().category || 'sin_categoria';
      grouped[category] = (grouped[category] || 0) + 1;
    });
    
    return grouped;
  }

  /**
   * Agrupar usuarios por rol
   */
  private groupUsersByRole(users: any[]) {
    const grouped: { [key: string]: number } = {};
    
    users.forEach(user => {
      const role = user.data().role || 'sin_rol';
      grouped[role] = (grouped[role] || 0) + 1;
    });
    
    return grouped;
  }

  /**
   * Suscribirse a cambios en la sesión del administrador
   */
  subscribeToAdminSession(
    adminId: string,
    callback: (session: AdminSession | null) => void
  ): () => void {
    console.log('📡 [ADMIN] Suscribiéndose a sesión del admin:', adminId);
    
    const q = query(
      collection(db, 'adminSessions'),
      where('adminId', '==', adminId),
      where('isActive', '==', true)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        const sessionDoc = querySnapshot.docs[0];
        const data = sessionDoc.data();
        
        const session: AdminSession = {
          id: sessionDoc.id,
          ...data,
          lastActivity: data.lastActivity?.toDate() || new Date(),
        } as AdminSession;
        
        callback(session);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('❌ [ADMIN] Error en suscripción a sesión:', error);
      callback(null);
    });
    
    this.unsubscribeFunctions.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Limpiar todas las suscripciones
   */
  cleanup(): void {
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions = [];
  }
}

export const adminService = new AdminService();
