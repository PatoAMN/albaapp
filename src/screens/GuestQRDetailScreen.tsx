import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Share,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Guest, GuestQR } from '../utils/guestsService';
import { useAuth } from '../utils/authContext';

const { width, height } = Dimensions.get('window');

interface GuestQRDetailScreenProps {
  guest: Guest;
  qrCode: GuestQR;
  onGoBack: () => void;
  onDelete: (guestId: string, qrId: string) => void;
  onRenew: (guestId: string, qrId: string) => void;
  onShare: (guest: Guest, qrCode: GuestQR) => void;
}

export const GuestQRDetailScreen: React.FC<GuestQRDetailScreenProps> = ({
  guest,
  qrCode,
  onGoBack,
  onDelete,
  onRenew,
  onShare,
}) => {
  const { organization } = useAuth();
  
  const formatDateSafe = (date: any): string => {
    if (!date) return 'Fecha no disponible';
    
    try {
      let dateObj: Date;
      
      if (date instanceof Date) {
        dateObj = date;
      } else if (date && typeof date === 'object' && date.seconds) {
        // Firestore Timestamp
        dateObj = new Date(date.seconds * 1000);
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else if (typeof date === 'number') {
        dateObj = new Date(date);
      } else {
        return 'Fecha no disponible';
      }
      
      if (isNaN(dateObj.getTime())) {
        return 'Fecha no válida';
      }
      
      return dateObj.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return 'Fecha no disponible';
    }
  };

  const formatTimeSafe = (date: any): string => {
    if (!date) return 'Hora no disponible';
    
    try {
      let dateObj: Date;
      
      if (date instanceof Date) {
        dateObj = date;
      } else if (date && typeof date === 'object' && date.seconds) {
        // Firestore Timestamp
        dateObj = new Date(date.seconds * 1000);
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else if (typeof date === 'number') {
        dateObj = new Date(date);
      } else {
        return 'Hora no disponible';
      }
      
      if (isNaN(dateObj.getTime())) {
        return 'Hora no válida';
      }
      
      return dateObj.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Hora no disponible';
    }
  };

  const handleShare = () => {
    onShare(guest, qrCode);
  };

  const handleRenew = () => {
    Alert.alert(
      'Renovar Pase',
      '¿Estás seguro de que quieres renovar este pase?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Renovar', 
          onPress: () => onRenew(guest.id, qrCode.id),
          style: 'default'
        }
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Pase',
      '¿Estás seguro de que quieres eliminar este pase? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          onPress: () => onDelete(guest.id, qrCode.id),
          style: 'destructive'
        }
      ]
    );
  };

  const copyToken = () => {
    if (!qrCode.qrCodeHash) {
      Alert.alert('Error', 'Token no disponible');
      return;
    }
    // En React Native, podríamos usar Clipboard API
    Alert.alert('Token Copiado', `Token: ${qrCode.qrCodeHash}`);
  };

  console.log('🔍 GuestQRDetailScreen - Renderizando con datos:', {
    guest: guest.name,
    guestId: guest.id,
    qrCodeId: qrCode.id,
    qrCodeImage: qrCode.qrCodeImage,
    qrCodeHash: qrCode.qrCodeHash,
    purpose: qrCode.purpose,
    startDateTime: qrCode.startDateTime,
    endDateTime: qrCode.endDateTime,
    isActive: qrCode.isActive,
    organization: organization?.displayName,
    organizationAddress: organization?.address
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
          <Ionicons name="arrow-back" size={24} color="#6366f1" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>DETALLE DEL PASE</Text>
        </View>
        
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tarjeta principal del invitado */}
        <View style={styles.mainCard}>
          <View style={styles.mainCardContent}>
            <View style={styles.mainCardUserInfo}>
              <Text style={styles.mainCardUserName}>{guest.name}</Text>
              <Text style={styles.mainCardUserAddress}>
                {organization?.address || 'Dirección no especificada'}
              </Text>
            </View>
            
            <View style={styles.mainCardQRContainer}>
              {qrCode.qrCodeImage ? (
                <>
                  <View style={styles.qrContainer}>
                    <View style={styles.qrBorder}>
                      <Image source={{ uri: qrCode.qrCodeImage }} style={styles.mainCardQRImage} />
                    </View>
                  </View>
                  <Text style={styles.mainCardQRInfo}>
                    Escanea para verificar acceso
                  </Text>
                  
                  {/* Código de acceso manual */}
                  <Text style={styles.manualCodeValue}>
                    {qrCode.qrCodeHash ? qrCode.qrCodeHash.substring(0, 8) : 'N/A'}
                  </Text>
                </>
              ) : (
                <View style={styles.mainCardErrorContainer}>
                  <Ionicons name="qr-code-outline" size={120} color="#ccc" />
                  <Text style={styles.mainCardErrorText}>Código QR no disponible</Text>
                  <Text style={styles.mainCardErrorSubtext}>
                    El código QR no se pudo generar correctamente
                  </Text>
                </View>
              )}
            </View>
            
            {/* Información adicional del pase */}
            <View style={styles.passInfoContainer}>
              <View style={styles.passInfoRow}>
                <Text style={styles.passInfoLabel}>Propósito:</Text>
                <Text style={styles.passInfoValue}>{qrCode.purpose || 'No especificado'}</Text>
              </View>
              
              <View style={styles.passInfoRow}>
                <Text style={styles.passInfoLabel}>Válido desde:</Text>
                <Text style={styles.passInfoValue}>
                  {formatDateSafe(qrCode.startDateTime)}
                </Text>
              </View>
              
              <View style={styles.passInfoRow}>
                <Text style={styles.passInfoLabel}>Válido hasta:</Text>
                <Text style={styles.passInfoValue}>
                  {formatDateSafe(qrCode.endDateTime)}
                </Text>
              </View>
              
              <View style={styles.passInfoRow}>
                <Text style={styles.passInfoLabel}>Estado:</Text>
                <View style={[
                  styles.passStatusBadge,
                  { backgroundColor: qrCode.isActive ? '#4CAF50' : '#F44336' }
                ]}>
                  <Text style={styles.passStatusText}>
                    {qrCode.isActive ? 'Activo' : 'Inactivo'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
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
    paddingTop: 20,
    paddingBottom: 20,
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
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  
  // Estilos de la tarjeta principal
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
  mainCardContent: {
    alignItems: 'center',
  },
  mainCardUserInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  mainCardUserName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  mainCardUserAddress: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    maxWidth: '80%',
  },
  mainCardQRContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  qrContainer: {
    marginBottom: 20,
  },
  qrBorder: {
    borderWidth: 3,
    borderColor: '#6366f1',
    borderRadius: 16,
    padding: 8,
    backgroundColor: '#ffffff',
  },
  mainCardQRImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  mainCardQRInfo: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
  },
  manualCodeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    fontFamily: 'monospace',
    letterSpacing: 2,
    textAlign: 'center',
  },
  
  // Estilos para cuando no hay QR
  mainCardErrorContainer: {
    alignItems: 'center',
    padding: 40,
  },
  mainCardErrorText: {
    fontSize: 18,
    color: '#999999',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  mainCardErrorSubtext: {
    fontSize: 14,
    color: '#cccccc',
    textAlign: 'center',
  },
  
  // Estilos para información del pase
  passInfoContainer: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  passInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  passInfoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  passInfoValue: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  passStatusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  passStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});



