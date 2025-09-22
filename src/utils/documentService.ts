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
  limit,
  serverTimestamp,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { Document, DocumentCategory, DocumentAccess, User } from '../types';

class DocumentService {
  private unsubscribeFunctions: (() => void)[] = [];

  /**
   * Subir un nuevo documento
   */
  async uploadDocument(
    file: File,
    documentData: Omit<Document, 'id' | 'fileUrl' | 'fileSize' | 'fileType' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      console.log('📄 [DOC] Iniciando subida de documento:', documentData.name);
      
      // Crear referencia única para el archivo
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `documents/${documentData.organizationId}/${fileName}`);
      
      // Subir archivo a Firebase Storage
      const snapshot = await uploadBytes(storageRef, file);
      console.log('📄 [DOC] Archivo subido a Storage:', snapshot.metadata.name);
      
      // Obtener URL de descarga
      const downloadURL = await getDownloadURL(storageRef);
      
      // Crear documento en Firestore
      const docRef = await addDoc(collection(db, 'documents'), {
        ...documentData,
        fileName,
        fileUrl: downloadURL,
        fileSize: file.size,
        fileType: file.type,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
      });
      
      console.log('✅ [DOC] Documento creado en Firestore:', docRef.id);
      return docRef.id;
      
    } catch (error) {
      console.error('❌ [DOC] Error subiendo documento:', error);
      throw new Error('No se pudo subir el documento');
    }
  }

  /**
   * Obtener todos los documentos de una organización
   */
  async getDocumentsByOrganization(organizationId: string): Promise<Document[]> {
    try {
      console.log('🔍 [DOC] Obteniendo documentos para organización:', organizationId);
      
      const q = query(
        collection(db, 'documents'),
        where('organizationId', '==', organizationId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const documents: Document[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        documents.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Document);
      });
      
      console.log('✅ [DOC] Documentos obtenidos:', documents.length);
      return documents;
      
    } catch (error) {
      console.error('❌ [DOC] Error obteniendo documentos:', error);
      throw new Error('No se pudieron obtener los documentos');
    }
  }

  /**
   * Obtener documentos por categoría
   */
  async getDocumentsByCategory(organizationId: string, category: string): Promise<Document[]> {
    try {
      console.log('🔍 [DOC] Obteniendo documentos por categoría:', category);
      
      const q = query(
        collection(db, 'documents'),
        where('organizationId', '==', organizationId),
        where('category', '==', category),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const documents: Document[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        documents.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Document);
      });
      
      console.log('✅ [DOC] Documentos por categoría obtenidos:', documents.length);
      return documents;
      
    } catch (error) {
      console.error('❌ [DOC] Error obteniendo documentos por categoría:', error);
      throw new Error('No se pudieron obtener los documentos por categoría');
    }
  }

  /**
   * Obtener un documento específico
   */
  async getDocument(documentId: string): Promise<Document | null> {
    try {
      console.log('🔍 [DOC] Obteniendo documento:', documentId);
      
      const docRef = doc(db, 'documents', documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const document: Document = {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Document;
        
        console.log('✅ [DOC] Documento obtenido:', document.name);
        return document;
      } else {
        console.log('⚠️ [DOC] Documento no encontrado:', documentId);
        return null;
      }
      
    } catch (error) {
      console.error('❌ [DOC] Error obteniendo documento:', error);
      throw new Error('No se pudo obtener el documento');
    }
  }

  /**
   * Actualizar un documento
   */
  async updateDocument(documentId: string, updates: Partial<Document>): Promise<void> {
    try {
      console.log('📝 [DOC] Actualizando documento:', documentId);
      
      const docRef = doc(db, 'documents', documentId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      
      console.log('✅ [DOC] Documento actualizado exitosamente');
      
    } catch (error) {
      console.error('❌ [DOC] Error actualizando documento:', error);
      throw new Error('No se pudo actualizar el documento');
    }
  }

  /**
   * Eliminar un documento
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      console.log('🗑️ [DOC] Eliminando documento:', documentId);
      
      // Obtener información del documento para eliminar el archivo
      const document = await this.getDocument(documentId);
      if (!document) {
        throw new Error('Documento no encontrado');
      }
      
      // Eliminar archivo de Storage
      const storageRef = ref(storage, `documents/${document.organizationId}/${document.fileName}`);
      await deleteObject(storageRef);
      console.log('🗑️ [DOC] Archivo eliminado de Storage');
      
      // Eliminar documento de Firestore
      const docRef = doc(db, 'documents', documentId);
      await deleteDoc(docRef);
      
      console.log('✅ [DOC] Documento eliminado exitosamente');
      
    } catch (error) {
      console.error('❌ [DOC] Error eliminando documento:', error);
      throw new Error('No se pudo eliminar el documento');
    }
  }

  /**
   * Desactivar un documento (soft delete)
   */
  async deactivateDocument(documentId: string): Promise<void> {
    try {
      console.log('🚫 [DOC] Desactivando documento:', documentId);
      
      await this.updateDocument(documentId, { isActive: false });
      console.log('✅ [DOC] Documento desactivado exitosamente');
      
    } catch (error) {
      console.error('❌ [DOC] Error desactivando documento:', error);
      throw new Error('No se pudo desactivar el documento');
    }
  }

  /**
   * Obtener categorías de documentos
   */
  async getDocumentCategories(organizationId: string): Promise<DocumentCategory[]> {
    try {
      console.log('🔍 [DOC] Obteniendo categorías para organización:', organizationId);
      
      const q = query(
        collection(db, 'documentCategories'),
        where('organizationId', '==', organizationId),
        orderBy('name', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const categories: DocumentCategory[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        categories.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as DocumentCategory);
      });
      
      console.log('✅ [DOC] Categorías obtenidas:', categories.length);
      return categories;
      
    } catch (error) {
      console.error('❌ [DOC] Error obteniendo categorías:', error);
      throw new Error('No se pudieron obtener las categorías');
    }
  }

  /**
   * Crear nueva categoría
   */
  async createDocumentCategory(categoryData: Omit<DocumentCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('📁 [DOC] Creando nueva categoría:', categoryData.name);
      
      const docRef = await addDoc(collection(db, 'documentCategories'), {
        ...categoryData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      console.log('✅ [DOC] Categoría creada:', docRef.id);
      return docRef.id;
      
    } catch (error) {
      console.error('❌ [DOC] Error creando categoría:', error);
      throw new Error('No se pudo crear la categoría');
    }
  }

  /**
   * Suscribirse a cambios en documentos de una organización
   */
  subscribeToDocuments(
    organizationId: string,
    callback: (documents: Document[]) => void
  ): () => void {
    console.log('📡 [DOC] Suscribiéndose a documentos de organización:', organizationId);
    
    const q = query(
      collection(db, 'documents'),
      where('organizationId', '==', organizationId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const documents: Document[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        documents.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Document);
      });
      
      console.log('📡 [DOC] Documentos actualizados:', documents.length);
      callback(documents);
    }, (error) => {
      console.error('❌ [DOC] Error en suscripción a documentos:', error);
    });
    
    this.unsubscribeFunctions.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Verificar permisos de usuario para un documento
   */
  async checkDocumentAccess(documentId: string, userId: string, userType: string): Promise<boolean> {
    try {
      console.log('🔐 [DOC] Verificando acceso al documento:', documentId, 'para usuario:', userId);
      
      // Los administradores tienen acceso completo
      if (userType === 'admin' || userType === 'super_admin') {
        return true;
      }
      
      // Verificar acceso específico
      const accessQuery = query(
        collection(db, 'documentAccess'),
        where('documentId', '==', documentId),
        where('userId', '==', userId),
        where('userType', '==', userType)
      );
      
      const accessSnapshot = await getDocs(accessQuery);
      
      if (!accessSnapshot.empty) {
        console.log('✅ [DOC] Acceso verificado para usuario:', userId);
        return true;
      }
      
      // Verificar si el documento es público para la organización
      const document = await this.getDocument(documentId);
      if (document && document.isActive) {
        console.log('✅ [DOC] Acceso público al documento para usuario:', userId);
        return true;
      }
      
      console.log('❌ [DOC] Acceso denegado para usuario:', userId);
      return false;
      
    } catch (error) {
      console.error('❌ [DOC] Error verificando acceso:', error);
      return false;
    }
  }

  /**
   * Limpiar todas las suscripciones
   */
  cleanup(): void {
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions = [];
  }
}

export const documentService = new DocumentService();
