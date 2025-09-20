import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../utils/authContext';
import { Guard, Member } from '../types';
import { chatService, ChatMessage, ChatRoom } from '../utils/chatService';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

const { width, height } = Dimensions.get('window');

interface GuardChatScreenProps {
  route?: {
    params?: {
      onGoBack?: () => void;
    };
  };
  navigation?: any;
}

export const GuardChatScreen: React.FC<GuardChatScreenProps> = ({ route, navigation: nav }) => {
  const { user, organization } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const guard = user as Guard;
  const [members, setMembers] = useState<Member[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedChatRoom, setSelectedChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showChatList, setShowChatList] = useState(true);
  const [showMembersList, setShowMembersList] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!guard || !organization) return;
    loadMembers();
    loadChatRooms();
  }, [guard, organization]);

  const loadMembers = async () => {
    if (!organization?.id) return;
    try {
      console.log('🔍 [CHAT-DEBUG] Cargando miembros para organización:', organization.id);
      const orgMembers = await chatService.getMembersByOrganization(organization.id);
      console.log('🔍 [CHAT-DEBUG] Miembros cargados:', orgMembers.length);
      console.log('🔍 [CHAT-DEBUG] Detalle de todos los miembros:', orgMembers.map(m => ({
        id: m.id,
        name: m.name,
        organizationId: m.organizationId
      })));
      setMembers(orgMembers);
    } catch (error) {
      console.error('❌ Error loading members:', error);
    }
  };

  const loadChatRooms = async () => {
    if (!guard?.id || !organization?.id) return;
    try {
      const rooms = await chatService.getGuardChatRooms(guard.id, organization.id);
      setChatRooms(rooms);
      setLoading(false);
    } catch (error) {
      console.error('Error loading chat rooms:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChatRoom) {
      console.log('🔍 [CHAT-DEBUG] Suscribiéndose a mensajes para chatRoom:', selectedChatRoom.id);
      
      const unsubscribe = chatService.subscribeToMessages(
        selectedChatRoom.id,
        (newMessages) => {
          console.log('🔍 [CHAT-DEBUG] Mensajes recibidos en GuardChatScreen:', newMessages.length);
          console.log('🔍 [CHAT-DEBUG] Detalle de mensajes:', newMessages.map(m => ({
            id: m.id,
            text: m.text,
            senderName: m.senderName,
            senderType: m.senderType,
            timestamp: m.timestamp
          })));
          setMessages(newMessages);
        }
      );
      
      // Limpiar mensajes anteriores al cambiar de chat
      setMessages([]);
      
      return unsubscribe;
    }
  }, [selectedChatRoom?.id]); // Cambiar a selectedChatRoom?.id para detectar cambios

  const startNewChat = async (member: Member) => {
    if (!guard || !organization) return;
    
    try {
      const roomId = await chatService.getOrCreateChatRoom(
        member.id,
        member.name,
        guard.id,
        guard.name,
        organization.id
      );

      const newChatRoom = chatRooms.find(room => room.id === roomId) || {
        id: roomId,
        memberId: member.id,
        memberName: member.name,
        guardId: guard.id,
        guardName: guard.name,
        organizationId: organization.id,
        unreadCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setSelectedChatRoom(newChatRoom);
      setShowChatList(false);
      setShowMembersList(false);
    } catch (error) {
      console.error('Error starting new chat:', error);
      Alert.alert('Error', 'No se pudo iniciar el chat');
    }
  };

  const selectChatRoom = (chatRoom: ChatRoom) => {
    console.log('🔍 [CHAT-DEBUG] Chat room seleccionado en GuardChatScreen:', {
      id: chatRoom.id,
      memberId: chatRoom.memberId,
      memberName: chatRoom.memberName,
      guardId: chatRoom.guardId,
      guardName: chatRoom.guardName,
      organizationId: chatRoom.organizationId
    });
    
    setSelectedChatRoom(chatRoom);
    setShowChatList(false);
    setShowMembersList(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChatRoom || !guard || !organization) return;

    try {
      await chatService.sendMessage(
        selectedChatRoom.id,
        newMessage.trim(),
        guard.id,
        guard.name,
        'guard',
        organization.id
      );
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'No se pudo enviar el mensaje');
    }
  };

  const deleteChat = async () => {
    if (!selectedChatRoom) return;
    
    Alert.alert(
      'Eliminar Chat',
      `¿Estás seguro de que quieres eliminar este chat con ${selectedChatRoom.memberName}? Esta acción no se puede deshacer.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await chatService.deleteChatRoom(selectedChatRoom.id);
              Alert.alert('Éxito', 'Chat eliminado correctamente');
              goBackToChatList();
              // Recargar la lista de chats
              loadChatRooms();
            } catch (error) {
              console.error('❌ Error deleting chat:', error);
              Alert.alert('Error', 'No se pudo eliminar el chat');
            }
          },
        },
      ]
    );
  };

  const clearChatMessages = async () => {
    if (!selectedChatRoom) return;
    
    Alert.alert(
      'Limpiar Mensajes',
      '¿Estás seguro de que quieres eliminar todos los mensajes de este chat? Esta acción no se puede deshacer.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            try {
              await chatService.clearChatMessages(selectedChatRoom.id);
              Alert.alert('Éxito', 'Mensajes eliminados correctamente');
              // Los mensajes se actualizarán automáticamente por la suscripción
            } catch (error) {
              console.error('❌ Error clearing messages:', error);
              Alert.alert('Error', 'No se pudieron eliminar los mensajes');
            }
          },
        },
      ]
    );
  };

  const goBackToChatList = () => {
    setSelectedChatRoom(null);
    setMessages([]);
    setShowChatList(true);
    setShowMembersList(false);
  };

  const goBackToMembersList = () => {
    setShowMembersList(true);
    setShowChatList(false);
  };

  // Función para manejar el botón de regreso
  const handleGoBack = () => {
    console.log('🔍 [CHAT-DEBUG] Botón de regreso presionado');
    const onGoBack = route?.params?.onGoBack;
    console.log('🔍 [CHAT-DEBUG] onGoBack function:', !!onGoBack);
    
    if (onGoBack) {
      console.log('🔍 [CHAT-DEBUG] Ejecutando función onGoBack personalizada');
      onGoBack();
    } else {
      console.log('🔍 [CHAT-DEBUG] Usando navigation.goBack() como respaldo');
      // Navegar de vuelta al portal de guardias si no hay función onGoBack
      navigation.goBack();
    }
  };

  const renderMemberItem = ({ item }: { item: Member }) => (
    <TouchableOpacity
      style={styles.memberItem}
      onPress={() => startNewChat(item)}
      activeOpacity={0.7}
    >
      <View style={styles.memberAvatar}>
        <Ionicons name="person" size={24} color="#4CAF50" />
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name}</Text>
        <Text style={styles.memberDetails}>
          {item.homeNumber} • {item.memberType}
        </Text>
      </View>
      <Ionicons name="chatbubble-outline" size={20} color="#4CAF50" />
    </TouchableOpacity>
  );

  const renderChatRoomItem = ({ item }: { item: ChatRoom }) => (
    <TouchableOpacity
      style={styles.chatRoomItem}
      onPress={() => selectChatRoom(item)}
      activeOpacity={0.7}
    >
      <View style={styles.chatRoomAvatar}>
        <Ionicons name="person" size={24} color="#4CAF50" />
      </View>
      <View style={styles.chatRoomInfo}>
        <Text style={styles.chatRoomName}>{item.memberName}</Text>
        <Text style={styles.chatRoomLastMessage} numberOfLines={1}>
          {item.lastMessage || 'Sin mensajes'}
        </Text>
        <Text style={styles.chatRoomTime}>
          {item.lastMessageTime ? 
            (item.lastMessageTime instanceof Date ? 
              item.lastMessageTime.toLocaleDateString('es-MX') :
              item.lastMessageTime.toDate().toLocaleDateString('es-MX')
            ) : 
            'Nunca'
          }
        </Text>
      </View>
      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCount}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isGuard = item.senderType === 'guard';
    return (
      <View style={[
        styles.messageContainer,
        isGuard ? styles.guardMessage : styles.memberMessage
      ]}>
        <Text style={styles.messageSender}>{item.senderName}</Text>
        <Text style={styles.messageText}>{item.text}</Text>
        <Text style={styles.messageTime}>
          {(item.timestamp instanceof Date ? 
            item.timestamp.toLocaleTimeString('es-MX', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }) :
            item.timestamp.toDate().toLocaleTimeString('es-MX', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          )}
        </Text>
      </View>
    );
  };

  // Debug: mostrar estado actual de mensajes
  console.log('🔍 [CHAT-DEBUG] Estado actual de mensajes en GuardChatScreen:', messages.length);
  if (messages.length > 0) {
    console.log('🔍 [CHAT-DEBUG] Primer mensaje:', {
      id: messages[0].id,
      text: messages[0].text,
      senderName: messages[0].senderName,
      senderType: messages[0].senderType
    });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando chats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header Minimalista */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            activeOpacity={0.5}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#4CAF50" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.headerCenter}>
          <View style={styles.logoContainer}>
            <Ionicons name="chatbubbles" size={24} color="#4CAF50" />
          </View>
          <Text style={styles.appTitle}>SafeGate</Text>
          <Text style={styles.appSubtitle}>Chat con Miembros</Text>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={22} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, showChatList && styles.activeTab]}
          onPress={() => {
            setShowChatList(true);
            setShowMembersList(false);
            setSelectedChatRoom(null);
          }}
        >
          <Text style={[styles.tabText, showChatList && styles.activeTabText]}>
            Chats ({chatRooms.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, showMembersList && styles.activeTab]}
          onPress={() => {
            setShowMembersList(true);
            setShowChatList(false);
            setSelectedChatRoom(null);
          }}
        >
          <Text style={[styles.tabText, showMembersList && styles.activeTabText]}>
            Miembros ({members.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chat List */}
      {showChatList && (
        <View style={styles.chatListContainer}>
          {chatRooms.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color="#6c757d" />
              <Text style={styles.emptyStateText}>No hay chats activos</Text>
              <Text style={styles.emptyStateSubtext}>
                Selecciona "Miembros" para iniciar un chat
              </Text>
            </View>
          ) : (
            <FlatList
              data={chatRooms}
              renderItem={renderChatRoomItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}

      {/* Members List */}
      {showMembersList && (
        <View style={styles.membersListContainer}>
          <FlatList
            data={members}
            renderItem={renderMemberItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* Chat Room */}
      {selectedChatRoom && (
        <View style={styles.chatRoomContainer}>
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <TouchableOpacity
              style={styles.chatBackButton}
              onPress={goBackToChatList}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color="#666" />
            </TouchableOpacity>
            
            <View style={styles.chatHeaderInfo}>
              <Text style={styles.chatHeaderName}>{selectedChatRoom.memberName}</Text>
              <Text style={styles.chatHeaderStatus}>Miembro</Text>
            </View>

            {/* Chat Actions Menu */}
            <View style={styles.chatActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={clearChatMessages}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={20} color="#dc3545" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={deleteChat}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle-outline" size={20} color="#dc3545" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id || Math.random().toString()}
            style={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              console.log('🔍 [CHAT-DEBUG] GuardChatScreen FlatList onContentSizeChange, mensajes:', messages.length);
              flatListRef.current?.scrollToEnd();
            }}
            ListEmptyComponent={() => {
              console.log('🔍 [CHAT-DEBUG] GuardChatScreen FlatList ListEmptyComponent, mensajes:', messages.length);
              return (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#999', fontSize: 14 }}>
                    No hay mensajes aún
                  </Text>
                </View>
              );
            }}
            onLayout={() => {
              console.log('🔍 [CHAT-DEBUG] GuardChatScreen FlatList onLayout ejecutado, mensajes:', messages.length);
            }}
            getItemLayout={(data, index) => ({
              length: 80, // altura estimada de cada mensaje
              offset: 80 * index,
              index,
            })}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={10}
            removeClippedSubviews={false}
          />

          {/* Message Input */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.inputContainer}
          >
            <TextInput
              style={styles.messageInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Escribe un mensaje..."
              placeholderTextColor="#999"
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!newMessage.trim()}
              activeOpacity={0.7}
            >
              <Ionicons name="send" size={20} color="#ffffff" />
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#2c3e50',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#f0f8ff',
    borderWidth: 1,
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 4,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 11,
    color: '#6c757d',
    fontWeight: '500',
    marginTop: 1,
    letterSpacing: 0.3,
  },
  notificationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#f0f8ff',
  },
  tabText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  chatListContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  membersListContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    color: '#2c3e50',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyStateSubtext: {
    color: '#6c757d',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: '#2c3e50',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  memberDetails: {
    color: '#6c757d',
    fontSize: 14,
  },
  chatRoomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chatRoomAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  chatRoomInfo: {
    flex: 1,
  },
  chatRoomName: {
    color: '#2c3e50',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  chatRoomLastMessage: {
    color: '#6c757d',
    fontSize: 14,
    marginBottom: 4,
  },
  chatRoomTime: {
    color: '#999',
    fontSize: 12,
  },
  unreadBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  chatRoomContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chatBackButton: {
    padding: 8,
    marginRight: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderName: {
    color: '#2c3e50',
    fontSize: 16,
    fontWeight: '600',
  },
  chatHeaderStatus: {
    color: '#4CAF50',
    fontSize: 12,
  },
  chatActions: {
    flexDirection: 'row',
    gap: 12,
    marginLeft: 12,
  },
  actionButton: {
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100, // Aumentar padding bottom para evitar superposición
  },
  messageContainer: {
    marginVertical: 8,
    maxWidth: '80%',
  },
  guardMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#e8f5e8',
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 16,
    padding: 12,
    borderBottomRightRadius: 4,
  },
  memberMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 16,
    padding: 12,
    borderBottomLeftRadius: 4,
  },
  messageSender: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    color: '#2c3e50',
    fontSize: 14,
    marginBottom: 4,
  },
  messageTime: {
    color: '#6c757d',
    fontSize: 10,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    color: '#2c3e50',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
});
