import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../utils/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../utils/authContext';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  author: string;
  isRead?: boolean;
  organizationId?: string;
  isActive?: boolean;
  readCount?: number;
}

interface AnnouncementsScreenProps {
  onGoBack: () => void;
}

const AnnouncementsScreen: React.FC<AnnouncementsScreenProps> = ({ onGoBack }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, organization } = useAuth();


  useEffect(() => {
    loadAnnouncements();
  }, [user?.organizationId, organization?.id]);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      
      const organizationId = user?.organizationId || organization?.id;
      
      console.log('🔍 Debug - User:', user);
      console.log('🔍 Debug - Organization:', organization);
      console.log('🔍 Debug - Organization ID:', organizationId);
      
      if (!organizationId) {
        console.log('❌ No organization ID available');
        setAnnouncements([]);
        return;
      }

      console.log('🔍 Loading announcements for organization:', organizationId);

      // Query announcements for this organization
      const announcementsRef = collection(db, 'announcements');
      const q = query(
        announcementsRef,
        where('organizationId', '==', organizationId),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      console.log('📊 Firebase query result - Total docs:', snapshot.size);
      
      const announcementsData = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📄 Document data:', { id: doc.id, ...data });
        return {
          id: doc.id,
          title: data.title || '',
          content: data.content || '',
          category: data.category || 'general',
          priority: data.priority || 'medium',
          author: data.author || 'Administrador',
          isRead: data.isRead || false,
          organizationId: data.organizationId || '',
          isActive: data.isActive !== undefined ? data.isActive : true,
          readCount: data.readCount || 0,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        };
      }) as Announcement[];

      // Sort by creation date in JavaScript (newest first)
      const sortedAnnouncements = announcementsData.sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      );

      console.log('📢 Final announcements data:', sortedAnnouncements);
      console.log('📢 Loaded announcements count:', sortedAnnouncements.length);
      setAnnouncements(sortedAnnouncements);
    } catch (error) {
      console.error('❌ Error loading announcements:', error);
      // Set empty array if there's an error
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnnouncements();
    setRefreshing(false);
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      urgent: '#dc2626',
    };
    return colors[priority as keyof typeof colors] || '#64748b';
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      urgent: 'Urgente',
    };
    return labels[priority as keyof typeof labels] || 'Normal';
  };

  const filteredAnnouncements = announcements;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.header}>
          <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Avisos</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Ionicons name="megaphone" size={64} color="#ccc" />
          <Text style={styles.loadingText}>Cargando avisos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Avisos de la Comunidad</Text>
        <View style={styles.placeholder} />
      </View>


      {/* Announcements List */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredAnnouncements.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="megaphone" size={64} color="#ccc" />
            <Text style={styles.emptyStateTitle}>No hay avisos</Text>
            <Text style={styles.emptyStateText}>
              No hay avisos disponibles
            </Text>
          </View>
        ) : (
          <View style={styles.announcementsList}>
            {filteredAnnouncements.map((announcement) => (
              <TouchableOpacity
                key={announcement.id}
                style={[
                  styles.announcementCard,
                  !announcement.isRead && styles.unreadCard
                ]}
              >
                <View style={styles.announcementHeader}>
                  <View style={styles.announcementInfo}>
                    <Text style={styles.announcementTitle} numberOfLines={2}>
                      {announcement.title}
                    </Text>
                    <Text style={styles.announcementContent} numberOfLines={3}>
                      {announcement.content}
                    </Text>
                  </View>
                  <View style={styles.priorityBadge}>
                    <Text style={styles.priorityText}>
                      {getPriorityLabel(announcement.priority)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.announcementFooter}>
                  <View style={styles.metaInfo}>
                    <View style={styles.metaItem}>
                      <Ionicons name="person-outline" size={14} color="#666" />
                      <Text style={styles.metaText}>{announcement.author}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={14} color="#666" />
                      <Text style={styles.metaText}>{formatDate(announcement.createdAt)}</Text>
                    </View>
                  </View>
                  
                  {!announcement.isRead && (
                    <View style={styles.unreadIndicator}>
                      <View style={styles.unreadDot} />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 15,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  announcementsList: {
    paddingBottom: 20,
  },
  announcementCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    backgroundColor: '#f8fafc',
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  announcementInfo: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    lineHeight: 24,
  },
  announcementContent: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  priorityBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  priorityText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 16,
  },
  metaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  unreadIndicator: {
    alignItems: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
});

export default AnnouncementsScreen;
