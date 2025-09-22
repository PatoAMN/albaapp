import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../utils/authContext';
import { Member } from '../types';

const { width } = Dimensions.get('window');

export const MemberHomeScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const member = user as Member;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (member && member.userType === 'member') {
      generateQRCode();
    }
  }, [member]);

  const generateQRCode = async () => {
    if (!member || member.userType !== 'member') return;
    
    setLoading(true);
    try {
      // Get safe values with defaults
      const memberName = member.name || 'Member';
      const memberAccessLevel = member.accessLevel || 'resident';
      const memberQrExpiry = member.qrCodeExpiry || new Date(Date.now() + 24 * 60 * 60 * 1000);
      const memberQrHash = member.qrCodeHash || `member_${member.email}_${Date.now()}`;

      // Create QR code data
      const qrCodeData = JSON.stringify({
        memberId: member.id,
        qrCodeHash: memberQrHash,
        name: memberName,
        accessLevel: memberAccessLevel,
        timestamp: new Date().toISOString(),
        expiry: memberQrExpiry.toISOString()
      });

      // Generate QR code using a web service
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeData)}`;
      setQrCodeDataUrl(qrCodeUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      Alert.alert('Error', 'Failed to generate QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Don't render if user is not a member
  if (!member || member.userType !== 'member') return null;

  // Get safe values with defaults
  const memberName = member.name || 'Member';
  const memberAddress = member.homeAddress || 'Address not set';
  const memberVehicle = member.vehicleInfo || 'No vehicle info';
  const memberAccessLevel = member.accessLevel || 'resident';
  const memberCreatedAt = member.createdAt || new Date();
  const memberQrExpiry = member.qrCodeExpiry || new Date(Date.now() + 24 * 60 * 60 * 1000);
  const memberEmergencyContacts = member.emergencyContacts || [];
  const memberQrHash = member.qrCodeHash || `member_${member.email}_${Date.now()}`;

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout, style: 'destructive' },
      ]
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gradientBackground}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Bienvenido de vuelta,</Text>
            <Text style={styles.userName}>{memberName}</Text>
            <View style={styles.statusContainer}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Acceso Concedido</Text>
            </View>
          </View>

          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{memberName.charAt(0).toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.timeContainer}>
          <Text style={styles.currentTime}>{formatTime(currentTime)}</Text>
          <Text style={styles.currentDate}>{formatDate(currentTime)}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.qrCodeContainer}>
          <View style={styles.qrHeader}>
            <Text style={styles.qrTitle}>🔐 Código QR de Acceso</Text>
            <Text style={styles.qrSubtitle}>Muestra esto a los guardias de seguridad para entrar</Text>
          </View>
          
          <View style={styles.qrCodeWrapper}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Generando Código QR...</Text>
              </View>
            ) : qrCodeDataUrl ? (
              <>
                <Image source={{ uri: qrCodeDataUrl }} style={styles.qrCodeImage} />
                <Text style={styles.qrCodeInfo}>
                  📱 Escanea este código con la app del guardia
                </Text>
              </>
            ) : (
              <Text style={styles.qrCodeInfo}>Código QR no disponible</Text>
            )}
          </View>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoTitle}>📋 Información del Miembro</Text>
          </View>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>🏠</Text>
              <Text style={styles.infoLabel}>DIRECCIÓN</Text>
              <Text style={styles.infoValue}>{memberAddress}</Text>
            </View>
            
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>🚗</Text>
              <Text style={styles.infoLabel}>VEHÍCULO</Text>
              <Text style={styles.infoValue}>{memberVehicle}</Text>
            </View>
            
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>🔑</Text>
              <Text style={styles.infoLabel}>NIVEL DE ACCESO</Text>
              <Text style={styles.infoValue}>{memberAccessLevel}</Text>
            </View>
            
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>📅</Text>
              <Text style={styles.infoLabel}>MIEMBRO DESDE</Text>
              <Text style={styles.infoValue}>{formatDate(memberCreatedAt)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.contactsContainer}>
          <View style={styles.contactsHeader}>
            <Text style={styles.contactsTitle}>📞 Contactos de Emergencia</Text>
          </View>
          
          {memberEmergencyContacts.length > 0 ? (
            memberEmergencyContacts.map((contact, index) => (
              <View key={index} style={styles.contactItem}>
                <Text style={styles.contactIcon}>👤</Text>
                <Text style={styles.contactName}>{contact}</Text>
                <Text style={styles.contactPhone}>Contacto de emergencia</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noContactsText}>No hay contactos de emergencia configurados</Text>
          )}
        </View>

        <View style={styles.actionsContainer}>
          <Text style={styles.actionsTitle}>⚡ Acciones Rápidas</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>👤</Text>
              <Text style={styles.actionText}>Perfil</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionText}>Chat con Seguridad</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Announcements' as never)}
            >
              <Text style={styles.actionIcon}>📢</Text>
              <Text style={styles.actionText}>Avisos</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>📱</Text>
              <Text style={styles.actionText}>Pases de Visita</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>📚</Text>
              <Text style={styles.actionText}>Biblioteca y Reglamentos</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>🎫</Text>
              <Text style={styles.actionText}>Pase Personal</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>⚠️</Text>
              <Text style={styles.actionText}>Incidencias</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>👥</Text>
              <Text style={styles.actionText}>Comunidad</Text>
            </TouchableOpacity>
          </View>
          
          {/* Sección de Emergencia - Ahora en la parte inferior */}
          <View style={styles.emergencySection}>
            <TouchableOpacity style={styles.emergencyButton}>
              <Text style={styles.emergencyIcon}>🚨</Text>
              <Text style={styles.emergencyText}>EMERGENCIA</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>🚪 Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  gradientBackground: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    backgroundColor: '#667eea',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 5,
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ade80',
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#4ade80',
    fontWeight: '600',
  },
  avatarContainer: {
    marginLeft: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  timeContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  currentTime: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  currentDate: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  qrContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  qrHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  qrTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  qrSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  qrCodeContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
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
  qrCodeWrapper: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
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
  qrCodeImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  qrCodeInfo: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 15,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#667eea',
    marginTop: 10,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  qrInfoContainer: {
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  qrInfo: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  infoContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  infoHeader: {
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoCard: {
    width: (width - 80) / 2,
    backgroundColor: '#f8fafc',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 5,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
    textAlign: 'center',
  },
  accessLevel: {
    color: '#059669',
    fontWeight: 'bold',
  },
  contactsContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  contactsHeader: {
    marginBottom: 20,
  },
  contactsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  contactIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  contactName: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  contactPhone: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '400',
  },
  noContactsText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
  actionsContainer: {
    marginBottom: 20,
  },
  actionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    width: (width - 80) / 2,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  emergencySection: {
    marginTop: 10,
  },
  emergencyButton: {
    backgroundColor: '#DC2626',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  emergencyIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  emergencyText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
