import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  getDocs,
  serverTimestamp,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { User, Member, Guard } from '../types';

export interface ChatMessage {
  id?: string;
  text: string;
  senderId: string;
  senderName: string;
  senderType: 'member' | 'guard';
  timestamp: Timestamp | Date;
  isRead: boolean;
  organizationId: string;
  chatRoomId: string;
}

export interface ChatRoom {
  id: string;
  memberId: string;
  memberName: string;
  guardId: string;
  guardName: string;
  organizationId: string;
  lastMessage?: string;
  lastMessageTime?: Timestamp | Date;
  unreadCount: number;
  lastSenderType?: 'member' | 'guard';
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface ChatUser {
  id: string;
  name: string;
  userType: 'member' | 'guard';
  isOnline?: boolean;
  lastSeen?: Date;
}

class ChatService {
  private unsubscribeFunctions: (() => void)[] = [];
  private messageCache: Map<string, ChatMessage[]> = new Map();

  // Obtener todos los guardias de una organización
  async getGuardsByOrganization(organizationId: string): Promise<Guard[]> {
    try {
      console.log('🔍 [CHAT-DEBUG] Buscando guardias para organización:', organizationId);
      
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('organizationId', '==', organizationId),
        where('role', '==', 'guard'),
        where('status', '==', 'active')
      );
      
      const querySnapshot = await getDocs(q);
      console.log('🔍 [CHAT-DEBUG] Query ejecutada, resultados:', querySnapshot.size);
      
      const guards: Guard[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('🔍 [CHAT-DEBUG] Guardia encontrado:', {
          id: doc.id,
          name: data.name,
          role: data.role,
          organizationId: data.organizationId,
          status: data.status
        });
        
        guards.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Guard);
      });
      
