import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../utils/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useAuth } from '../utils/authContext';

interface FeatureCard {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  badge?: number;
  action?: string;
}

interface PrincipalScreenProps {
  onCardPress?: (card: FeatureCard) => void;
}

const PrincipalScreen: React.FC<PrincipalScreenProps> = ({ onCardPress }) => {
  const [announcementsCount, setAnnouncementsCount] = useState<number>(0);
  const { user, organization } = useAuth();

  useEffect(() => {
    loadAnnouncementsCount();
  }, [user?.organizationId, organization?.id]);

  const loadAnnouncementsCount = async () => {
    try {
      const organizationId = user?.organizationId || organization?.id;
      
      if (!organizationId) {
        setAnnouncementsCount(0);
        return;
      }

      // Query announcements for this organization
      const announcementsRef = collection(db, 'announcements');
      const q = query(
        announcementsRef,
        where('organizationId', '==', organizationId),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      setAnnouncementsCount(snapshot.size);
    } catch (error) {
      console.error('Error loading announcements count:', error);
      setAnnouncementsCount(0);
    }
  };

  const featureCards: FeatureCard[] = [
    {
      id: '1',
      title: 'PERFIL',
      icon: 'person',
      color: '#4CAF50',
      action: 'navigate_to_profile',
    },
    {
      id: '2',
      title: 'CHAT CON SEGURIDAD',
      icon: 'chatbubbles',
      color: '#FFD700',
      action: 'navigate_to_chat',
    },
    {
      id: '3',
      title: 'AVISOS',
      icon: 'mail',
      color: '#FF9800',
      badge: announcementsCount > 0 ? announcementsCount : undefined,
      action: 'navigate_to_announcements',
    },
    {
      id: '4',
      title: 'PASES DE VISITA',
      icon: 'qr-code',
      color: '#2196F3',
      action: 'navigate_to_guests',
    },
    {
      id: '5',
      title: 'EMERGENCIA',
      icon: 'warning',
      color: '#FF5722',
      action: 'navigate_to_emergency',
    },
    {
      id: '6',
      title: 'PASE PERSONAL',
      icon: 'id-card',
      color: '#8D6E63',
      action: 'navigate_to_home',
    },
    {
      id: '7',
      title: 'INCIDENCIAS',
      icon: 'warning',
      color: '#9C27B0',
      action: 'navigate_to_incidents',
    },
    {
      id: '8',
      title: 'COMUNIDAD',
      icon: 'people',
      color: '#607D8B',
    },
  ];

  const handleCardPress = (card: FeatureCard) => {
    if (onCardPress) {
      onCardPress(card);
    } else {
      console.log(`Pressed: ${card.title}`);
    }
  };

  const renderFeatureCard = (card: FeatureCard) => (
    <TouchableOpacity
      key={card.id}
      style={[styles.featureCard, { borderLeftColor: card.color }]}
      onPress={() => handleCardPress(card)}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Ionicons name={card.icon} size={24} color={card.color} />
          {card.badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{card.badge}</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardTitle}>{card.title}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="home" size={24} color="#64B5F6" />
          </View>
        </View>
        <View style={styles.centerSection}>
          <View style={styles.mainLogo}>
            <Ionicons name="home" size={32} color="#64B5F6" />
          </View>
          <Text style={styles.welcomeText}>BIENVENIDO</Text>
          <Text style={styles.subtitleText}>
            Bienvenido a tu portal de acceso a la comunidad.
          </Text>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="menu" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Feature Cards Grid */}
        <View style={styles.gridContainer}>
          {featureCards.map(renderFeatureCard)}
        </View>

        {/* Library Section */}
        <View style={styles.librarySection}>
          <TouchableOpacity 
            style={styles.libraryCard}
            onPress={() => onCardPress?.({
              id: 'library',
              title: 'BIBLIOTECA Y REGLAMENTOS',
              icon: 'library',
              color: '#F44336',
              action: 'navigate_to_library'
            })}
          >
            <View style={styles.libraryIconContainer}>
              <View style={styles.binderContainer}>
                <View style={[styles.binder, { backgroundColor: '#F44336' }]} />
                <View style={[styles.binder, { backgroundColor: '#FFD700' }]} />
                <View style={[styles.binder, { backgroundColor: '#2196F3' }]} />
              </View>
            </View>
            <Text style={styles.libraryTitle}>BIBLIOTECA Y REGLAMENTOS</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
          <Ionicons name="home" size={24} color="#9C27B0" />
          <Text style={[styles.navText, styles.activeNavText]}>Inicio</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="pricetag" size={24} color="#666" />
          <Text style={styles.navText}>Promociones</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="call" size={24} color="#666" />
          <Text style={styles.navText}>Directorio</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="notifications" size={24} color="#666" />
          <Text style={styles.navText}>Notificaciones</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person" size={24} color="#666" />
          <Text style={styles.navText}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  logoContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9C27B0',
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardContent: {
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF5722',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    lineHeight: 16,
  },
  librarySection: {
    marginBottom: 20,
  },
  libraryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
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
  libraryIconContainer: {
    marginBottom: 12,
  },
  binderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  binder: {
    width: 16,
    height: 20,
    borderRadius: 2,
  },
  libraryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeNavItem: {
    // Active state styling
  },
  navText: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  activeNavText: {
    color: '#9C27B0',
    fontWeight: '600',
  },
});

export default PrincipalScreen;
