import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  serverTimestamp,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';

export interface QRValidationResult {
  valid: boolean;
  message?: string;
  member?: {
    id: string;
    name: string;
    email: string;
    accessLevel?: string;
    homeAddress?: string;
    vehicleInfo?: any;
    qrCodeExpiry?: Date;
  };
}

export interface AccessLog {
  memberId: string;
  memberName: string;
  accessTime: Date;
  guardId: string;
  guardName: string;
  accessGranted: boolean;
  qrCodeHash: string;
}

export class QRValidationService {
  private organizationId: string;

  constructor(organizationId: string) {
    this.organizationId = organizationId;
  }

  /**
   * Valida un código QR en la nube usando Firestore
   * Ahora también valida QRs de invitados
   */
  async validateQRCode(qrCodeHash: string, guardId: string, guardName: string): Promise<QRValidationResult> {
    try {
      console.log('🔍 Validando QR en la nube:', qrCodeHash);
      
      // Consulta en la colección global 'users' filtrando por organización
      const usersRef = collection(db, 'users');
      
      // Primero, buscar solo por organización para debuggear
      const debugQuery = query(
        usersRef,
        where('organizationId', '==', this.organizationId)
      );
      
      const debugSnapshot = await getDocs(debugQuery);
      console.log('🔍 [QR-VALIDATE] Debug: Usuarios en organización:', debugSnapshot.size);
      console.log('🔍 [QR-VALIDATE] organizationId buscado:', this.organizationId);
      
      // Mostrar todos los usuarios de la organización para debuggear
      debugSnapshot.forEach(doc => {
        const userData = doc.data();
        console.log('👤 [QR-VALIDATE] Usuario en org:', {
          docId: doc.id,
          name: userData.name,
          email: userData.email,
          organizationId: userData.organizationId,
          qrCodeHash: userData.qrCodeHash || 'NO TIENE QR',
          isActive: userData.isActive
        });
      });
      
      // También mostrar TODOS los usuarios para comparar
      const allUsersQuery = query(usersRef);
      const allUsersSnapshot = await getDocs(allUsersQuery);
      console.log('🔍 [QR-VALIDATE] Total usuarios en la base de datos:', allUsersSnapshot.size);
      allUsersSnapshot.forEach(doc => {
        const userData = doc.data();
        console.log('👤 [QR-VALIDATE] Usuario en BD:', {
          docId: doc.id,
          name: userData.name,
          email: userData.email,
          organizationId: userData.organizationId,
          qrCodeHash: userData.qrCodeHash || 'NO TIENE QR'
        });
      });
      
      // Ahora la consulta real - solo buscar por QR y organización
      const q = query(
        usersRef,
        where('qrCodeHash', '==', qrCodeHash),
        where('organizationId', '==', this.organizationId)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('🔍 [QR-VALIDATE] QR de miembro no encontrado, verificando si es QR de invitado...');
        
        // Verificar si es un QR de invitado
        if (qrCodeHash.startsWith('guest_')) {
          return await this.validateGuestQR(qrCodeHash, guardId, guardName);
        }
        
        console.error('❌ [QR-VALIDATE] QR no encontrado en la base de datos');
        console.error('❌ [QR-VALIDATE] qrCodeHash buscado:', qrCodeHash);
        console.error('❌ [QR-VALIDATE] organizationId:', this.organizationId);
        
        // Buscar si el hash existe en cualquier organización
        const globalHashQuery = query(usersRef, where('qrCodeHash', '==', qrCodeHash));
        const globalHashSnapshot = await getDocs(globalHashQuery);
        
        if (!globalHashSnapshot.empty) {
          const wrongOrgUser = globalHashSnapshot.docs[0].data();
          console.error('❌ [QR-VALIDATE] QR encontrado pero en otra organización:');
          console.error('❌ [QR-VALIDATE] Usuario:', wrongOrgUser.name);
          console.error('❌ [QR-VALIDATE] Organización del usuario:', wrongOrgUser.organizationId);
          console.error('❌ [QR-VALIDATE] Organización esperada:', this.organizationId);
          return { 
            valid: false, 
            message: `Código QR válido pero pertenece a otra comunidad. Usuario: ${wrongOrgUser.name || 'Desconocido'}` 
          };
        } else {
          console.error('❌ [QR-VALIDATE] QR no existe en ninguna parte de la base de datos');
          return { 
            valid: false, 
            message: 'Código QR no encontrado en el sistema. Verifique que el QR sea válido y esté actualizado.' 
          };
        }
      }
      
      const memberDoc = snapshot.docs[0];
      const member = memberDoc.data();
      
      console.log('✅ Miembro encontrado:', member.name);
      
      // Verificar si el usuario está activo (si tiene el campo)
      if (member.isActive === false) {
        console.log('❌ Usuario inactivo:', member.name);
        return { 
          valid: false, 
          message: `Usuario ${member.name} está inactivo. Contacte al administrador.` 
        };
      }
      
      // Verificar expiración del QR
      const expiryDate = member.qrCodeExpiry instanceof Timestamp 
        ? member.qrCodeExpiry.toDate() 
        : new Date(member.qrCodeExpiry);
      
      if (new Date() > expiryDate) {
        console.log('❌ QR expirado para:', member.name);
        return { 
          valid: false, 
          message: `Código QR expirado para ${member.name}. Por favor, solicite un nuevo código.` 
        };
      }
      
      // Registrar acceso exitoso
      await this.logAccess({
        memberId: memberDoc.id,
        memberName: member.name,
        accessTime: new Date(),
        guardId,
        guardName,
        accessGranted: true,
        qrCodeHash
      });
      
      console.log('✅ Acceso registrado exitosamente');
      
      return {
        valid: true,
        member: {
          id: memberDoc.id,
          name: member.name,
          email: member.email,
          accessLevel: member.accessLevel,
          homeAddress: member.homeAddress,
          vehicleInfo: member.vehicleInfo,
          qrCodeExpiry: expiryDate
        }
      };
      
    } catch (error) {
      console.error('❌ Error en validación en la nube:', error);
      throw new Error(`Error de validación: ${error.message}`);
    }
  }

