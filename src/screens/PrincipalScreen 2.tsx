import React from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Principal'>;

interface FeatureCard {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  badge?: number;
  onPress?: () => void;
}

const PrincipalScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const featureCards: FeatureCard[] = [
    {
      id: '1',
      title: 'ESTADO DE CUENTA',
      icon: 'clipboard-outline',
      color: '#4CAF50',
    },
    {
      id: '2',
      title: 'ÁREAS COMUNES',
      icon: 'notifications-outline',
      color: '#FFD700',
    },
    {
      id: '3',
      title: 'AVISOS',
      icon: 'mail-outline',
      color: '#FF9800',
      badge: 9,
    },
    {
      id: '4',
      title: 'PASES DE VISITA',
      icon: 'qr-code-outline',
      color: '#2196F3',
      onPress: () => navigation.navigate('QRM'),
    },
    {
      id: '5',
      title: 'SOLICITAR SERVICIO',
      icon: 'construct-outline',
      color: '#9C27B0',
    },
    {
      id: '6',
      title: 'PAQUETERÍA',
      icon: 'cube-outline',
      color: '#795548',
    },
    {
      id: '7',
      title: 'INCIDENCIAS',
      icon: 'warning-outline',
      color: '#FF5722',
    },
    {
      id: '8',
      title: 'COMUNIDAD',
      icon: 'people-outline',
      color: '#E91E63',
    },
  ];

  const renderFeatureCard = (card: FeatureCard) => (
    <TouchableOpacity
      key={card.id}
      style={[styles.featureCard, { borderLeftColor: card.color }]}
      onPress={card.onPress || (() => console.log(`Pressed: ${card.title}`))}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Ionicons name={card.icon} size={32} color={card.color} />
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
            <Ionicons name="home-outline" size={24} color="#2196F3" />
          </View>
        </View>
        <View style={styles.titleContainer}>
          <View style={styles.mainLogo}>
            <Ionicons name="home" size={48} color="#2196F3" />
          </View>
          <Text style={styles.welcomeText}>BIENVENIDO</Text>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="menu" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Feature Grid */}
        <View style={styles.featureGrid}>
          {featureCards.map(renderFeatureCard)}
        </View>

        {/* Library Section */}
        <View style={styles.librarySection}>
          <TouchableOpacity style={styles.libraryCard}>
            <View style={styles.libraryContent}>
              <View style={styles.libraryIcons}>
                <View style={[styles.binder, { backgroundColor: '#FF5722' }]} />
                <View style={[styles.binder, { backgroundColor: '#FFD700' }]} />
                <View style={[styles.binder, { backgroundColor: '#2196F3' }]} />
              </View>
              <Text style={styles.libraryTitle}>BIBLIOTECA Y REGLAMENTOS</Text>
            </View>
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
          <Ionicons name="pricetag-outline" size={24} color="#666" />
          <Text style={styles.navText}>Promociones</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="call-outline" size={24} color="#666" />
          <Text style={styles.navText}>Directorio</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="notifications-outline" size={24} color="#666" />
          <Text style={styles.navText}>Notificaciones</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={24} color="#666" />
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
    borderRadius: 16,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  mainLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9C27B0',
    textAlign: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  featureGrid: {
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  libraryContent: {
    alignItems: 'center',
  },
  libraryIcons: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  binder: {
    width: 20,
    height: 25,
    marginHorizontal: 3,
    borderRadius: 3,
  },
  libraryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 20,
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
