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
import { Member, Guard } from '../types';
import { chatService, ChatMessage, ChatRoom } from '../utils/chatService';

const { width, height } = Dimensions.get('window');

interface ChatScreenProps {
  onGoBack?: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ onGoBack }) => {
  const { user, organization } = useAuth();
  const member = user as Member;
  const [guards, setGuards] = useState<Guard[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedChatRoom, setSelectedChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showChatList, setShowChatList] = useState(true);
  const [showGuardsList, setShowGuardsList] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!member || !organization) return;
    loadGuards();
    loadChatRooms();
  }, [member, organization]);

  const loadGuards = async () => {
    if (!organization?.id) return;
    try {
      const orgGuards = await chatService.getGuardsByOrganization(organization.id);
      setGuards(orgGuards);
    } catch (error) {
      console.error('❌ Error loading guards:', error);
    }
  };

  const loadChatRooms = async () => {
    if (!member?.id || !organization?.id) return;
    try {
      const rooms = await chatService.getMemberChatRooms(member.id, organization.id);
      setChatRooms(rooms);
      setLoading(false);
    } catch (error) {
      console.error('Error loading chat rooms:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChatRoom) {
      // Limpiar mensajes anteriores ANTES de suscribirse
      setMessages([]);
      
      const unsubscribe = chatService.subscribeToMessages(
        selectedChatRoom.id,
        (newMessages) => {
          setMessages(newMessages);
        }
      );
      
      return unsubscribe;
    }
  }, [selectedChatRoom?.id]);

  const startNewChat = async (guard: Guard) => {
    if (!member || !organization) return;
    
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
      setShowGuardsList(false);
    } catch (error) {
      console.error('Error starting new chat:', error);
      Alert.alert('Error', 'No se pudo iniciar el chat');
    }
  };

  const selectChatRoom = (chatRoom: ChatRoom) => {
    setSelectedChatRoom(chatRoom);
    setShowChatList(false);
    setShowGuardsList(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChatRoom || !member || !organization) return;

    try {
      await chatService.sendMessage(
        selectedChatRoom.id,
        newMessage.trim(),
        member.id,
        member.name,
        'member',
        organization.id
      );
      setNewMessage('');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      Alert.alert('Error', 'No se pudo enviar el mensaje');
    }
  };

  const deleteChat = async () => {
    if (!selectedChatRoom) return;
    
    Alert.alert(
      'Eliminar Chat',
      `¿Estás seguro de que quieres eliminar este chat con ${selectedChatRoom.guardName}? Esta acción no se puede deshacer.`,
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
    setShowGuardsList(false);
  };

  const goBackToGuardsList = () => {
    setShowGuardsList(true);
    setShowChatList(false);
  };

  const renderGuardItem = ({ item }: { item: Guard }) => (
    <TouchableOpacity
      style={styles.guardItem}
      onPress={() => startNewChat(item)}
      activeOpacity={0.7}
    >
      <View style={styles.guardAvatar}>
        <Ionicons name="shield" size={24} color="#ffffff" />
      </View>
      <View style={styles.guardInfo}>
        <Text style={styles.guardName}>{item.name}</Text>
        <Text style={styles.guardDetails}>
          {item.badgeNumber} • Guardia de Seguridad
        </Text>
      </View>
      <Ionicons name="chatbubble-outline" size={20} color="#00ff64" />
    </TouchableOpacity>
  );

  const renderChatRoomItem = ({ item }: { item: ChatRoom }) => (
    <TouchableOpacity
      style={styles.chatRoomItem}
      onPress={() => selectChatRoom(item)}
      activeOpacity={0.7}
    >
      <View style={styles.chatRoomAvatar}>
        <Ionicons name="shield" size={24} color="#ffffff" />
      </View>
      <View style={styles.chatRoomInfo}>
        <Text style={styles.chatRoomName}>{item.guardName}</Text>
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
    const isMember = item.senderType === 'member';
    return (
      <View style={[
        styles.messageContainer,
        isMember ? styles.memberMessage : styles.guardMessage
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
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onGoBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#64B5F6" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Ionicons name="chatbubbles" size={32} color="#64B5F6" />
          <Text style={styles.headerTitle}>Chat con Seguridad</Text>
        </View>
        
        <View style={styles.headerRight} />
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, showChatList && styles.activeTab]}
          onPress={() => {
            setShowChatList(true);
            setShowGuardsList(false);
            setSelectedChatRoom(null);
          }}
        >
          <Text style={[styles.tabText, showChatList && styles.activeTabText]}>
            Chats ({chatRooms.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, showGuardsList && styles.activeTab]}
          onPress={() => {
            setShowGuardsList(true);
            setShowChatList(false);
            setSelectedChatRoom(null);
          }}
        >
          <Text style={[styles.tabText, showGuardsList && styles.activeTabText]}>
            Guardias ({guards.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chat List */}
      {showChatList && (
        <View style={styles.chatListContainer}>
          {chatRooms.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No hay chats activos</Text>
              <Text style={styles.emptyStateSubtext}>
                Selecciona "Guardias" para iniciar un chat
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

      {/* Guards List */}
      {showGuardsList && (
        <View style={styles.guardsListContainer}>
          <FlatList
            data={guards}
            renderItem={renderGuardItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* Chat Room */}
      {selectedChatRoom && (
        <KeyboardAvoidingView 
          style={styles.chatRoomContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <TouchableOpacity
              style={styles.chatBackButton}
              onPress={goBackToChatList}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color="#64B5F6" />
            </TouchableOpacity>
            
            <View style={styles.chatHeaderInfo}>
              <Text style={styles.chatHeaderName}>{selectedChatRoom.guardName}</Text>
              <Text style={styles.chatHeaderStatus}>Guardia de Seguridad</Text>
            </View>

            {/* Chat Actions Menu */}
            <View style={styles.chatActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={clearChatMessages}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={deleteChat}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle-outline" size={20} color="#ff4757" />
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
              flatListRef.current?.scrollToEnd({ animated: true });
            }}
            ListEmptyComponent={() => (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#666', fontSize: 14 }}>
                  No hay mensajes aún
                </Text>
              </View>
            )}
            getItemLayout={(data, index) => ({
              length: 80,
              offset: 80 * index,
              index,
            })}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={10}
            removeClippedSubviews={false}
          />

          {/* Message Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.messageInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Escribe un mensaje..."
              placeholderTextColor="#999"
              multiline
              onFocus={() => {
                // Scroll to bottom when input is focused
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }}
            />
            <TouchableOpacity
              style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!newMessage.trim()}
              activeOpacity={0.7}
            >
              <Ionicons name="send" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f0f8ff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  headerTitle: {
    color: '#333',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
    shadowRadius: 3.84,
    elevation: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#f0f8ff',
    borderWidth: 1,
    borderColor: '#64B5F6',
  },
  tabText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#64B5F6',
    fontWeight: '600',
  },
  chatListContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  guardsListContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  guardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#64B5F6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  guardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  guardInfo: {
    flex: 1,
  },
  guardName: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  guardDetails: {
    color: '#666',
    fontSize: 14,
  },
  chatRoomContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chatBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f0f8ff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 12,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderName: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  chatHeaderStatus: {
    color: '#64B5F6',
    fontSize: 12,
    fontWeight: '500',
  },
  chatActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#ffe0e0',
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  messageContainer: {
    marginBottom: 20,
    maxWidth: '80%',
  },
  memberMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#64B5F6',
    borderRadius: 16,
    padding: 12,
    borderBottomRightRadius: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  guardMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  messageSender: {
    color: '#64B5F6',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    color: '#333',
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  messageTime: {
    color: '#666',
    fontSize: 10,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#ffffff',
    padding: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    maxHeight: 100,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sendButton: {
    backgroundColor: '#64B5F6',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  // Chat room styles
  chatRoomItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#64B5F6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatRoomAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  chatRoomInfo: {
    flex: 1,
  },
  chatRoomName: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  chatRoomLastMessage: {
    color: '#666',
    fontSize: 14,
    marginBottom: 4,
  },
  chatRoomTime: {
    color: '#999',
    fontSize: 12,
  },
  unreadBadge: {
    backgroundColor: '#64B5F6',
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
});
