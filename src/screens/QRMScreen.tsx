import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../utils/authContext';
import { Member } from '../types';
import { QRValidationService } from '../utils/qrValidationService';

const { width, height } = Dimensions.get('window');

export const QRMScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
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
      const memberQrExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      
      // Generate a stable hash based on member ID and email (not timestamp)
      const memberQrHash = `member_${member.id}_${member.email}`;

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
    <LinearGradient
      colors={['#000000', '#0a0a0a', '#1a1a1a']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Líneas de fondo generales */}
      <View style={styles.backgroundLines}>
        <View style={styles.globalDiagonal1} />
        <View style={styles.globalDiagonal2} />
        <View style={styles.globalHorizontal1} />
        <View style={styles.globalHorizontal2} />
        <View style={styles.globalVertical1} />
        <View style={styles.globalVertical2} />
        <View style={styles.globalArc1} />
        <View style={styles.globalArc2} />
        <View style={styles.globalWave1} />
        <View style={styles.globalWave2} />
        <View style={styles.globalCurve1} />
        <View style={styles.globalCurve2} />
        <View style={styles.globalDiagonal3} />
        <View style={styles.globalDiagonal4} />
        <View style={styles.globalHorizontal3} />
        <View style={styles.globalHorizontal4} />
        <View style={styles.globalVertical3} />
        <View style={styles.globalVertical4} />
        <View style={styles.globalCurve3} />
        <View style={styles.globalCurve4} />
      </View>

      {/* Oscurecer background global */}
      <View pointerEvents="none" style={styles.globalDimOverlay} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Tarjeta Principal con Usuario y QR */}
        <View style={styles.mainCard}>
          <View style={styles.mainCardHeader}>
            <View style={styles.mainCardTitleContainer}>
              <Text style={styles.mainCardIcon}>●</Text>
              <Text style={styles.mainCardTitle}>Acceso Rápido</Text>
            </View>
            <View style={styles.mainCardSubtitle}>
              <Text style={styles.mainCardSubtitleText}>Muestra este código a los guardias</Text>
            </View>
          </View>
          
          <View style={styles.mainCardContent}>
            <View style={styles.mainCardUserInfo}>
              <Text style={styles.mainCardUserName}>{memberName}</Text>
              <Text style={styles.mainCardUserRole}>{memberAccessLevel}</Text>
            </View>
            
            <View style={styles.mainCardQRContainer}>
              {loading ? (
                <View style={styles.mainCardLoadingContainer}>
                  <ActivityIndicator size="large" color="#6366f1" />
                  <Text style={styles.mainCardLoadingText}>Generando Código QR...</Text>
                </View>
              ) : qrCodeDataUrl ? (
                <>
                  <Image source={{ uri: qrCodeDataUrl }} style={styles.mainCardQRImage} />
                  <Text style={styles.mainCardQRInfo}>
                    Escanea para verificar acceso
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
        
        {/* Espacio para el menú inferior */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  globalDiagonal1: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    transform: [{ rotate: '45deg' }],
  },
  globalDiagonal2: {
    position: 'absolute',
    top: height * 0.3,
    right: 0,
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    transform: [{ rotate: '-45deg' }],
  },
  globalHorizontal1: {
    position: 'absolute',
    top: height * 0.1,
    left: 0,
    width: width,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  globalHorizontal2: {
    position: 'absolute',
    bottom: height * 0.2,
    left: 0,
    width: width,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  globalVertical1: {
    position: 'absolute',
    left: width * 0.3,
    top: 0,
    width: 1,
    height: height,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  globalVertical2: {
    position: 'absolute',
    right: width * 0.4,
    top: height * 0.5,
    width: 1,
    height: height,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  globalArc1: {
    position: 'absolute',
    top: height * 0.7,
    left: width * 0.2,
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    transform: [{ rotate: '45deg' }],
  },
  globalArc2: {
    position: 'absolute',
    bottom: height * 0.1,
    right: width * 0.3,
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    transform: [{ rotate: '-45deg' }],
  },
  globalWave1: {
    position: 'absolute',
    top: height * 0.4,
    left: width * 0.1,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    transform: [{ rotate: '45deg' }],
  },
  globalWave2: {
    position: 'absolute',
    bottom: height * 0.3,
    right: width * 0.2,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    transform: [{ rotate: '-45deg' }],
  },
  globalCurve1: {
    position: 'absolute',
    top: height * 0.6,
    left: width * 0.4,
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: width * 0.15,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    transform: [{ rotate: '45deg' }],
  },
  globalCurve2: {
    position: 'absolute',
    bottom: height * 0.4,
    right: width * 0.5,
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    transform: [{ rotate: '-45deg' }],
  },
  globalDiagonal3: {
    position: 'absolute',
    top: height * 0.2,
    left: width * 0.6,
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    transform: [{ rotate: '45deg' }],
  },
  globalDiagonal4: {
    position: 'absolute',
    bottom: height * 0.6,
    right: width * 0.1,
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    transform: [{ rotate: '-45deg' }],
  },
  globalHorizontal3: {
    position: 'absolute',
    top: height * 0.5,
    left: width * 0.7,
    width: width * 0.3,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  globalHorizontal4: {
    position: 'absolute',
    bottom: height * 0.7,
    right: width * 0.4,
    width: width * 0.6,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  globalVertical3: {
    position: 'absolute',
    left: width * 0.8,
    top: height * 0.3,
    width: 1,
    height: height * 0.7,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  globalVertical4: {
    position: 'absolute',
    right: width * 0.7,
    top: height * 0.8,
    width: 1,
    height: height * 0.2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  globalCurve3: {
    position: 'absolute',
    top: height * 0.8,
    left: width * 0.1,
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    transform: [{ rotate: '45deg' }],
  },
  globalCurve4: {
    position: 'absolute',
    bottom: height * 0.1,
    right: width * 0.8,
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: width * 0.15,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    transform: [{ rotate: '-45deg' }],
  },
  globalDimOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1,
  },

  mainCard: {
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 40,
    marginTop: 40,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: 'black',
    marginHorizontal: 10,
    minHeight: 600,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
  },
  mainCardUserInfo: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    width: '100%',
  },
  mainCardUserName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 10,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: 40,
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
  mainCardQRImage: {
    width: 320,
    height: 320,
    borderRadius: 20,
    marginBottom: 25,
  },
  mainCardQRInfo: {
    fontSize: 20,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
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
  content: {
    flex: 1,
    padding: 20,
  },
  bottomSpacer: {
    height: 100, // Adjust as needed for the bottom menu
  },
});

export default QRMScreen;
