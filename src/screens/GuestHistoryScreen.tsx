import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Guest, GuestQR } from '../utils/guestsService';
import { GuestQRDetailScreen } from './GuestQRDetailScreen';
import { QRForm } from '../components/QRForm';
import { useAuth } from '../utils/authContext';

const { width, height } = Dimensions.get('window');

interface GuestHistoryScreenProps {
  guest: Guest;
  onGoBack: () => void;
  onDeleteGuest: (guestId: string) => void;
  onDeleteQR: (guestId: string, qrId: string) => void;
  onActivateQR: (guestId: string, qrId: string) => void;
  onDeactivateQR: (guestId: string, qrId: string) => void;
  onShareQR: (guest: Guest, qrCode: GuestQR) => void;
  onDownloadQR: (guest: Guest, qrCode: GuestQR) => void;
}

export const GuestHistoryScreen: React.FC<GuestHistoryScreenProps> = ({
  guest,
  onGoBack,
  onDeleteGuest,
  onDeleteQR,
  onActivateQR,
  onDeactivateQR,
  onShareQR,
  onDownloadQR,
}) => {
  const [selectedQR, setSelectedQR] = useState<GuestQR | null>(null);
  const [showQRDetail, setShowQRDetail] = useState(false);
  const [showQRForm, setShowQRForm] = useState(false);
  const { organization } = useAuth();

  const formatDateSafe = (dateTime: any): string => {
    if (!dateTime) return 'Fecha no disponible';
    
    // Si es un timestamp de Firestore, convertirlo a Date
    if (dateTime.seconds) {
      const date = new Date(dateTime.seconds * 1000);
      return date.toLocaleDateString('es-MX');
    }
    
    // Si es una instancia de Date
    if (dateTime instanceof Date) {
      return dateTime.toLocaleDateString('es-MX');
    }
    
    // Si es un string ISO
    if (typeof dateTime === 'string') {
      try {
        const date = new Date(dateTime);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('es-MX');
        }
      } catch (error) {
        console.error('Error parsing date string:', error);
      }
    }
    
    return 'Fecha no disponible';
  };

  const formatTimeSafe = (dateTime: any): string => {
    if (!dateTime) return 'Hora no disponible';
    
    // Si es un timestamp de Firestore, convertirlo a Date
    if (dateTime.seconds) {
      const date = new Date(dateTime.seconds * 1000);
      return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Si es una instancia de Date
    if (dateTime instanceof Date) {
      return dateTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Si es un string ISO
    if (typeof dateTime === 'string') {
      try {
        const date = new Date(dateTime);
        if (!isNaN(date.getTime())) {
          return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        }
      } catch (error) {
        console.error('Error parsing time string:', error);
      }
    }
    
    return 'Hora no disponible';
  };

  const handleCreateQR = () => {
    if (!organization?.id) {
      Alert.alert('Error', 'No se pudo identificar la organización');
      return;
    }
    setShowQRForm(true);
  };

  const handleQRCreated = () => {
    // Refrescar la lista de QRs del invitado
    // Por ahora solo cerramos el formulario
    setShowQRForm(false);
  };

  const isQRInValidTimeRange = (qrCode: GuestQR): boolean => {
    // Validar que las fechas existan
    if (!qrCode.startDateTime || !qrCode.endDateTime) {
      console.log('🔍 [GuestHistory] QR sin fechas válidas');
      return false;
    }
    
    // Convertir timestamps de Firestore a Date si es necesario
    let startDate: Date;
    let endDate: Date;
    
    if ((qrCode.startDateTime as any).seconds) {
      startDate = new Date((qrCode.startDateTime as any).seconds * 1000);
    } else if (qrCode.startDateTime instanceof Date) {
      startDate = qrCode.startDateTime;
    } else {
      console.log('🔍 [GuestHistory] QR con fecha de inicio no válida:', qrCode.startDateTime);
      return false;
    }
    
    if ((qrCode.endDateTime as any).seconds) {
      endDate = new Date((qrCode.endDateTime as any).seconds * 1000);
    } else if (qrCode.endDateTime instanceof Date) {
      endDate = qrCode.endDateTime;
    } else {
      console.log('🔍 [GuestHistory] QR con fecha de fin no válida:', qrCode.endDateTime);
      return false;
    }
    
    const now = new Date();
    const isInRange = now >= startDate && now <= endDate;
    
    console.log('🔍 [GuestHistory] Validación de horario QR:', {
      now: now.toISOString(),
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      isInRange
    });
    
    return isInRange;
  };

  const showQRDetailScreen = (qrCode: GuestQR) => {
    setSelectedQR(qrCode);
    setShowQRDetail(true);
  };

  const closeQRDetailScreen = () => {
    setShowQRDetail(false);
    setSelectedQR(null);
  };

  const handleDeleteGuest = () => {
    Alert.alert(
      'Eliminar Invitado',
      `¿Estás seguro de que quieres eliminar a ${guest.name} y todos sus pases? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          onPress: () => onDeleteGuest(guest.id),
          style: 'destructive'
        }
      ]
    );
  };

  const handleDeleteQR = (qrId: string) => {
    Alert.alert(
      'Eliminar Pase',
      '¿Estás seguro de que quieres eliminar este pase? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          onPress: () => onDeleteQR(guest.id, qrId),
          style: 'destructive'
        }
      ]
    );
  };

  const handleActivateQR = (qrId: string) => {
    onActivateQR(guest.id, qrId);
  };

  const handleDeactivateQR = (qrId: string) => {
    onDeactivateQR(guest.id, qrId);
  };

    return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Pantalla de detalle del QR - Página completa */}
      {showQRDetail && selectedQR ? (
        <GuestQRDetailScreen
          guest={guest}
          qrCode={selectedQR}
          onGoBack={closeQRDetailScreen}
          onDelete={onDeleteQR}
          onRenew={(guestId, qrId) => {
            // Implementar renovación del QR
            Alert.alert('Renovar', 'Función de renovación en desarrollo');
          }}
          onShare={onShareQR}
        />
      ) : showQRForm ? (
        <QRForm
          guest={guest}
          organizationId={organization?.id || ''}
          onClose={() => setShowQRForm(false)}
          onQRCreated={handleQRCreated}
        />
      ) : (
        <>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
              <Ionicons name="arrow-back" size={24} color="#6366f1" />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Historial de Pases</Text>
            </View>
            
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteGuest}>
              <Ionicons name="trash" size={20} color="#f44336" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Lista de Pases */}
            <View style={styles.passesSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Ionicons name="qr-code" size={24} color="#6366f1" />
                  <Text style={styles.sectionTitle}>Pases Generados</Text>
                </View>
                <TouchableOpacity
                  style={styles.createQRButton}
                  onPress={() => handleCreateQR()}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={20} color="#ffffff" />
                  <Text style={styles.createQRButtonText}>Crear QR</Text>
                </TouchableOpacity>
              </View>
              
              {guest.qrCodes.length === 0 ? (
                <View style={styles.emptyStateCard}>
                  <Ionicons name="qr-code-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyStateText}>
                    No hay pases para este invitado
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    Los pases aparecerán aquí cuando se generen
                  </Text>
                </View>
              ) : (
                guest.qrCodes.map((qrCode) => (
                  <View key={qrCode.id} style={styles.passCard}>
                    <View style={styles.passCardContent}>
                      <View style={styles.passCardUserInfo}>
                        <Text style={styles.passCardGuestName}>{guest.name}</Text>
                        <Text style={styles.passCardPurpose}>{qrCode.purpose}</Text>
                        <View style={styles.passCardStatus}>
                          <View style={[
                            styles.statusIndicator,
                            qrCode.isActive && isQRInValidTimeRange(qrCode) ? styles.statusActive : styles.statusInactive
                          ]} />
                          <Text style={[
                            styles.statusText,
                            qrCode.isActive && isQRInValidTimeRange(qrCode) ? styles.statusTextActive : styles.statusTextInactive
                          ]}>
                            {qrCode.isActive && isQRInValidTimeRange(qrCode) ? 'Válido' : 
                              !qrCode.isActive ? 'Inactivo' : 'Fuera de Horario'}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.passCardQRContainer}>
                        <View style={styles.qrContainer}>
                          <View style={styles.qrBorder}>
                            {(() => {
                              console.log('🔍 [GuestHistory] Renderizando QR:', {
                                hasImage: !!qrCode.qrCodeImage,
                                imageUrl: qrCode.qrCodeImage,
                                qrCodeId: qrCode.id
                              });
                              
                              return qrCode.qrCodeImage ? (
                                <Image 
                                  source={{ uri: qrCode.qrCodeImage }} 
                                  style={styles.qrImage}
                                  onError={(error) => {
                                    console.log('🔍 Error cargando QR:', error);
                                    console.log('🔍 URL del QR:', qrCode.qrCodeImage);
                                  }}
                                  onLoad={() => console.log('🔍 QR cargado exitosamente')}
                                />
                              ) : (
                                <View style={styles.qrPlaceholder}>
                                  <Ionicons name="qr-code-outline" size={100} color="#ccc" />
                                  <Text style={styles.qrPlaceholderText}>QR no disponible</Text>
                                </View>
                              );
                            })()}
                          </View>
                        </View>
                        <Text style={styles.qrInfo}>
                          Escanea para verificar acceso
                        </Text>
                        
                        {/* Información de fechas */}
                        <View style={styles.passDates}>
                          <Text style={styles.dateLabel}>Inicio:</Text>
                          <Text style={styles.dateValue}>
                            {formatDateSafe(qrCode.startDateTime)} - {formatTimeSafe(qrCode.startDateTime)}
                          </Text>
                          <Text style={styles.dateLabel}>Fin:</Text>
                          <Text style={styles.dateValue}>
                            {formatDateSafe(qrCode.endDateTime)} - {formatTimeSafe(qrCode.endDateTime)}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.passActions}>
                        <View style={styles.actionItem}>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.openButton]}
                            onPress={() => showQRDetailScreen(qrCode)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="eye" size={20} color="#6366f1" />
                          </TouchableOpacity>
                          <Text style={styles.actionButtonText}>Abrir</Text>
                        </View>
                        
                        <View style={styles.actionItem}>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.shareButton]}
                            onPress={() => onShareQR(guest, qrCode)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="share" size={20} color="#64B5F6" />
                          </TouchableOpacity>
                          <Text style={styles.actionButtonText}>Compartir</Text>
                        </View>
                        
                        <View style={styles.actionItem}>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.deleteButton]}
                            onPress={() => handleDeleteQR(qrCode.id)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="trash" size={20} color="#f44336" />
                          </TouchableOpacity>
                          <Text style={styles.actionButtonText}>Eliminar</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  deleteButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  passesSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 12,
  },
  emptyStateCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  passCard: {
    backgroundColor: '#ffffff',
    borderRadius: 0,
    padding: 32,
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
  passCardContent: {
    alignItems: 'center',
    flex: 1,
    paddingTop: 16,
  },
  passCardUserInfo: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
    width: '100%',
  },
  passCardGuestName: {
    fontSize: 28,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  passCardPurpose: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '400',
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  passCardStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusActive: {
    backgroundColor: '#4CAF50',
  },
  statusInactive: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusTextActive: {
    color: '#4CAF50',
  },
  statusTextInactive: {
    color: '#F44336',
  },
  passCardQRContainer: {
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
    borderColor: '#6366f1',
    borderRadius: 8,
    padding: 16,
  },
  qrImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
  },
  qrPlaceholderText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  qrInfo: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  passDates: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    width: '100%',
  },
  dateLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  passActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 32,
    gap: 40,
  },
  actionItem: {
    alignItems: 'center',
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  openButton: {
    borderColor: '#6366f1',
    backgroundColor: '#ffffff',
  },
  shareButton: {
    borderColor: '#64B5F6',
    backgroundColor: '#ffffff',
  },
  deleteButton: {
    borderColor: '#f44336',
    backgroundColor: '#ffffff',
  },
  createQRButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createQRButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});
