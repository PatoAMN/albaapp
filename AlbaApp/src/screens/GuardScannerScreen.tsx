import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Dimensions,
  TextInput,
} from 'react-native';
import { useAuth } from '../utils/authContext';
import { Guard } from '../types';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { RealCameraScanner } from '../components/RealCameraScanner';

const { width } = Dimensions.get('window');

export const GuardScannerScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scanned, setScanned] = useState(false);
  const [validating, setValidating] = useState(false);
  const [lastScannedMember, setLastScannedMember] = useState<any>(null);
  const [manualQRInput, setManualQRInput] = useState('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scannerActive, setScannerActive] = useState(true); // Cámara activa por defecto
  const [currentPage, setCurrentPage] = useState<'scanner' | 'guests'>('scanner');
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simular permisos de cámara para desarrollo
  useEffect(() => {
    setHasPermission(true);
  }, []);

  // Función para manejar el escaneo real de códigos QR
  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (!isScanning || scanned) return; // Evitar múltiples escaneos
    
    console.log('Código QR escaneado:', { type, data });
    setScanned(true);
    setIsScanning(false);
    
    try {
      // Intentar parsear como JSON primero
      const parsedData = JSON.parse(data);
      const { qrCodeHash, name, accessLevel, expiry } = parsedData;
      
      // Validar con Firebase
      validateQRCodeWithFirebase(qrCodeHash);
      
    } catch (error) {
      // Si no es JSON, tratar como hash directo
      console.log('Usando hash directo del código QR');
      validateQRCodeWithFirebase(data);
    }
  };

  // Función para reanudar el escaneo después de procesar un código
  const resumeScanning = () => {
    setScanned(false);
    setIsScanning(true);
    setLastScannedMember(null);
  };

  // Don't render if user is not a guard
  if (!user || user.userType !== 'guard') {
    console.log('Guard validation failed:', { user: user?.userType });
    return null;
  }

  const guard = user as Guard;

  // Get safe values with defaults
  const guardName = guard?.name || 'Guardia';
  const guardBadgeNumber = guard?.badgeNumber || 'G001';
  const guardShiftHours = guard?.shiftHours || '8:00 AM - 4:00 PM';

  // Mock member database - replace with real Firebase call
  const mockMembers: any[] = [
    { id: 1, name: 'John Doe', homeAddress: '123 Main St', vehicleInfo: 'Car', accessLevel: 'resident', qrCodeHash: 'hash1', qrCodeExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    { id: 2, name: 'Jane Smith', homeAddress: '456 Oak Ave', vehicleInfo: 'Bike', accessLevel: 'guest', qrCodeHash: 'hash2', qrCodeExpiry: new Date(Date.now() + 12 * 60 * 60 * 1000) },
    { id: 3, name: 'Peter Jones', homeAddress: '789 Pine Ln', vehicleInfo: 'None', accessLevel: 'resident', qrCodeHash: 'hash3', qrCodeExpiry: new Date(Date.now() + 36 * 60 * 60 * 1000) },
  ];

  const validateQRCodeWithFirebase = async (qrCodeHash: string) => {
    setValidating(true);
    try {
      const functions = getFunctions();
      const validateQR = httpsCallable(functions, 'validateQRCode');
      
      // Send only the QR hash for validation
      const result = await validateQR({ qrCodeHash });
      const data = result.data as any;
      
      if (data.valid) {
        // Find member data for display
        const member = mockMembers.find(m => m.qrCodeHash === qrCodeHash);
        if (member) {
          setLastScannedMember(member);
          Alert.alert(
            'Acceso Permitido',
            `Bienvenido, ${member.name}!\n\nDirección: ${member.homeAddress}\nVehículo: ${member.vehicleInfo || 'Ninguno'}\nNivel de Acceso: ${member.accessLevel}`,
            [
              { text: 'Permitir Acceso', style: 'default' },
              { text: 'Denegar Acceso', style: 'destructive', onPress: () => setScanned(false) },
            ]
          );
        }
      } else {
        Alert.alert(
          'Acceso Denegado',
          data.message || 'Código QR inválido',
          [
            { text: 'OK', onPress: () => setScanned(false) },
          ]
        );
      }
    } catch (error) {
      console.error('Error validando código QR:', error);
      // Fallback to mock validation
      handleMockValidation(qrCodeHash);
    } finally {
      setValidating(false);
    }
  };

  const handleMockValidation = (qrCodeHash: string) => {
    const member = mockMembers.find(m => m.qrCodeHash === qrCodeHash);
    
    if (member) {
      setLastScannedMember(member);
      
      // Check if QR code is expired
      if (new Date() > member.qrCodeExpiry) {
        Alert.alert(
          'Acceso Denegado',
          `Código QR expirado para ${member.name}. Por favor, solicite un nuevo código.`,
          [
            { text: 'OK', onPress: () => setScanned(false) },
          ]
        );
        return;
      }
      
      // Grant access
      Alert.alert(
        'Acceso Permitido',
        `Bienvenido, ${member.name}!\n\nDirección: ${member.homeAddress}\nVehículo: ${member.vehicleInfo || 'Ninguno'}\nNivel de Acceso: ${member.accessLevel}`,
        [
          { text: 'Permitir Acceso', style: 'default' },
          { text: 'Denegar Acceso', style: 'destructive', onPress: () => setScanned(false) },
        ]
      );
    } else {
      Alert.alert(
        'Código QR Inválido',
        'Este código QR no está reconocido. Por favor, consulte con el residente.',
        [
          { text: 'OK', onPress: () => setScanned(false) },
        ]
      );
    }
  };

  // Función para manejar entrada manual de códigos QR
  const handleManualQRSubmit = () => {
    if (manualQRInput.trim()) {
      try {
        const parsedData = JSON.parse(manualQRInput.trim());
        const { qrCodeHash, name, accessLevel, expiry } = parsedData;
        
        // Validar con Firebase
        validateQRCodeWithFirebase(qrCodeHash);
        
      } catch (error) {
        // Si no es JSON, tratar como hash directo
        validateQRCodeWithFirebase(manualQRInput.trim());
      }
      setManualQRInput('');
    }
  };

  const handleDemoScan = (member: any) => {
    setScanned(true);
    setScannerActive(false);
    setLastScannedMember(member);
    
    // Simulate validation delay
    setTimeout(() => {
      Alert.alert(
        'Acceso Permitido',
        `Bienvenido, ${member.name}!\n\nDirección: ${member.homeAddress}\nVehículo: ${member.vehicleInfo || 'Ninguno'}\nNivel de Acceso: ${member.accessLevel}`,
        [
          { text: 'Permitir Acceso', style: 'default' },
          { text: 'Denegar Acceso', style: 'destructive', onPress: () => setScanned(false) },
        ]
      );
    }, 1000);
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', onPress: logout, style: 'destructive' },
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

  try {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header moved inside ScrollView */}
          <View style={styles.gradientBackground}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <View style={styles.badgeContainer}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>🛡️</Text>
                  </View>
                  <View style={styles.headerText}>
                    <Text style={styles.headerTitle}>
                      {currentPage === 'scanner' ? 'Escáner de Seguridad' : 'Registro de Invitados'}
                    </Text>
                    <Text style={styles.headerSubtitle}>
                      Guardia: {guardName} | Placa: {guardBadgeNumber}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Navigation Tabs */}
            <View style={styles.navigationTabs}>
              <TouchableOpacity
                style={[
                  styles.navTab,
                  currentPage === 'scanner' && styles.navTabActive
                ]}
                onPress={() => setCurrentPage('scanner')}
              >
                <Text style={[
                  styles.navTabText,
                  currentPage === 'scanner' && styles.navTabTextActive
                ]}>
                  📱 Escáner QR
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.navTab,
                  currentPage === 'guests' && styles.navTabActive
                ]}
                onPress={() => setCurrentPage('guests')}
              >
                <Text style={[
                  styles.navTabText,
                  currentPage === 'guests' && styles.navTabTextActive
                ]}>
                  👥 Invitados
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Scanner Page Content */}
          {currentPage === 'scanner' && (
            <>
              {/* Vista de cámara real siempre activa */}
              <View style={styles.scannerContainer}>
                {hasPermission && scannerActive ? (
                  <RealCameraScanner
                    isScanning={isScanning}
                    onBarCodeScanned={handleBarCodeScanned}
                    onManualInput={() => setScannerActive(false)}
                    onResumeScanning={resumeScanning}
                  />
                ) : (
                  <View style={styles.placeholderContainer}>
                    <View style={styles.placeholderIcon}>
                      <Text style={styles.placeholderIconText}>📱</Text>
                    </View>
                    <Text style={styles.placeholderTitle}>Cámara Desactivada</Text>
                    <Text style={styles.placeholderSubtitle}>
                      Toca el botón para activar la cámara y comenzar a escanear{'\n'}códigos QR para validación de acceso
                    </Text>
                  </View>
                )}
                
                {/* Información del estado de la cámara */}
                {scannerActive && (
                  <View style={styles.cameraInfoContainer}>
                    <Text style={styles.cameraInfoText}>
                      📹 {isScanning ? 'Cámara simulada funcionando correctamente' : 'Cámara pausada temporalmente'}
                    </Text>
                    <Text style={styles.cameraInfoSubtext}>
                      {isScanning 
                        ? 'La cámara está escaneando códigos QR automáticamente'
                        : 'La cámara está pausada. Toca "Reanudar Escaneo" para continuar'
                      }
                    </Text>
                    
                    {/* Nota sobre implementación temporal */}
                    <View style={styles.implementationNote}>
                      <Text style={styles.implementationNoteText}>
                        💡 Nota: Usando simulación temporal mientras resolvemos compatibilidad
                      </Text>
                      <Text style={styles.implementationNoteSubtext}>
                        Para implementar la cámara real, ver CAMERA_IMPLEMENTATION.md
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Rest of the content */}
              <View style={styles.manualInputContainer}>
                <View style={styles.manualInputHeader}>
                  <Text style={styles.manualInputTitle}>🔍 Entrada Manual de Código QR</Text>
                  <Text style={styles.manualInputSubtitle}>
                    Ingresa el código QR manualmente para pruebas o respaldo{'\n'}de validación
                  </Text>
                </View>
                
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.manualInput}
                    placeholder="Ingresa el código QR manualmente"
                    value={manualQRInput}
                    onChangeText={setManualQRInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  
                  <TouchableOpacity
                    style={[styles.manualScanButton, validating && styles.manualScanButtonDisabled]}
                    onPress={handleManualQRSubmit}
                    disabled={validating}
                  >
                    <Text style={styles.manualScanButtonText}>🔍</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.controlsContainer}>
                {!scannerActive && (
                  <TouchableOpacity style={styles.scanButton} onPress={() => setScannerActive(true)}>
                    <Text style={styles.scanButtonText}>📷 Activar Cámara</Text>
                  </TouchableOpacity>
                )}
                
                {scannerActive && (
                  <TouchableOpacity style={styles.stopButton} onPress={() => setScannerActive(false)}>
                    <Text style={styles.stopButtonText}>⏹️ Desactivar Cámara</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.demoContainer}>
                <View style={styles.demoHeader}>
                  <Text style={styles.demoTitle}>🧪 Códigos QR de Prueba</Text>
                  <Text style={styles.demoSubtitle}>
                    Toca para simular el escaneo de estos códigos QR para desarrollo
                  </Text>
                </View>
                
                {mockMembers.map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    style={styles.demoMemberInfo}
                    onPress={() => handleDemoScan(member)}
                  >
                    <Text style={styles.demoMemberName}>{member.name}</Text>
                    <Text style={styles.demoMemberDetails}>
                      {member.homeAddress} • {member.accessLevel}
                    </Text>
                    <View style={styles.demoMemberArrow}>
                      <Text style={styles.demoMemberArrowText}>→</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {scanned && lastScannedMember && (
                <View style={styles.resultContainer}>
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultTitle}>✅ Resultado del Escaneo</Text>
                  </View>
                  
                  <View style={styles.resultMemberInfo}>
                    <Text style={styles.resultMemberName}>{lastScannedMember.name}</Text>
                    <Text style={styles.resultMemberDetails}>
                      {lastScannedMember.homeAddress} • {lastScannedMember.accessLevel}
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}

          {/* Guests Page Content */}
          {currentPage === 'guests' && (
            <View style={styles.guestsPageContainer}>
              <View style={styles.guestsPageHeader}>
                <Text style={styles.guestsPageTitle}>👥 Gestión de Invitados</Text>
                <Text style={styles.guestsPageSubtitle}>
                  Administra el registro y acceso de invitados al complejo
                </Text>
              </View>

              <View style={styles.guestsStatsContainer}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>12</Text>
                  <Text style={styles.statLabel}>Hoy</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>47</Text>
                  <Text style={styles.statLabel}>Esta Semana</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>156</Text>
                  <Text style={styles.statLabel}>Este Mes</Text>
                </View>
              </View>

              <View style={styles.guestsActionsContainer}>
                <TouchableOpacity style={styles.primaryActionButton}>
                  <Text style={styles.primaryActionIcon}>➕</Text>
                  <Text style={styles.primaryActionText}>Registrar Nuevo Invitado</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.secondaryActionButton}>
                  <Text style={styles.secondaryActionIcon}>📋</Text>
                  <Text style={styles.secondaryActionText}>Ver Historial Completo</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.recentGuestsContainer}>
                <Text style={styles.recentGuestsTitle}>🕒 Invitados Recientes</Text>
                <View style={styles.recentGuestItem}>
                  <View style={styles.recentGuestInfo}>
                    <Text style={styles.recentGuestName}>María González</Text>
                    <Text style={styles.recentGuestDetails}>Visita a Juan Pérez • 2:30 PM</Text>
                  </View>
                  <View style={styles.recentGuestStatus}>
                    <Text style={styles.recentGuestStatusText}>✅ Activo</Text>
                  </View>
                </View>
                
                <View style={styles.recentGuestItem}>
                  <View style={styles.recentGuestInfo}>
                    <Text style={styles.recentGuestName}>Carlos Rodríguez</Text>
                    <Text style={styles.recentGuestDetails}>Servicio técnico • 1:15 PM</Text>
                  </View>
                  <View style={styles.recentGuestStatus}>
                    <Text style={styles.recentGuestStatusText}>🔄 En curso</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          <View style={styles.actionsContainer}>
            <Text style={styles.actionsTitle}>⚡ Acciones Rápidas</Text>
            
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionIcon}>📞</Text>
                <Text style={styles.actionText}>Llamar Supervisor</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionIcon}>🚨</Text>
                <Text style={styles.actionText}>Reportar Incidente</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionIcon}>📋</Text>
                <Text style={styles.actionText}>Historial de Acceso</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionIcon}>⚙️</Text>
                <Text style={styles.actionText}>Configuración</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>🚪 Cerrar Sesión</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  } catch (error) {
    console.error('Error rendering GuardScannerScreen:', error);
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error al cargar la pantalla</Text>
          <Text style={styles.errorMessage}>Por favor, inténtalo de nuevo</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => {}}>
            <Text style={styles.retryButtonText}>🔄 Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
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
    backgroundColor: '#dc2626',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    textAlign: 'center',
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  badge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    marginBottom: 15,
  },
  badgeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  headerText: {
    alignItems: 'center',
  },
  navigationTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 8,
    marginTop: 10,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 15,
    marginHorizontal: 4,
  },
  navTabActive: {
    backgroundColor: '#dc2626',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  navTabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  navTabTextActive: {
    color: 'white',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scannerContainer: {
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
  cameraPreview: {
    flex: 1,
    height: 300,
    backgroundColor: '#1f2937',
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 20,
  },
  scanFrame: {
    width: '80%',
    height: '60%',
    borderWidth: 3,
    borderColor: '#10b981',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  scanInstructions: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  scanSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 20,
  },
  manualInputButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 15,
    padding: 18,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  manualInputButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholderContainer: {
    alignItems: 'center',
    padding: 30,
  },
  placeholderIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  placeholderIconText: {
    fontSize: 40,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  placeholderSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  manualInputContainer: {
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
  manualInputHeader: {
    marginBottom: 20,
  },
  manualInputTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  manualInputSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  manualInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 15,
    padding: 18,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 15,
    color: '#1f2937',
  },
  manualScanButton: {
    backgroundColor: '#10b981',
    borderRadius: 15,
    padding: 18,
    width: 60,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  manualScanButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  manualScanButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  controlsContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scanButton: {
    backgroundColor: '#10b981',
    borderRadius: 15,
    padding: 18,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  stopButton: {
    backgroundColor: '#ef4444',
    borderRadius: 15,
    padding: 18,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  stopButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  rescanButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 15,
    padding: 18,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  rescanButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  demoContainer: {
    marginBottom: 20,
  },
  demoHeader: {
    marginBottom: 20,
  },
  demoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  demoSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  demoMemberInfo: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  demoMemberName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 5,
  },
  demoMemberDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 5,
  },
  demoMemberArrow: {
    marginLeft: 15,
  },
  demoMemberArrowText: {
    fontSize: 24,
    color: '#6b7280',
  },
  resultContainer: {
    marginBottom: 20,
  },
  resultHeader: {
    marginBottom: 15,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  resultMemberInfo: {
    alignItems: 'center',
  },
  resultMemberName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  resultMemberDetails: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  resultAccess: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  resultTime: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 15,
    padding: 15,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  guestsPageContainer: {
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
  guestsPageHeader: {
    marginBottom: 20,
  },
  guestsPageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  guestsPageSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  guestsStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statCard: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  guestsActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  primaryActionButton: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    marginRight: 10,
  },
  primaryActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  primaryActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginLeft: 10,
  },
  secondaryActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  secondaryActionText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  recentGuestsContainer: {
    marginBottom: 20,
  },
  recentGuestsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
    textAlign: 'center',
  },
  recentGuestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  recentGuestInfo: {
    flex: 1,
  },
  recentGuestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 3,
  },
  recentGuestDetails: {
    fontSize: 13,
    color: '#6b7280',
  },
  recentGuestStatus: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  recentGuestStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  resumeScanButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 15,
    padding: 18,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 10,
  },
  resumeScanButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  cameraStatusIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  cameraStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
    marginRight: 8,
  },
  cameraStatusDotActive: {
    backgroundColor: '#ef4444',
  },
  cameraStatusDotBlink: {
    opacity: 0.5,
  },
  cameraStatusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  cameraInfoContainer: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 15,
    padding: 15,
    marginTop: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cameraInfoText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 5,
  },
  cameraInfoSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  implementationNote: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  implementationNoteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 5,
  },
  implementationNoteSubtext: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});


