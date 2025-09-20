import { db } from './firebase';
import { collection, doc, addDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, Timestamp, arrayUnion, getDoc } from 'firebase/firestore';

export interface Guest {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship?: string;
  memberId: string; // ID del miembro que creó el invitado
  organizationId: string; // ID de la organización
  createdAt: Date;
  qrCodes: GuestQR[];
}

export interface GuestQR {
  id: string;
  purpose: string;
  qrCodeHash: string;
  qrCodeImage: string;
  startDateTime: Date;
  endDateTime: Date;
  isActive: boolean;
  createdAt: Date;
}

export class GuestsService {
  private static instance: GuestsService;

  static getInstance(): GuestsService {
    if (!GuestsService.instance) {
      GuestsService.instance = new GuestsService();
    }
    return GuestsService.instance;
  }

  // Crear un nuevo invitado
  async createGuest(guestData: Omit<Guest, 'id' | 'createdAt' | 'qrCodes'>): Promise<string> {
    try {
      // Limpiar datos para evitar campos undefined
      const cleanGuestData = {
        name: guestData.name,
        phone: guestData.phone,
        memberId: guestData.memberId,
        organizationId: guestData.organizationId,
        // Solo incluir campos opcionales si tienen valor
        ...(guestData.email && { email: guestData.email }),
        ...(guestData.relationship && { relationship: guestData.relationship })
      };

      // Los invitados se guardan en organizations/{orgId}/guests/
      const guestRef = await addDoc(collection(db, 'organizations', guestData.organizationId, 'guests'), {
        ...cleanGuestData,
        createdAt: Timestamp.now(),
        qrCodes: []
      });
      
      console.log('✅ Invitado creado con ID:', guestRef.id);
      return guestRef.id;
    } catch (error) {
      console.error('Error creando invitado:', error);
      throw new Error('No se pudo crear el invitado');
    }
  }