      console.log('🔍 [CHAT-DEBUG] Total guardias retornados:', guards.length);
      return guards;
    } catch (error) {
      console.error('❌ Error getting guards by organization:', error);
      return [];
    }
  }

  // Obtener todos los miembros de una organización
  async getMembersByOrganization(organizationId: string): Promise<Member[]> {
    try {
      console.log('🔍 [CHAT-DEBUG] Buscando miembros para organización:', organizationId);
      
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('organizationId', '==', organizationId),
        where('role', '==', 'member'),
        where('status', '==', 'active')
      );
      
      const querySnapshot = await getDocs(q);
      console.log('🔍 [CHAT-DEBUG] Query ejecutada, resultados:', querySnapshot.size);
      
      const members: Member[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('🔍 [CHAT-DEBUG] Miembro encontrado:', {
          id: doc.id,
          name: data.name,
          role: data.role,
          organizationId: data.organizationId,
          status: data.status
        });
        
        members.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Member);
      });
      
      console.log('🔍 [CHAT-DEBUG] Total miembros retornados:', members.length);
      return members;
    } catch (error) {
      console.error('❌ Error getting members by organization:', error);
      return [];
    }
  }

  // Crear o obtener una sala de chat (puede ser iniciada por miembro o guardia)
  async getOrCreateChatRoom(
    memberId: string, 
    memberName: string, 
    guardId: string, 
    guardName: string, 
    organizationId: string
  ): Promise<string> {
    try {
      console.log('🔍 [CHAT-DEBUG] getOrCreateChatRoom llamado con:', {
        memberId,
        memberName,
        guardId,
        guardName,
        organizationId
      });
      
      // Buscar si ya existe una sala de chat entre este miembro y guardia
      const chatRoomsRef = collection(db, 'chatRooms');
      const q = query(
        chatRoomsRef,
        where('memberId', '==', memberId),
        where('guardId', '==', guardId),
        where('organizationId', '==', organizationId)
      );

      console.log('🔍 [CHAT-DEBUG] Buscando chat room existente...');
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Retornar la sala existente
        const existingRoomId = querySnapshot.docs[0].id;
        console.log('🔍 [CHAT-DEBUG] Chat room existente encontrado:', existingRoomId);
        return existingRoomId;
      } else {
        // Crear nueva sala de chat
        console.log('🔍 [CHAT-DEBUG] Creando nueva sala de chat...');
        const newChatRoom: Omit<ChatRoom, 'id'> = {
          memberId,
          memberName,
          guardId,
          guardName,
          organizationId,
          unreadCount: 0,
          createdAt: serverTimestamp() as Timestamp,
          updatedAt: serverTimestamp() as Timestamp,
        };

        const docRef = await addDoc(chatRoomsRef, newChatRoom);
        console.log('🔍 [CHAT-DEBUG] Nueva sala de chat creada con ID:', docRef.id);
        return docRef.id;
      }
    } catch (error) {
      console.error('❌ Error getting/creating chat room:', error);
      throw error;
    }
  }

  // Obtener todas las salas de chat para un miembro
  async getMemberChatRooms(memberId: string, organizationId: string): Promise<ChatRoom[]> {
    try {
      const chatRoomsRef = collection(db, 'chatRooms');
      // Ahora con índices creados, podemos usar orderBy en tiempo real
      const q = query(
        chatRoomsRef,
        where('memberId', '==', memberId),
        where('organizationId', '==', organizationId),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const chatRooms: ChatRoom[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        chatRooms.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
        } as ChatRoom);
      });
      
      return chatRooms;
    } catch (error) {
      console.error('Error getting member chat rooms:', error);
      return [];
    }
  }

  // Obtener todas las salas de chat para un guardia
  async getGuardChatRooms(guardId: string, organizationId: string): Promise<ChatRoom[]> {
    try {
      const chatRoomsRef = collection(db, 'chatRooms');
      // Ahora con índices creados, podemos usar orderBy en tiempo real
      const q = query(
        chatRoomsRef,
        where('guardId', '==', guardId),
        where('organizationId', '==', organizationId),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const chatRooms: ChatRoom[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        chatRooms.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
        } as ChatRoom);
      });
      
      return chatRooms;
    } catch (error) {
      console.error('Error getting guard chat rooms:', error);
      return [];
    }
  }

  // Suscribirse a las salas de chat de un miembro
  subscribeToMemberChatRooms(
    memberId: string, 
    organizationId: string, 
    callback: (chatRooms: ChatRoom[]) => void
  ): () => void {
    try {
      const chatRoomsRef = collection(db, 'chatRooms');
      const q = query(
        chatRoomsRef,
        where('memberId', '==', memberId),
        where('organizationId', '==', organizationId),
        orderBy('updatedAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const chatRooms: ChatRoom[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          chatRooms.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
          } as ChatRoom);
        });
        callback(chatRooms);
      });

      this.unsubscribeFunctions.push(unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to member chat rooms:', error);
      return () => {};
    }
  }

  // Suscribirse a las salas de chat de un guardia
  subscribeToGuardChatRooms(
    guardId: string, 
    organizationId: string, 
    callback: (chatRooms: ChatRoom[]) => void
  ): () => void {
    try {
      const chatRoomsRef = collection(db, 'chatRooms');
      const q = query(
        chatRoomsRef,
        where('guardId', '==', guardId),
        where('organizationId', '==', organizationId),
        orderBy('updatedAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const chatRooms: ChatRoom[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          chatRooms.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
          } as ChatRoom);
        });
        callback(chatRooms);
      });

      this.unsubscribeFunctions.push(unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to guard chat rooms:', error);
      return () => {};
    }
  }

  // Suscribirse a los mensajes de una sala de chat
  subscribeToMessages(
    chatRoomId: string, 
    callback: (messages: ChatMessage[]) => void
  ): () => void {
    try {
      console.log('🔍 [CHAT-DEBUG] Iniciando suscripción a mensajes para chatRoom:', chatRoomId);
      
      const messagesRef = collection(db, 'chatMessages');
      const q = query(
        messagesRef,
        where('chatRoomId', '==', chatRoomId),
        orderBy('timestamp', 'asc')
      );

      console.log('🔍 [CHAT-DEBUG] Query creada para mensajes, escuchando cambios...');

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        console.log('🔍 [CHAT-DEBUG] Cambio detectado en mensajes, documentos:', querySnapshot.size);
        
        const messages: ChatMessage[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('🔍 [CHAT-DEBUG] Mensaje encontrado:', {
            id: doc.id,
            text: data.text,
            senderId: data.senderId,
            senderName: data.senderName,
            senderType: data.senderType,
            timestamp: data.timestamp,
            chatRoomId: data.chatRoomId
          });
          
          messages.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date(),
          } as ChatMessage);
        });
        
        console.log('🔍 [CHAT-DEBUG] Total mensajes procesados:', messages.length);
        callback(messages);
      }, (error) => {
        console.error('❌ Error en suscripción a mensajes:', error);
      });

      this.unsubscribeFunctions.push(unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('❌ Error subscribing to messages:', error);
      return () => {};
    }
  }

  // Enviar un mensaje
  async sendMessage(
    chatRoomId: string,
    text: string,
    senderId: string,
    senderName: string,
    senderType: 'member' | 'guard',
    organizationId: string
  ): Promise<void> {
    try {
      console.log('🔍 [CHAT-DEBUG] Enviando mensaje:', {
        chatRoomId,
        text,
        senderId,
        senderName,
        senderType,
        organizationId
      });
      
      const messagesRef = collection(db, 'chatMessages');
      const newMessage: Omit<ChatMessage, 'id'> = {
        text,
        senderId,
        senderName,
        senderType,
        timestamp: serverTimestamp() as Timestamp,
        isRead: false,
        organizationId,
        chatRoomId,
      };

      console.log('🔍 [CHAT-DEBUG] Mensaje creado, guardando en Firestore...');
      const docRef = await addDoc(messagesRef, newMessage);
      console.log('🔍 [CHAT-DEBUG] Mensaje guardado con ID:', docRef.id);

      // Actualizar la sala de chat con el último mensaje
      const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
      await updateDoc(chatRoomRef, {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        lastSenderType: senderType,
        updatedAt: serverTimestamp(),
        unreadCount: senderType === 'member' ? 0 : 1, // Resetear contador si envía el miembro
      });
      
      console.log('🔍 [CHAT-DEBUG] Sala de chat actualizada');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  }

  // Marcar mensajes como leídos
  async markMessagesAsRead(chatRoomId: string, readerId: string): Promise<void> {
    try {
      const messagesRef = collection(db, 'chatMessages');
      const q = query(
        messagesRef,
        where('chatRoomId', '==', chatRoomId),
        where('senderId', '!=', readerId),
        where('isRead', '==', false)
      );

      const querySnapshot = await getDocs(q);
      const updatePromises = querySnapshot.docs.map(doc => 
        updateDoc(doc.ref, { isRead: true })
      );

      await Promise.all(updatePromises);

      // Actualizar contador de no leídos en la sala
      const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
      await updateDoc(chatRoomRef, {
        unreadCount: 0,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  /**
   * Elimina un chat room y todos sus mensajes
   */
  async deleteChatRoom(chatRoomId: string): Promise<void> {
    try {
      console.log('🗑️ [CHAT] Eliminando chat room:', chatRoomId);
      
      // Primero eliminar todos los mensajes del chat
      const messagesQuery = query(
        collection(db, 'chatMessages'),
        where('chatRoomId', '==', chatRoomId)
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      const deletePromises = messagesSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletePromises);
      console.log('🗑️ [CHAT] Mensajes eliminados:', messagesSnapshot.size);
      
      // Luego eliminar el chat room
      const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
      await deleteDoc(chatRoomRef);
      
      console.log('✅ [CHAT] Chat room eliminado exitosamente');
      
      // Limpiar cache local
      this.messageCache.delete(chatRoomId);
      
    } catch (error) {
      console.error('❌ [CHAT] Error eliminando chat room:', error);
      throw new Error('No se pudo eliminar el chat');
    }
  }

  /**
   * Elimina todos los chats de un usuario específico
   */
  async deleteAllChatsForUser(userId: string, userType: 'member' | 'guard'): Promise<void> {
    try {
      console.log('🗑️ [CHAT] Eliminando todos los chats para usuario:', userId, userType);
      
      const fieldName = userType === 'member' ? 'memberId' : 'guardId';
      const chatRoomsQuery = query(
        collection(db, 'chatRooms'),
        where(fieldName, '==', userId)
      );
      
      const chatRoomsSnapshot = await getDocs(chatRoomsQuery);
      console.log('🗑️ [CHAT] Chat rooms encontrados para eliminar:', chatRoomsSnapshot.size);
      
      // Eliminar cada chat room y sus mensajes
      for (const chatRoomDoc of chatRoomsSnapshot.docs) {
        await this.deleteChatRoom(chatRoomDoc.id);
      }
      
      console.log('✅ [CHAT] Todos los chats eliminados exitosamente');
      
    } catch (error) {
      console.error('❌ [CHAT] Error eliminando todos los chats:', error);
      throw new Error('No se pudieron eliminar todos los chats');
    }
  }

  /**
   * Elimina mensajes específicos de un chat
   */
  async deleteMessages(chatRoomId: string, messageIds: string[]): Promise<void> {
    try {
      console.log('🗑️ [CHAT] Eliminando mensajes:', messageIds.length, 'del chat:', chatRoomId);
      
      const deletePromises = messageIds.map(messageId => {
        const messageRef = doc(db, 'chatMessages', messageId);
        return deleteDoc(messageRef);
      });
      
      await Promise.all(deletePromises);
      
      console.log('✅ [CHAT] Mensajes eliminados exitosamente');
      
      // Limpiar cache local
      this.messageCache.delete(chatRoomId);
      
    } catch (error) {
      console.error('❌ [CHAT] Error eliminando mensajes:', error);
      throw new Error('No se pudieron eliminar los mensajes');
    }
  }

  /**
   * Limpia todos los mensajes de un chat (mantiene el chat room)
   */
  async clearChatMessages(chatRoomId: string): Promise<void> {
    try {
      console.log('🗑️ [CHAT] Limpiando todos los mensajes del chat:', chatRoomId);
      
      const messagesQuery = query(
        collection(db, 'chatMessages'),
        where('chatRoomId', '==', chatRoomId)
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      const deletePromises = messagesSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletePromises);
      
      // Actualizar el chat room para indicar que no hay mensajes
      const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
      await updateDoc(chatRoomRef, {
        lastMessage: null,
        lastMessageTime: null,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ [CHAT] Mensajes del chat limpiados exitosamente');
      
      // Limpiar cache local
      this.messageCache.delete(chatRoomId);
      
    } catch (error) {
      console.error('❌ [CHAT] Error limpiando mensajes del chat:', error);
      throw new Error('No se pudieron limpiar los mensajes del chat');
    }
  }

  // Limpiar todas las suscripciones
  cleanup(): void {
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions = [];
  }
}

export const chatService = new ChatService();
