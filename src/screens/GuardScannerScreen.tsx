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
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../utils/authContext';
import { Guard } from '../types';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { RealCameraScanner } from '../components/RealCameraScanner';
import { BottomTabNavigator } from '../components/BottomTabNavigator';
import { QRValidationService } from '../utils/qrValidationService';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { GuardGuestScreen } from './GuardGuestScreen';


const { width, height } = Dimensions.get('window');

export const GuardScannerScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [scanned, setScanned] = useState(false);
  const [validating, setValidating] = useState(false);
  const [lastScannedMember, setLastScannedMember] = useState<any>(null);
  const [manualQRInput, setManualQRInput] = useState('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scannerActive, setScannerActive] = useState(true); // Cámara activa por defecto

  const [isScanning, setIsScanning] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [showPassScreen, setShowPassScreen] = useState(false);
  const [passedMember, setPassedMember] = useState<any>(null);
  const [showNoValidScreen, setShowNoValidScreen] = useState(false);
  const [noValidMessage, setNoValidMessage] = useState<string>('');
  const [manualCodeInput, setManualCodeInput] = useState<string>('');
  const [isValidatingManual, setIsValidatingManual] = useState(false);

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

  // Navegación automática al chat cuando se selecciona la pestaña
  useEffect(() => {
    if (activeTab === 'chat') {
      // Navegación inmediata al chat sin pantalla intermedia
      navigation.navigate('GuardChat', {
        onGoBack: () => {
          // Regresar a la pestaña de inicio cuando se regrese del chat
          setActiveTab('home');
        }
      });
    }
  }, [activeTab, navigation]);

  // Función para manejar el escaneo real de códigos QR
  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (!isScanning || scanned) return; // Evitar múltiples escaneos
    
    console.log('📷 [QR-SCAN] Código QR escaneado:', { type, data });
    setScanned(true);
    setIsScanning(false);
    
    try {
      // Intentar parsear como JSON primero
      const parsedData = JSON.parse(data);
      console.log('📱 [QR-SCAN] QR parseado como JSON:', parsedData);
      const { qrCodeHash, name, accessLevel, expiry } = parsedData;
      
      console.log('📱 [QR-SCAN] Datos extraídos:');
      console.log('📱 [QR-SCAN] qrCodeHash:', qrCodeHash);
      console.log('📱 [QR-SCAN] name:', name);
      console.log('📱 [QR-SCAN] accessLevel:', accessLevel);
      console.log('📱 [QR-SCAN] expiry:', expiry);
      
      // Validar en la nube
      validateQRCodeInCloud(qrCodeHash);
      
    } catch (error) {
      // Si no es JSON, tratar como hash directo
      console.log('📱 [QR-SCAN] No es JSON, usando hash directo:', data);
      validateQRCodeInCloud(data);
    }
  };

  // Función para reanudar el escaneo después de procesar un código
  const resumeScanning = () => {
    setScanned(false);
    setIsScanning(true);
    setLastScannedMember(null);
    setShowPassScreen(false);
    setPassedMember(null);
    setShowNoValidScreen(false);
    setNoValidMessage('');
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
    { id: 1, name: 'John Doe', homeAddress: '123 Main St', vehicleInfo: 'Car', accessLevel: 'resident', qrCodeHash: 'member_1_john@example.com', qrCodeExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    { id: 2, name: 'Jane Smith', homeAddress: '456 Oak Ave', vehicleInfo: 'Bike', accessLevel: 'guest', qrCodeHash: 'member_2_jane@example.com', qrCodeExpiry: new Date(Date.now() + 12 * 60 * 60 * 1000) },
    { id: 3, name: 'Peter Jones', homeAddress: '789 Pine Ln', vehicleInfo: 'None', accessLevel: 'resident', qrCodeHash: 'member_3_peter@example.com', qrCodeExpiry: new Date(Date.now() + 36 * 60 * 60 * 1000) },
  ];

  const validateQRCodeInCloud = async (qrCodeHash: string) => {
    setValidating(true);
    try {
      console.log('🔍 [QR-VALIDATE] Iniciando validación en la nube...');
      console.log('🔍 [QR-VALIDATE] qrCodeHash:', qrCodeHash);
      console.log('🔍 [QR-VALIDATE] user.id:', user?.id);
      console.log('🔍 [QR-VALIDATE] user.organizationId:', user?.organizationId);
      
      // Usar el nuevo servicio de validación en la nube con la organización del usuario
      const organizationId = user?.organizationId;
      if (!organizationId) {
        console.error('❌ [QR-VALIDATE] Usuario sin organización');
        throw new Error('No se pudo obtener la organización del usuario');
      }
      
      const qrService = new QRValidationService(organizationId);
      console.log('🔍 [QR-VALIDATE] Servicio creado para organización:', organizationId);
      
      const result = await qrService.validateQRCode(qrCodeHash, user.id, user.name);
      console.log('🔍 [QR-VALIDATE] Resultado de validación:', result);
      
      if (result.valid && result.member) {
        console.log('✅ Acceso permitido para:', result.member.name);
        
        // Mostrar información del miembro
        setLastScannedMember({
          id: result.member.id,
          name: result.member.name,
          homeAddress: result.member.homeAddress || 'No especificada',
          vehicleInfo: 'No disponible', // Campo no implementado aún
          accessLevel: result.member.accessLevel || 'No especificado'
        });
        
        // Mostrar pantalla verde de PASA
        setShowPassScreen(true);
        setPassedMember(result.member);
      } else {
        console.log('❌ Acceso denegado:', result.message);
        // Mostrar pantalla roja de NO VALIDO
        setShowNoValidScreen(true);
        setNoValidMessage(result.message || 'Código QR inválido');
      }
    } catch (error) {
      console.error('❌ Error en validación en la nube:', error);
      Alert.alert(
        'Error de Validación',
        'Error conectando con la nube. Usando validación local como respaldo.',
        [
          { text: 'OK', onPress: () => handleMockValidation(qrCodeHash) },
        ]
      );
    } finally {
      setValidating(false);
    }
  };

  const handleMockValidation = (qrCodeHash: string) => {
    console.log('Validando hash:', qrCodeHash);
    
    // Buscar en la base de datos mock
    const member = mockMembers.find(m => m.qrCodeHash === qrCodeHash);
    
    if (member) {
      setLastScannedMember(member);
      
      // Check if QR code is expired
      if (new Date() > member.qrCodeExpiry) {
        Alert.alert(
          'NO PASA',
          `❌ Código QR expirado para ${member.name}. Por favor, solicite un nuevo código.`,
          [
            { text: 'OK', onPress: () => setScanned(false) },
          ]
        );
        return;
      }
      
      // Grant access
      Alert.alert(
        'PASA',
        `✅ ${member.name}\n\nDirección: ${member.homeAddress}\nVehículo: ${member.vehicleInfo || 'Ninguno'}\nNivel de Acceso: ${member.accessLevel}`,
        [
          { text: 'Permitir Acceso', style: 'default' },
          { text: 'Denegar Acceso', style: 'destructive', onPress: () => setScanned(false) },
        ]
      );
    } else {
      // Si no se encuentra, mostrar información del QR escaneado
      console.log('Hash no encontrado en la base de datos mock');
      Alert.alert(
        'NO PASA',
        `❌ Código QR no reconocido\n\nHash: ${qrCodeHash}\n\nPor favor, consulte con el residente.`,
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
        
        // Validar en la nube
        validateQRCodeInCloud(qrCodeHash);
        
      } catch (error) {
        // Si no es JSON, tratar como hash directo
        validateQRCodeInCloud(manualQRInput.trim());
      }
      setManualQRInput('');
    }
  };

  // Función para validar código manual de 6 dígitos
  const validateManualCode = async () => {
    if (!manualCodeInput.trim() || manualCodeInput.length !== 6) {
      Alert.alert('Error', 'Por favor ingrese un código de 6 dígitos');
      return;
    }

    setIsValidatingManual(true);
    try {
      console.log('🔍 [MANUAL-VALIDATE] Validando código manual:', manualCodeInput);
      
      // Buscar el código manual en la base de datos
      const organizationId = user?.organizationId;
      if (!organizationId) {
        throw new Error('No se pudo obtener la organización del usuario');
      }

      const qrService = new QRValidationService(organizationId);
      
      // Buscar usuarios que tengan este código manual
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('organizationId', '==', organizationId)
      );
      
      const snapshot = await getDocs(q);
      let foundMember: any = null;
      
      // Buscar el miembro que tenga este código manual
      for (const doc of snapshot.docs) {
        const userData = doc.data();
        if (userData.userType === 'member') {
          // Generar el código manual del miembro usando la misma lógica
          const memberIdHash = doc.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const memberManualCode = String((memberIdHash % 900000) + 100000);
          
          if (memberManualCode === manualCodeInput) {
            foundMember = {
              id: doc.id,
              ...userData
            };
            break;
          }
        }
      }

      if (!foundMember) {
        console.log('❌ [MANUAL-VALIDATE] Código manual no encontrado');
        setShowNoValidScreen(true);
        setNoValidMessage('Código manual no encontrado. Verifique que el código sea correcto.');
        return;
      }

      // Verificar si el usuario está activo
      if (foundMember.isActive === false) {
        console.log('❌ [MANUAL-VALIDATE] Usuario inactivo:', foundMember.name);
        setShowNoValidScreen(true);
        setNoValidMessage(`Usuario ${foundMember.name} está inactivo. Contacte al administrador.`);
        return;
      }

      // Verificar expiración del QR
      const expiryDate = foundMember.qrCodeExpiry instanceof Timestamp 
        ? foundMember.qrCodeExpiry.toDate() 
        : new Date(foundMember.qrCodeExpiry);
      
      if (new Date() > expiryDate) {
        console.log('❌ [MANUAL-VALIDATE] QR expirado para:', foundMember.name);
        setShowNoValidScreen(true);
        setNoValidMessage(`Código expirado para ${foundMember.name}. Por favor, solicite un nuevo código.`);
        return;
      }

      // Registrar acceso exitoso usando el método público
      try {
        await qrService.validateQRCode(foundMember.qrCodeHash || 'manual_code', user.id, user.name);
      } catch (error) {
        console.log('⚠️ [MANUAL-VALIDATE] Error registrando acceso, pero continuando...');
      }

      console.log('✅ [MANUAL-VALIDATE] Acceso permitido para:', foundMember.name);
      
      // Mostrar información del miembro
      setLastScannedMember({
        id: foundMember.id,
        name: foundMember.name,
        homeAddress: foundMember.homeAddress || 'No especificada',
        vehicleInfo: 'No disponible',
        accessLevel: foundMember.accessLevel || 'No especificado'
      });
      
      // Mostrar pantalla verde de PASA
      setShowPassScreen(true);
      setPassedMember(foundMember);
      
    } catch (error) {
      console.error('❌ [MANUAL-VALIDATE] Error validando código manual:', error);
      setShowNoValidScreen(true);
      setNoValidMessage('Error validando el código manual. Intente nuevamente.');
    } finally {
      setIsValidatingManual(false);
      setManualCodeInput('');
    }
  };

  const handleDemoScan = (member: any) => {
    setScanned(true);
    setScannerActive(false);
    setLastScannedMember(member);
    
    // Simulate validation delay
    setTimeout(() => {
      Alert.alert(
        'PASA',
        `✅ ${member.name}\n\nDirección: ${member.homeAddress}\nVehículo: ${member.vehicleInfo || 'Ninguno'}\nNivel de Acceso: ${member.accessLevel}`,
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
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        
        {/* Header Minimalista */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
            </View>
          </View>
          
          <View style={styles.headerCenter}>
            <Text style={styles.appTitle}>SafeGate</Text>
            <Text style={styles.appSubtitle}>Portal de Guardias</Text>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={22} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
        

        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Página del Scanner */}
          {activeTab === 'home' && (
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
              </View>
              
              {/* Campo de validación manual */}
              <View style={styles.manualValidationContainer}>
                <Text style={styles.manualValidationTitle}>Validación Manual</Text>
                <Text style={styles.manualValidationSubtitle}>
                  Ingrese el código de 6 dígitos del residente
                </Text>
                
                <View style={styles.manualInputRow}>
                  <TextInput
                    style={styles.manualCodeInput}
                    placeholder="123456"
                    placeholderTextColor="#999"
                    value={manualCodeInput}
                    onChangeText={setManualCodeInput}
                    keyboardType="numeric"
                    maxLength={6}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity 
                    style={[styles.validateButton, isValidatingManual && styles.validateButtonDisabled]}
                    onPress={validateManualCode}
                    disabled={isValidatingManual}
                  >
                    {isValidatingManual ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.validateButtonText}>Validar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Tarjeta de Logs de Seguridad */}
              <View style={styles.securityLogsCard}>
                <TouchableOpacity 
                  style={styles.securityLogsButton}
                  onPress={() => navigation.navigate('SecurityLogs')}
                >
                  <View style={styles.securityLogsIcon}>
                    <Ionicons name="shield-checkmark" size={24} color="#ffffff" />
                  </View>
                  <View style={styles.securityLogsContent}>
                    <Text style={styles.securityLogsTitle}>Logs de Seguridad</Text>
                    <Text style={styles.securityLogsSubtitle}>
                      Ver historial de accesos y actividad
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </>
          )}



          {/* Página del Invitado */}
          {activeTab === 'guest' && (
            <GuardGuestScreen />
          )}

          {/* Página del Perfil */}
          {activeTab === 'profile' && (
            <View style={styles.profileContainer}>
              <Text style={styles.profileTitle}>Perfil del Guardia</Text>
              <Text style={styles.profileSubtitle}>
                Información de tu cuenta y configuración
              </Text>
              
              {/* Información del Guardia */}
              <View style={styles.guardInfoCard}>
                <Text style={styles.guardInfoTitle}>Información Personal</Text>
                <View style={styles.guardInfoRow}>
                  <Text style={styles.guardInfoLabel}>Nombre:</Text>
                  <Text style={styles.guardInfoValue}>{guardName}</Text>
                </View>
                <View style={styles.guardInfoRow}>
                  <Text style={styles.guardInfoLabel}>Placa:</Text>
                  <Text style={styles.guardInfoValue}>{guardBadgeNumber}</Text>
                </View>
                <View style={styles.guardInfoRow}>
                  <Text style={styles.guardInfoLabel}>Turno:</Text>
                  <Text style={styles.guardInfoValue}>{guardShiftHours}</Text>
                </View>
              </View>

              {/* Botón de Cerrar Sesión */}
              <View style={styles.logoutContainer}>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                  <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}


        </ScrollView>
        
        {/* Bottom Tab Navigator */}
        <BottomTabNavigator 
          activeTab={activeTab} 
          onTabPress={setActiveTab} 
        />
        
        {/* Pantalla verde de PASA */}
        {showPassScreen && passedMember && (
          <View style={styles.passScreenOverlay}>
            <View style={styles.passScreenContent}>
              {/* Icono de palomita */}
              <View style={styles.checkmarkContainer}>
                <Text style={styles.checkmarkIcon}>✓</Text>
              </View>
              
              {/* Palabra PASA */}
              <Text style={styles.passText}>PASA</Text>
              
              {/* Botón para cerrar */}
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setShowPassScreen(false);
                  setPassedMember(null);
                  resumeScanning();
                }}
              >
                <Text style={styles.closeButtonText}>Continuar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Pantalla roja de NO VALIDO */}
        {showNoValidScreen && (
          <View style={styles.noValidScreenOverlay}>
            <View style={styles.noValidScreenContent}>
              {/* Icono de tache */}
              <View style={styles.crossContainer}>
                <Text style={styles.crossIcon}>✗</Text>
              </View>
              
              {/* Palabra NO VALIDO */}
              <Text style={styles.noValidText}>NO VALIDO</Text>
              
              {/* Mensaje de error */}
              <Text style={styles.errorMessage}>{noValidMessage}</Text>
              
              {/* Botón para cerrar */}
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setShowNoValidScreen(false);
                  setNoValidMessage('');
                  resumeScanning();
                }}
              >
                <Text style={styles.closeButtonText}>Continuar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
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
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 11,
    color: '#6c757d',
    fontWeight: '500',
    marginTop: 1,
    letterSpacing: 0.3,
  },
  notificationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  gradientBackground: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },

  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    marginBottom: 15,
  },
  headerIcon: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  headerText: {
    alignItems: 'center',
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

  chatButtonIcon: {
    fontSize: 24,
    color: 'white',
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
    paddingTop: 20,
  },
  scannerContainer: {
    height: 500,
    backgroundColor: '#ffffff',
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    justifyContent: 'center',
    flex: 1,
  },
  placeholderIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  placeholderIconText: {
    fontSize: 40,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  placeholderSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 24,
  },
  // Estilos para validación manual
  manualValidationContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  manualValidationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  manualValidationSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  manualInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  manualCodeInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    letterSpacing: 2,
  },
  validateButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    paddingHorizontal: 24,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  validateButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  validateButtonText: {
    color: '#ffffff',
    fontSize: 16,
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
    backgroundColor: '#dc3545',
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
    color: '#ffffff',
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
  logoutContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },

  // Estilos para el chat
  chatContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  chatSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 24,
  },
  chatPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  chatPlaceholderText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 24,
  },
  chatButton: {
    backgroundColor: '#4CAF50',
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  chatButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  // Estilos para el perfil
  profileContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  profileTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  profileSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 24,
  },
  guardInfoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 25,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  guardInfoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  guardInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  guardInfoLabel: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  guardInfoValue: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
  },

  // Estilos para la pantalla verde de PASA
  passScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#22c55e', // Verde
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  passScreenContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  checkmarkContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  checkmarkIcon: {
    fontSize: 80,
    color: 'white',
    fontWeight: 'bold',
  },
  passText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 40,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Estilos para la pantalla roja de NO VALIDO
  noValidScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#dc2626', // Rojo
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  noValidScreenContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  crossContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  crossIcon: {
    fontSize: 80,
    color: 'white',
    fontWeight: 'bold',
  },
  noValidText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 18,
    color: 'white',
    marginBottom: 40,
    textAlign: 'center',
    opacity: 0.9,
    paddingHorizontal: 20,
  },
  securityLogsCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  securityLogsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  securityLogsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  securityLogsContent: {
    flex: 1,
  },
  securityLogsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  securityLogsSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});