  /**
   * Valida un código QR de invitado
   */
  private async validateGuestQR(qrCodeHash: string, guardId: string, guardName: string): Promise<QRValidationResult> {
    try {
      console.log('🔍 [QR-VALIDATE] Validando QR de invitado:', qrCodeHash);
      
      // Buscar el QR en todos los invitados de la organización
      const guestsRef = collection(db, 'organizations', this.organizationId, 'guests');
      const guestsSnapshot = await getDocs(guestsRef);
      
      let foundGuest = null;
      let foundQR = null;
      
      // Buscar en cada invitado por su QR
      for (const guestDoc of guestsSnapshot.docs) {
        const guestData = guestDoc.data();
        const qrCodes = guestData.qrCodes || [];
        
        const matchingQR = qrCodes.find((qr: any) => qr.qrCodeHash === qrCodeHash);
        if (matchingQR) {
          foundGuest = {
            id: guestDoc.id,
            ...guestData
          };
          foundQR = matchingQR;
          break;
        }
      }

      if (!foundGuest || !foundQR) {
        return {
          valid: false,
          message: 'Código QR de invitado no encontrado'
        };
      }

      // Verificar si el QR está activo
      if (!foundQR.isActive) {
        return {
          valid: false,
          message: 'Código QR de invitado inactivo'
        };
      }

      // Verificar fecha y hora de validez
      const now = new Date();
      const startTime = foundQR.startDateTime instanceof Timestamp 
        ? foundQR.startDateTime.toDate() 
        : new Date(foundQR.startDateTime);
      const endTime = foundQR.endDateTime instanceof Timestamp 
        ? foundQR.endDateTime.toDate() 
        : new Date(foundQR.endDateTime);

      if (now < startTime) {
        return {
          valid: false,
          message: `El acceso del invitado no ha comenzado. Válido desde: ${startTime.toLocaleString()}`
        };
      }

      if (now > endTime) {
        return {
          valid: false,
          message: `El acceso del invitado ha expirado. Válido hasta: ${endTime.toLocaleString()}`
        };
      }

      // Registrar el acceso exitoso
      await this.logGuestAccess({
        guestId: foundGuest.id,
        guestName: foundGuest.name,
        accessTime: now,
        guardId,
        guardName,
        accessGranted: true,
        qrCodeHash,
        purpose: foundQR.purpose
      });

      return {
        valid: true,
        message: 'Acceso permitido para invitado',
        member: {
          id: foundGuest.id,
          name: foundGuest.name,
          email: foundGuest.email || '',
          accessLevel: 'invitado',
          homeAddress: `Invitado de: ${foundGuest.relationship || 'Miembro'}`,
          vehicleInfo: null,
          qrCodeExpiry: endTime
        }
      };

    } catch (error) {
      console.error('❌ Error validando QR de invitado:', error);
      return {
        valid: false,
        message: 'Error validando el código QR del invitado'
      };
    }
  }

