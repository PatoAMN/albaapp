import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { useAuth } from '../utils/authContext';
import { Announcement } from '../types';
import { collection, query, where, orderBy, getDocs, onSnapshot, doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';

const { width } = Dimensions.get('window');

export const AnnouncementsScreen: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnnouncements();
    
    // Set up real-time listener
    const unsubscribe = setupRealtimeListener();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user || !user.organizationId) {
        setError('No se pudo obtener la organización del usuario');
        return;
      }

      // Query announcements for the user's organization
      const announcementsRef = collection(db, 'announcements');
      const q = query(
        announcementsRef,
        where('organizationId', '==', user.organizationId),
        where('status', '==', 'published'),
        where('isActive', '==', true),
        orderBy('publishedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const announcementsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        publishedAt: doc.data().publishedAt?.toDate() || new Date(),
        expiresAt: doc.data().expiresAt?.toDate() || null,
      })) as Announcement[];

      // Filter out expired announcements
      const now = new Date();
      const activeAnnouncements = announcementsData.filter(announcement => 
        !announcement.expiresAt || announcement.expiresAt > now
      );

      setAnnouncements(activeAnnouncements);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError('Error al cargar avisos');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeListener = () => {
    if (!user || !user.organizationId) return null;

    const announcementsRef = collection(db, 'announcements');
    const q = query(
      announcementsRef,
      where('organizationId', '==', user.organizationId),
      where('status', '==', 'published'),
      where('isActive', '==', true),
      orderBy('publishedAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const announcementsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        publishedAt: doc.data().publishedAt?.toDate() || new Date(),
        expiresAt: doc.data().expiresAt?.toDate() || null,
      })) as Announcement[];

      // Filter out expired announcements
      const now = new Date();
      const activeAnnouncements = announcementsData.filter(announcement => 
        !announcement.expiresAt || announcement.expiresAt > now
      );

      setAnnouncements(activeAnnouncements);
      setLoading(false);
    }, (err) => {
      console.error('Error in real-time listener:', err);
      setError('Error al cargar avisos en tiempo real');
      setLoading(false);
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnnouncements();
    setRefreshing(false);
  };

  const markAsRead = async (announcement: Announcement) => {
    try {
      if (!user || announcement.readBy?.includes(user.id)) return;

      const announcementRef = doc(db, 'announcements', announcement.id);
      await updateDoc(announcementRef, {
        readBy: arrayUnion(user.id),
        views: (announcement.views || 0) + 1,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking announcement as read:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'general': return '📢';
      case 'security': return '🛡️';
      case 'maintenance': return '🔧';
      case 'event': return '🎉';
      case 'emergency': return '🚨';
      default: return '📢';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'general': return '#3B82F6';
      case 'security': return '#EF4444';
      case 'maintenance': return '#F59E0B';
      case 'event': return '#10B981';
      case 'emergency': return '#DC2626';
      default: return '#3B82F6';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#DC2626';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#6B7280';
      default: return '#3B82F6';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isRead = (announcement: Announcement) => {
    return user && announcement.readBy?.includes(user.id);
  };

  if (loading && announcements.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>Cargando avisos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Error al cargar avisos</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAnnouncements}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📢 Avisos y Comunicaciones</Text>
        <Text style={styles.headerSubtitle}>
          Mantente informado sobre las últimas noticias de tu comunidad
        </Text>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {announcements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No hay avisos disponibles</Text>
            <Text style={styles.emptyMessage}>
              No hay avisos nuevos en este momento. Los avisos aparecerán aquí cuando estén disponibles.
            </Text>
          </View>
        ) : (
          announcements.map((announcement) => (
            <TouchableOpacity
              key={announcement.id}
              style={[
                styles.announcementCard,
                !isRead(announcement) && styles.unreadCard
              ]}
              onPress={() => markAsRead(announcement)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={styles.typeContainer}>
                  <Text style={styles.typeIcon}>{getTypeIcon(announcement.type)}</Text>
                  <View style={styles.typeInfo}>
                    <Text style={[styles.typeText, { color: getTypeColor(announcement.type) }]}>
                      {announcement.type === 'general' ? 'General' :
                       announcement.type === 'security' ? 'Seguridad' :
                       announcement.type === 'maintenance' ? 'Mantenimiento' :
                       announcement.type === 'event' ? 'Evento' : 'Emergencia'}
                    </Text>
                    <View style={styles.priorityContainer}>
                      <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(announcement.priority) }]} />
                      <Text style={[styles.priorityText, { color: getPriorityColor(announcement.priority) }]}>
                        {announcement.priority === 'urgent' ? 'Urgente' :
                         announcement.priority === 'high' ? 'Alta' :
                         announcement.priority === 'medium' ? 'Media' : 'Baja'}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.dateContainer}>
                  <Text style={styles.dateText}>
                    {formatDate(announcement.publishedAt || announcement.createdAt)}
                  </Text>
                  {!isRead(announcement) && (
                    <View style={styles.unreadIndicator} />
                  )}
                </View>
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.announcementTitle}>{announcement.title}</Text>
                <Text style={styles.announcementContent} numberOfLines={3}>
                  {announcement.content}
                </Text>
              </View>

              {announcement.tags && announcement.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {announcement.tags.slice(0, 3).map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                  ))}
                  {announcement.tags.length > 3 && (
                    <Text style={styles.moreTagsText}>+{announcement.tags.length - 3} más</Text>
                  )}
                </View>
              )}

              <View style={styles.cardFooter}>
                <View style={styles.statsContainer}>
                  {announcement.views && announcement.views > 0 && (
                    <Text style={styles.statsText}>👁️ {announcement.views} vistas</Text>
                  )}
                  {announcement.expiresAt && (
                    <Text style={styles.expiryText}>
                      Expira: {announcement.expiresAt.toLocaleDateString()}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#667eea',
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderWidth: 4,
    borderColor: '#667eea',
    borderTopColor: 'transparent',
    borderRadius: 20,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  announcementCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  unreadCard: {
    borderLeftColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  typeInfo: {
    flex: 1,
  },
  typeText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dateContainer: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  cardContent: {
    marginBottom: 12,
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 24,
  },
  announcementContent: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    alignSelf: 'center',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 12,
    color: '#6b7280',
  },
  expiryText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
  },
});