  // Cargar invitados de un miembro específico
  async getGuestsByMember(memberId: string, organizationId: string): Promise<Guest[]> {
    try {
      // Consulta simple sin orderBy para evitar problemas de índice
      const q = query(
        collection(db, 'organizations', organizationId, 'guests'),
        where('memberId', '==', memberId)
      );
      
      const querySnapshot = await getDocs(q);
      const guests: Guest[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        guests.push({
          id: doc.id,
          name: data.name,
          phone: data.phone,
          email: data.email || '',
          relationship: data.relationship || '',
          memberId: data.memberId,
          organizationId: data.organizationId,
          createdAt: data.createdAt.toDate(),
          qrCodes: data.qrCodes || []
        });
      });
      
      // Ordenar en el cliente para evitar problemas de índice
      guests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      console.log('✅ Invitados cargados:', guests.length);
      return guests;
    } catch (error) {
      console.error('Error cargando invitados:', error);
      throw new Error('No se pudieron cargar los invitados');
    }
  }

  // Agregar un código QR a un invitado
  async addQRCodeToGuest(guestId: string, organizationId: string, qrCodeData: Omit<GuestQR, 'id' | 'createdAt'>): Promise<string> {
    try {
      const guestRef = doc(db, 'organizations', organizationId, 'guests', guestId);
      const qrCodeId = `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const qrCode: GuestQR = {
        ...qrCodeData,
        id: qrCodeId,
        createdAt: new Date()
      };

      // Actualizar el documento del invitado agregando el nuevo QR
      await updateDoc(guestRef, {
        qrCodes: arrayUnion(qrCode)
      });
      
      console.log('✅ Código QR agregado:', qrCodeId);
      return qrCodeId;
    } catch (error) {
      console.error('Error agregando código QR:', error);
      throw new Error('No se pudo agregar el código QR');
    }
  }

  // Actualizar un código QR específico
  async updateQRCode(guestId: string, organizationId: string, qrCodeId: string, updates: Partial<GuestQR>): Promise<void> {
    try {
      const guestRef = doc(db, 'organizations', organizationId, 'guests', guestId);
      const guestDoc = await getDoc(guestRef);
      
      if (!guestDoc.exists()) {
        throw new Error('Invitado no encontrado');
      }

      const guestData = guestDoc.data();
      const updatedQRCodes = guestData.qrCodes.map((qr: GuestQR) => 
        qr.id === qrCodeId ? { ...qr, ...updates } : qr
      );

      await updateDoc(guestRef, {
        qrCodes: updatedQRCodes
      });
      
      console.log('✅ Código QR actualizado:', qrCodeId);
    } catch (error) {
      console.error('Error actualizando código QR:', error);
      throw new Error('No se pudo actualizar el código QR');
    }
  }

  // Eliminar un invitado
  async deleteGuest(guestId: string, organizationId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'organizations', organizationId, 'guests', guestId));
      console.log('✅ Invitado eliminado:', guestId);
    } catch (error) {
      console.error('Error eliminando invitado:', error);
      throw new Error('No se pudo eliminar el invitado');
    }
  }

  // Eliminar un código QR específico
  async deleteQRCode(guestId: string, organizationId: string, qrCodeId: string): Promise<void> {
    try {
      const guestRef = doc(db, 'organizations', organizationId, 'guests', guestId);
      const guestDoc = await getDoc(guestRef);
      
      if (!guestDoc.exists()) {
        throw new Error('Invitado no encontrado');
      }

      const guestData = guestDoc.data();
      const updatedQRCodes = guestData.qrCodes.filter((qr: GuestQR) => qr.id !== qrCodeId);

      await updateDoc(guestRef, {
        qrCodes: updatedQRCodes
      });
      
      console.log('✅ Código QR eliminado:', qrCodeId);
    } catch (error) {
      console.error('Error eliminando código QR:', error);
      throw new Error('No se pudo eliminar el código QR');
    }
  }

  // Generar QR para un invitado
  async createGuestQR(
    guestId: string, 
    organizationId: string, 
    purpose: string, 
    startDateTime: Date, 
    endDateTime: Date
  ): Promise<GuestQR> {
    try {
      // Generar hash único para el QR del invitado
      const qrCodeHash = `guest_${guestId}_${organizationId}_${Date.now()}`;
      
      // Crear el objeto QR del invitado
      const guestQR: Omit<GuestQR, 'id' | 'createdAt'> = {
        purpose,
        qrCodeHash,
        qrCodeImage: '', // Se generará después
        startDateTime,
        endDateTime,
        isActive: true
      };

      // Guardar en la subcolección del invitado
      const guestRef = doc(db, 'organizations', organizationId, 'guests', guestId);
      const qrRef = await addDoc(collection(guestRef, 'qrCodes'), {
        ...guestQR,
        createdAt: Timestamp.now()
      });

      // Actualizar el invitado para incluir el nuevo QR
      await updateDoc(guestRef, {
        qrCodes: arrayUnion({
          id: qrRef.id,
          ...guestQR,
          createdAt: new Date()
        })
      });

      console.log('✅ QR de invitado creado:', qrRef.id);
      
      return {
        id: qrRef.id,
        ...guestQR,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error creando QR de invitado:', error);
      throw new Error('No se pudo crear el QR del invitado');
    }
  }

  // Validar QR de invitado
  async validateGuestQR(
    qrCodeHash: string, 
    organizationId: string, 
    guardId: string, 
    guardName: string
  ): Promise<{
    valid: boolean;
    message: string;
    guest?: {
      id: string;
      name: string;
      phone: string;
      email?: string;
      relationship?: string;
      purpose: string;
      startDateTime: Date;
      endDateTime: Date;
    };
  }> {
    try {
      // Buscar el QR en todos los invitados de la organización
      const guestsRef = collection(db, 'organizations', organizationId, 'guests');
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
        guest: {
          id: foundGuest.id,
          name: foundGuest.name,
          phone: foundGuest.phone,
          email: foundGuest.email,
          relationship: foundGuest.relationship,
          purpose: foundQR.purpose,
          startDateTime: startTime,
          endDateTime: endTime
        }
      };

    } catch (error) {
      console.error('Error validando QR de invitado:', error);
      return {
        valid: false,
        message: 'Error validando el código QR del invitado'
      };
    }
  }

  // Registrar acceso de invitado
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
      const accessLogsRef = collection(db, 'organizations', accessData.guestId.split('_')[1], 'guestAccessLogs');
      await addDoc(accessLogsRef, {
        ...accessData,
        timestamp: Timestamp.now()
      });
    } catch (error) {
      console.error('Error registrando acceso de invitado:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }
}

export default GuestsService.getInstance();
