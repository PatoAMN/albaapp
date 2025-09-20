import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Dimensions,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../utils/authContext';
import { Member } from '../types';
import { QRValidationService } from '../utils/qrValidationService';

const { width, height } = Dimensions.get('window');

interface MemberHomeScreenProps {
  onGoBack?: () => void;
}

export const MemberHomeScreen: React.FC<MemberHomeScreenProps> = ({ onGoBack }) => {
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [manualAccessCode, setManualAccessCode] = useState<string>('');
  const member = user as Member;
  
  // Variables de animación para el contorno del QR
  const borderColorAnim = useRef(new Animated.Value(0)).current;
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

  // Función para regresar a la pantalla Principal
  const goBackToPrincipal = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      console.log('Regresando a pantalla Principal');
    }
  };

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

  // Función para animar el contorno del QR
  const startBorderAnimation = () => {
    Animated.loop(
      Animated.timing(borderColorAnim, {
        toValue: colors.length - 1,
        duration: 3000,
        useNativeDriver: false,
      })
    ).start();
  };

  // Iniciar animación cuando se genera el QR
  useEffect(() => {
    if (qrCodeDataUrl && !loading) {
      startBorderAnimation();
    }
  }, [qrCodeDataUrl, loading]);

  const generateQRCode = async () => {
    if (!member || member.userType !== 'member') return;
    
    setLoading(true);
    try {
      // Get safe values with defaults
      const memberName = member.name || 'Member';
      const memberAccessLevel = member.accessLevel || 'resident';
      const memberQrExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      
      // Generate a stable hash based on member ID and email (not timestamp)
      const memberQrHash = `member_${member.id}_${member.email}`;
      
      // Generate a 6-digit manual access code based on the member ID
      const memberIdHash = member.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const manualAccessCode = String((memberIdHash % 900000) + 100000); // Ensures 6 digits (100000-999999)

      // Guardar QR en Firestore para validación en la nube
      try {
        console.log('🔧 [QR-GEN] Iniciando generación de QR para usuario:');
        console.log('🔧 [QR-GEN] member.id:', member.id);
        console.log('🔧 [QR-GEN] member.email:', member.email);
        console.log('🔧 [QR-GEN] member.organizationId:', member.organizationId);
        console.log('🔧 [QR-GEN] memberQrHash:', memberQrHash);
        console.log('🔧 [QR-GEN] memberQrExpiry:', memberQrExpiry);
        
        // Usar el organizationId del usuario autenticado
        const organizationId = member.organizationId;
        if (organizationId) {
          const qrService = new QRValidationService(organizationId);
          await qrService.updateMemberQR(member.id, memberQrHash, memberQrExpiry);
          console.log('✅ [QR-GEN] QR guardado exitosamente en Firestore');
          console.log('✅ [QR-GEN] Organización:', organizationId);
          console.log('✅ [QR-GEN] Hash guardado:', memberQrHash);
        } else {
          console.error('❌ [QR-GEN] Usuario sin organizationId, NO se puede guardar QR');
        }
      } catch (firestoreError) {
        console.error('❌ [QR-GEN] Error guardando en Firestore:', firestoreError);
        console.error('❌ [QR-GEN] memberQrHash que intentó guardar:', memberQrHash);
      }

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
      
      // Store the manual access code in state
      setManualAccessCode(manualAccessCode);
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
  
  // Construir dirección de residencia según el tipo de comunidad
  let memberAddress = '';
  
  // Agregar dirección general si está disponible
  if (member.homeAddress) {
    memberAddress = member.homeAddress;
  }
  
  // Agregar información específica según el tipo de residencia
  if (member.buildingInfo?.tower && member.buildingInfo?.apartment) {
    if (memberAddress) {
      memberAddress += `, Torre ${member.buildingInfo.tower}, Depto ${member.buildingInfo.apartment}`;
    } else {
      memberAddress = `Torre ${member.buildingInfo.tower}, Depto ${member.buildingInfo.apartment}`;
    }
  } else if (member.homeNumber) {
    if (memberAddress) {
      memberAddress += `, Casa ${member.homeNumber}`;
    } else {
      memberAddress = `Casa ${member.homeNumber}`;
    }
  }
  
  // Si no hay ninguna información, usar fallback
  if (!memberAddress) {
    memberAddress = 'Dirección no especificada';
  }
  
  // Agregar información del estacionamiento si está disponible
  if (member.parkingSpot) {
    memberAddress += ` - Est. ${member.parkingSpot}`;
  }
  
  const memberVehicle = member.vehicleInfo ? `${member.vehicleInfo.model} ${member.vehicleInfo.color}` : 'No vehicle info';
  const memberAccessLevel = member.accessLevel || 'resident';
  const memberCreatedAt = member.createdAt ? new Date(member.createdAt) : new Date();
  const memberQrExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
  const memberEmergencyContacts = member.emergencyContacts || [];

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

  const formatDate = (date: Date | undefined | null) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return 'Fecha no disponible';
    }
    
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date | undefined | null) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return '--:--:--';
    }
    
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={goBackToPrincipal}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#64B5F6" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Ionicons name="qr-code" size={32} color="#64B5F6" />
          <Text style={styles.headerTitle}>QR Personal</Text>
        </View>
        
        <View style={styles.headerRight} />
      </View>

      {/* Contenido principal */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tarjeta principal del QR */}
        <View style={styles.mainCard}>
          <View style={styles.mainCardContent}>
            <View style={styles.mainCardUserInfo}>
              <Text style={styles.mainCardUserName}>{memberName}</Text>
              <Text style={styles.mainCardUserAddress}>{memberAddress}</Text>
            </View>
            
            <View style={styles.mainCardQRContainer}>
              {loading ? (
                <View style={styles.mainCardLoadingContainer}>
                  <ActivityIndicator size="large" color="#6366f1" />
                  <Text style={styles.mainCardLoadingText}>Generando Código QR...</Text>
                </View>
              ) : qrCodeDataUrl ? (
                                 <>
                   <View style={styles.qrContainer}>
                     <Animated.View
                       style={[
                         styles.qrBorder,
                         {
                           borderColor: borderColorAnim.interpolate({
                             inputRange: colors.map((_, index) => index),
                             outputRange: colors,
                           }),
                         },
                       ]}
                     >
                       <Image source={{ uri: qrCodeDataUrl }} style={styles.mainCardQRImage} />
                     </Animated.View>
                   </View>
                                      <Text style={styles.mainCardQRInfo}>
                     Escanea para verificar acceso
                   </Text>
                   
                   {/* Código de acceso manual de 6 dígitos */}
                   <Text style={styles.manualCodeValue}>
                     {manualAccessCode}
                   </Text>
                 </>
              ) : (
                <View style={styles.mainCardErrorContainer}>
                  <Text style={styles.mainCardErrorText}>Código QR no disponible</Text>
                  <TouchableOpacity style={styles.mainCardRetryButton} onPress={generateQRCode}>
                    <Text style={styles.mainCardRetryText}>Reintentar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>


      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: '#f5f5f5',
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
  content: {
    flex: 1,
    padding: 20,
  },
  mainCard: {
    backgroundColor: '#ffffff',
    borderRadius: 0,
    padding: 32,
    marginTop: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginHorizontal: 16,
    minHeight: 580,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  mainCardHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  mainCardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  mainCardIcon: {
    fontSize: 32,
    marginRight: 15,
    color: 'black',
  },
  mainCardTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'black',
  },
  mainCardSubtitle: {
    alignItems: 'center',
  },
  mainCardSubtitleText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  mainCardContent: {
    alignItems: 'center',
    flex: 1,
    paddingTop: 16,
  },
  mainCardUserInfo: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
    width: '100%',
  },
  mainCardUserName: {
    fontSize: 28,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  mainCardUserAddress: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '400',
    marginBottom: 32,
    letterSpacing: 0.2,
  },
  mainCardUserRole: {
    fontSize: 22,
    color: '#444',
    fontWeight: '500',
  },
  mainCardQRContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    padding: 24,
    backgroundColor: '#fafafa',
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  qrBorder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderRadius: 0,
    padding: 8,
  },
  mainCardQRImage: {
    width: 280,
    height: 280,
    borderRadius: 0,
  },
  mainCardQRInfo: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '400',
    marginBottom: 24,
    letterSpacing: 0.3,
  },
  mainCardLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  mainCardLoadingText: {
    fontSize: 20,
    color: '#3b82f6',
    marginTop: 20,
  },
  mainCardErrorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  mainCardErrorText: {
    fontSize: 20,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  mainCardRetryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 18,
    padding: 18,
    paddingHorizontal: 35,
  },
  mainCardRetryText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  infoCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 30,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    width: '48%', // Two cards per row
    marginBottom: 16,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoCardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoCardIcon: {
    fontSize: 24,
    color: 'white',
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoCardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366f1',
    textAlign: 'center',
  },
  emergencyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    marginHorizontal: 0,
    borderLeftWidth: 4,
    borderLeftColor: '#FF5722',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emergencyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  emergencyCardIcon: {
    fontSize: 24,
    marginRight: 10,
    color: '#FF5722',
  },
  emergencyCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  emergencyContactsList: {
    // No specific styles for list items, they will be handled by the map
  },
  emergencyContactItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  emergencyContactText: {
    fontSize: 16,
    color: '#666',
  },
  manualCodeValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginTop: 16,
    letterSpacing: 1,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
});