  /**
   * Registra un intento de acceso en Firestore
   */
  private async logAccess(accessLog: AccessLog): Promise<void> {
    try {
      const accessLogsRef = collection(db, 'organizations', this.organizationId, 'accessLogs');
      await addDoc(accessLogsRef, {
        ...accessLog,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error registrando acceso:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  /**
   * Registra un intento de acceso de invitado en Firestore
   */
  private async logGuestAccess(accessData: {
    guestId: string;
    guestName: string;
    accessTime: Date;
    guardId: string;
    guardName: string;
    accessGranted: boolean;
    qrCodeHash: string;
    purpose: string;
  }): Promise<void> {
    try {
      const accessLogsRef = collection(db, 'organizations', this.organizationId, 'guestAccessLogs');
      await addDoc(accessLogsRef, {
        ...accessData,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error registrando acceso de invitado:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  /**
   * Actualiza el QR de un miembro en Firestore
   */
  async updateMemberQR(memberId: string, qrCodeHash: string, expiryDate: Date): Promise<void> {
    try {
      console.log('🔧 [QR-UPDATE] Iniciando actualización de QR:');
      console.log('🔧 [QR-UPDATE] memberId (documentId):', memberId);
      console.log('🔧 [QR-UPDATE] qrCodeHash:', qrCodeHash);
      console.log('🔧 [QR-UPDATE] organizationId:', this.organizationId);
      console.log('🔧 [QR-UPDATE] expiryDate:', expiryDate);
      
      // Buscar el usuario directamente por su document ID en la colección 'users'
      const userRef = doc(db, 'users', memberId);
      
      console.log('🔍 [QR-UPDATE] Verificando si el documento existe...');
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.error('❌ [QR-UPDATE] Usuario no encontrado para actualizar QR');
        console.error('❌ [QR-UPDATE] Buscado con documentId:', memberId);
        console.error('❌ [QR-UPDATE] En organización:', this.organizationId);
        
        // Mostrar todos los usuarios para debugging
        const usersRef = collection(db, 'users');
        const allUsersQuery = query(usersRef, where('organizationId', '==', this.organizationId));
        const allUsersSnapshot = await getDocs(allUsersQuery);
        console.log('🔍 [QR-UPDATE] Todos los usuarios en la organización:', allUsersSnapshot.size);
        allUsersSnapshot.forEach(doc => {
          const userData = doc.data();
          console.log('👤 [QR-UPDATE] Usuario encontrado:', {
            docId: doc.id,
            firebaseUid: userData.firebaseUid,
            email: userData.email,
            name: userData.name,
            organizationId: userData.organizationId
          });
        });
        
        throw new Error('Usuario no encontrado');
      }
      
      const userData = userDoc.data();
      
      // Verificar que el usuario pertenezca a la organización correcta
      if (userData.organizationId !== this.organizationId) {
        console.error('❌ [QR-UPDATE] Usuario no pertenece a esta organización');
        console.error('❌ [QR-UPDATE] Usuario pertenece a:', userData.organizationId);
        console.error('❌ [QR-UPDATE] Intenta acceder a:', this.organizationId);
        throw new Error('Usuario no pertenece a esta organización');
      }
      
      console.log('✅ [QR-UPDATE] Usuario encontrado para actualizar:');
      console.log('✅ [QR-UPDATE] docId:', userDoc.id);
      console.log('✅ [QR-UPDATE] userData.name:', userData.name);
      console.log('✅ [QR-UPDATE] userData.email:', userData.email);
      
      await updateDoc(userRef, {
        qrCodeHash,
        qrCodeExpiry: expiryDate,
        lastUpdated: serverTimestamp()
      });
      
      console.log('✅ [QR-UPDATE] QR actualizado exitosamente');
      console.log('✅ [QR-UPDATE] docId:', userDoc.id);
      console.log('✅ [QR-UPDATE] qrCodeHash guardado:', qrCodeHash);
    } catch (error) {
      console.error('❌ [QR-UPDATE] Error actualizando QR:', error);
      throw error;
    }
  }

  /**
   * Obtiene el historial de accesos de un miembro
   */
  async getMemberAccessHistory(memberId: string): Promise<AccessLog[]> {
    try {
      const accessLogsRef = collection(db, 'organizations', this.organizationId, 'accessLogs');
      const q = query(
        accessLogsRef,
        where('memberId', '==', memberId),
        where('accessGranted', '==', true)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as AccessLog);
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      return [];
    }
  }
}
