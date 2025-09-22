import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../utils/authContext';
import { Guard } from '../types';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, uploadImageToStorage } from '../utils/firebase';
import { useFormConfigs } from '../hooks/useFormConfigs';
import { DynamicFormField } from '../components/DynamicFormField';
import { FormSelector } from '../components/FormSelector';
import { FormFieldConfig, CommunityFormConfig } from '../types/formConfig';

interface AccessLog {
  id: string;
  userId?: string;
  userName?: string;
  guestId?: string;
  guestName?: string;
  action: string;
  timestamp: string | Date;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failed' | 'blocked';
  location: string;
  organizationId?: string;
  guardId?: string;
  guardName?: string;
  qrCodeHash?: string;
  accessType?: 'entry' | 'exit';
  verificationMethod?: 'qr_scan' | 'manual' | 'card' | 'biometric';
}

export const GuardGuestScreen: React.FC = () => {
  const { user } = useAuth();
  const guard = user as Guard;

  // Debug: Log del guardia y su organización (solo una vez)
  useEffect(() => {
    console.log('🔍 [GUARD-GUEST-SCREEN] Guardia logueado:', {
      id: guard?.id,
      name: guard?.name,
      email: guard?.email,
      organizationId: guard?.organizationId,
      userType: guard?.userType
    });
  }, [guard?.id]); // Solo se ejecuta cuando cambia el ID del guardia

  // Hook para obtener todos los formularios disponibles
  const { formConfigs, loading: configsLoading, error: configsError } = useFormConfigs(guard.organizationId);
  
  // Estado para el formulario seleccionado
  const [selectedForm, setSelectedForm] = useState<CommunityFormConfig | null>(null);
  
  // Estados del formulario dinámico
  const [formData, setFormData] = useState<Record<string, string | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [licensePlatePhoto, setLicensePlatePhoto] = useState<string | null>(null);
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);
  const [isUploadingId, setIsUploadingId] = useState(false);

  // Estados para logs de seguridad
  const [securityLogs, setSecurityLogs] = useState<AccessLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsRefreshing, setLogsRefreshing] = useState(false);
  
  // Estado para pestañas
  const [activeTab, setActiveTab] = useState<'form' | 'logs'>('form');
  
  // Estado para modal de detalle de log
  const [selectedLog, setSelectedLog] = useState<AccessLog | null>(null);
  const [showLogDetail, setShowLogDetail] = useState(false);

  // Solicitar permisos de cámara al cargar el componente
  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      setHasCameraPermission(status === 'granted');
    };
    getCameraPermissions();
  }, []);

  // Seleccionar automáticamente el primer formulario si solo hay uno
  useEffect(() => {
    console.log('🔍 [GUARD-GUEST-SCREEN] useEffect formConfigs:', {
      formConfigsLength: formConfigs.length,
      selectedFormExists: !!selectedForm,
      selectedFormName: selectedForm?.name
    });
    
    if (formConfigs.length === 1 && !selectedForm) {
      console.log('🔍 [GUARD-GUEST-SCREEN] Seleccionando formulario automáticamente:', formConfigs[0]);
      
      // Debug: Log de los campos del formulario
      if (formConfigs[0].sections) {
        formConfigs[0].sections.forEach((section, sectionIndex) => {
          console.log(`🔍 [GUARD-GUEST-SCREEN] Sección ${sectionIndex + 1}:`, section.title);
          section.fields.forEach((field, fieldIndex) => {
            console.log(`🔍 [GUARD-GUEST-SCREEN] Campo ${fieldIndex + 1}:`, {
              id: field.id,
              label: field.label,
              type: field.type,
              required: field.required
            });
          });
        });
      }
      
      setSelectedForm(formConfigs[0]);
      console.log('✅ [GUARD-GUEST-SCREEN] Formulario seleccionado automáticamente:', formConfigs[0].name);
    }
  }, [formConfigs, selectedForm]);

  // Función para limpiar el formulario
  const clearForm = () => {
    setFormData({});
  };

  // Función para cargar logs de seguridad desde Firebase
  const fetchSecurityLogs = async () => {
    try {
      setLogsLoading(true);
      console.log('🔍 [SECURITY-LOGS] Cargando logs de seguridad desde Firebase...');
      
      if (!guard?.organizationId) {
        console.warn('⚠️ [SECURITY-LOGS] No hay organizationId disponible');
        setSecurityLogs([]);
        return;
      }

      // Obtener logs de seguridad desde Firebase
      const { collection, getDocs, query, where, limit } = await import('firebase/firestore');
      const { db } = await import('../utils/firebase');
      
      const q = query(
        collection(db, 'securityLogs'),
        where('organizationId', '==', guard.organizationId),
        limit(20)
      );

      const querySnapshot = await getDocs(q);
      const logs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Ordenar por timestamp en el cliente (más reciente primero)
      const sortedLogs = logs.sort((a, b) => {
        const timestampA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
        const timestampB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
        return timestampB.getTime() - timestampA.getTime();
      });

      setSecurityLogs(sortedLogs);
      console.log('✅ [SECURITY-LOGS] Logs cargados exitosamente desde Firebase:', sortedLogs.length);
    } catch (error) {
      console.error('❌ [SECURITY-LOGS] Error cargando logs desde Firebase:', error);
      setSecurityLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  // Función para refrescar logs
  const onRefreshLogs = async () => {
    setLogsRefreshing(true);
    await fetchSecurityLogs();
    setLogsRefreshing(false);
  };

  // Función para cambiar de pestaña
  const switchTab = (tab: 'form' | 'logs') => {
    setActiveTab(tab);
    if (tab === 'logs' && securityLogs.length === 0) {
      fetchSecurityLogs();
    }
  };

  // Funciones auxiliares para formatear logs
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#10b981';
      case 'failed': return '#ef4444';
      case 'blocked': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success': return 'Exitoso';
      case 'failed': return 'Fallido';
      case 'blocked': return 'Bloqueado';
      default: return 'Desconocido';
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'guest_entry': return 'Entrada de Invitado';
      case 'qr_scan': return 'Escaneo QR';
      case 'member_entry': return 'Entrada de Miembro';
      case 'login': return 'Login';
      case 'logout': return 'Logout';
      default: return action;
    }
  };

  const getMethodText = (method?: string) => {
    switch (method) {
      case 'qr_scan': return 'QR';
      case 'manual': return 'Manual';
      case 'card': return 'Tarjeta';
      case 'biometric': return 'Biométrico';
      default: return 'N/A';
    }
  };

  const formatTimestamp = (timestamp: string | Date) => {
    if (!timestamp) {
      return 'Fecha y Hora Desconocida';
    }

    let date;
    if (timestamp.toDate) { // Firebase Timestamp object
      date = timestamp.toDate();
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      date = timestamp; // Assume it's already a Date object
    }

    if (isNaN(date.getTime())) {
      return 'Fecha Inválida';
    }

    // Formato: 9:34PM 24/02/25 (día/mes/año)
    const timePart = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
    const datePart = date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: '2-digit' 
    });

    return `${timePart} ${datePart}`;
  };

  // Función para manejar la selección de formularios
  const handleSelectForm = (form: CommunityFormConfig) => {
    setSelectedForm(form);
    setFormData({}); // Limpiar datos del formulario anterior
    console.log('🔍 [GUARD-GUEST-SCREEN] Formulario seleccionado:', form.name);
  };

  // Función para mostrar el detalle de un log
  const handleLogPress = (log: AccessLog) => {
    setSelectedLog(log);
    setShowLogDetail(true);
  };

  // Función para cerrar el modal de detalle
  const closeLogDetail = () => {
    setShowLogDetail(false);
    setSelectedLog(null);
  };

  // Función para crear campos de formulario a partir de los datos del log
  const createFormFieldsFromLogData = (logData: any) => {
    if (!logData || typeof logData !== 'object') return [];
    
    // Crear un mapa de IDs de campo a configuración de campo
    const fieldConfigMap = new Map<string, FormFieldConfig>();
    
    // Buscar en todos los formularios disponibles para encontrar la configuración de cada campo
    formConfigs.forEach(form => {
      form.sections?.forEach(section => {
        section.fields?.forEach(field => {
          fieldConfigMap.set(field.id, field);
        });
      });
    });
    
    return Object.entries(logData).map(([key, value]) => {
      // Buscar la configuración del campo
      const fieldConfig = fieldConfigMap.get(key);
      
      return {
        id: key,
        label: fieldConfig?.label || key, // Usar el label del campo o el ID como fallback
        type: fieldConfig?.type || 'text' as const,
        required: fieldConfig?.required || false,
        placeholder: fieldConfig?.placeholder || '',
        options: fieldConfig?.options || undefined,
        value: value as string
      };
    });
  };

  // Función para manejar cambios en los campos del formulario
  const handleFieldChange = (fieldId: string, value: string | null) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  // Función para subir imagen a Firebase Storage
  const uploadPhotoToStorage = async (photoUri: string, type: 'license' | 'id') => {
    try {
      console.log(`📤 [GUARD-GUEST] Subiendo foto de ${type} a Firebase Storage`);
      
      const downloadURL = await uploadImageToStorage(
        photoUri,
        guard.organizationId || 'unknown_org',
        type === 'license' ? 'license_plate' : 'id_document',
        guard.id
      );
      
      console.log(`✅ [GUARD-GUEST] Foto de ${type} subida exitosamente:`, downloadURL);
      return downloadURL;
    } catch (error) {
      console.error(`❌ [GUARD-GUEST] Error subiendo foto de ${type}:`, error);
      throw error;
    }
  };

  // Función genérica para tomar fotos
  const takePhoto = async (type: 'license' | 'id') => {
    if (hasCameraPermission === false) {
      Alert.alert(
        'Permisos de Cámara',
        'Se necesitan permisos de cámara para tomar fotos. Por favor, habilite los permisos en la configuración de la aplicación.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (hasCameraPermission === null) {
      Alert.alert(
        'Solicitando Permisos',
        'Solicitando permisos de cámara...',
        [{ text: 'OK' }]
      );
      return;
    }

    const photoType = type === 'license' ? 'placa del vehículo' : 'identificación';
    
    Alert.alert(
      `Foto de ${photoType}`,
      `¿Cómo desea obtener la foto de ${photoType}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Tomar Foto', 
          onPress: () => openCamera(type)
        },
        { 
          text: 'Seleccionar de Galería', 
          onPress: () => openImagePicker(type)
        },
      ]
    );
  };

  // Función para abrir la cámara
  const openCamera = async (type: 'license' | 'id') => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const photoUri = result.assets[0].uri;
        
        // Mostrar la imagen localmente primero
        if (type === 'license') {
          setLicensePlatePhoto(photoUri);
          setIsUploadingLicense(true);
        } else {
          setIdPhoto(photoUri);
          setIsUploadingId(true);
        }
        
        // Subir a Firebase Storage en segundo plano
        try {
          const downloadURL = await uploadPhotoToStorage(photoUri, type);
          
          // Actualizar con la URL de Firebase Storage
          if (type === 'license') {
            setLicensePlatePhoto(downloadURL);
          } else {
            setIdPhoto(downloadURL);
          }
          
          console.log(`✅ Foto de ${type} subida y guardada exitosamente`);
        } catch (error) {
          console.error(`❌ Error subiendo foto de ${type}:`, error);
          Alert.alert(
            'Advertencia', 
            `La foto de ${type} se tomó pero no se pudo subir al servidor. Se guardará localmente.`,
            [{ text: 'OK' }]
          );
        } finally {
          if (type === 'license') {
            setIsUploadingLicense(false);
          } else {
            setIsUploadingId(false);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error tomando foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto. Inténtalo de nuevo.');
    }
  };

  // Función para abrir el selector de imágenes
  const openImagePicker = async (type: 'license' | 'id') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const photoUri = result.assets[0].uri;
        
        // Mostrar la imagen localmente primero
        if (type === 'license') {
          setLicensePlatePhoto(photoUri);
          setIsUploadingLicense(true);
        } else {
          setIdPhoto(photoUri);
          setIsUploadingId(true);
        }
        
        // Subir a Firebase Storage en segundo plano
        try {
          const downloadURL = await uploadPhotoToStorage(photoUri, type);
          
          // Actualizar con la URL de Firebase Storage
          if (type === 'license') {
            setLicensePlatePhoto(downloadURL);
          } else {
            setIdPhoto(downloadURL);
          }
          
          console.log(`✅ Foto de ${type} subida y guardada exitosamente`);
        } catch (error) {
          console.error(`❌ Error subiendo foto de ${type}:`, error);
          Alert.alert(
            'Advertencia', 
            `La foto de ${type} se seleccionó pero no se pudo subir al servidor. Se guardará localmente.`,
            [{ text: 'OK' }]
          );
        } finally {
          if (type === 'license') {
            setIsUploadingLicense(false);
          } else {
            setIsUploadingId(false);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen. Inténtalo de nuevo.');
    }
  };

  // Función para tomar foto de la placa
  const takeLicensePlatePhoto = () => {
    takePhoto('license');
  };

  // Función para tomar foto de identificación
  const takeIdPhoto = () => {
    takePhoto('id');
  };

  // Función para eliminar foto
  const removePhoto = (type: 'license' | 'id') => {
    if (type === 'license') {
      setLicensePlatePhoto(null);
    } else {
      setIdPhoto(null);
    }
  };

  // Función para validar el formulario
  const validateForm = () => {
    if (!selectedForm || !selectedForm.sections) {
      Alert.alert('Error', 'No hay formulario seleccionado o configurado');
      return false;
    }

    console.log('🔍 [VALIDATE-FORM] Validando formulario:', selectedForm.name);
    console.log('📋 [VALIDATE-FORM] Datos del formulario:', formData);
    
    for (const section of selectedForm.sections) {
      for (const field of section.fields) {
        if (field.required && field.visible) {
          const value = formData[field.id];
          if (!value || (typeof value === 'string' && !value.trim())) {
            Alert.alert('Error', `El campo "${field.label}" es obligatorio`);
            return false;
          }
        }
      }
    }
    
    console.log('✅ [VALIDATE-FORM] Formulario válido');
    return true;
  };

  // Función para registrar la entrada del invitado
  const registerGuestEntry = async () => {
    if (!validateForm()) return;

    // Verificar que hay un formulario seleccionado
    if (!selectedForm) {
      Alert.alert('Error', 'Por favor selecciona un formulario antes de continuar.');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('🔍 [GUEST-REGISTER] Registrando entrada de invitado...');
      console.log('📋 [GUEST-REGISTER] Formulario seleccionado:', selectedForm?.name);
      
      const guestEntry = {
        // Datos del formulario dinámico
        formData: formData,
        
        // Información del formulario usado
        formId: selectedForm.id || 'default_form',
        formName: selectedForm.name || 'Formulario de Invitado',
        
        // Información del guardia
        registeredBy: guard.name || 'Guardia',
        guardId: guard.id || 'unknown_guard',
        guardBadge: guard.badgeNumber || 'N/A',
        
        // Información de la organización
        organizationId: guard.organizationId || 'unknown_org',
        
        // Timestamps
        entryTime: serverTimestamp(),
        status: 'active', // active, completed, cancelled
        
        // Información adicional
        entryDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        entryTimeFormatted: new Date().toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit'
        }),
      };

      // Guardar en Firebase
      const docRef = await addDoc(collection(db, 'guestEntries'), guestEntry);
      console.log('✅ [GUEST-REGISTER] Entrada registrada con ID:', docRef.id);

      // Crear log de seguridad en Firebase
      try {
        // Debug: Log de los datos del formulario
        console.log('🔍 [GUEST-REGISTER] Datos del formulario:', formData);
        
        // Buscar el nombre en los datos del formulario
        const guestName = formData.guestName || 
                         formData['Nombre Completo'] || 
                         formData['nombre-completo'] ||
                         formData['guest-name'] ||
                         Object.values(formData).find(value => 
                           typeof value === 'string' && 
                           value.length > 2 && 
                           !value.includes('@') && 
                           !value.includes('+')
                         ) || 'Invitado';
        
        console.log('🔍 [GUEST-REGISTER] Nombre extraído:', guestName);
        
        const securityLogData = {
          action: 'guest_entry',
          guestName: guestName,
          guestId: docRef.id,
          organizationId: guard.organizationId || 'unknown_org',
          guardId: guard.id || 'unknown_guard',
          guardName: guard.name || 'Guardia',
          formData: formData,
          formId: selectedForm.id || 'default_form',
          formName: selectedForm.name || 'Formulario de Invitado',
          licensePlatePhoto: licensePlatePhoto,
          idPhoto: idPhoto,
          ipAddress: 'N/A', // En móvil no tenemos IP fácilmente
          userAgent: 'SafeGate Mobile App',
          location: 'Portería Principal',
          status: 'success',
          verificationMethod: 'manual',
          timestamp: serverTimestamp()
        };

        // Guardar log de seguridad en Firebase
        const securityLogRef = await addDoc(collection(db, 'securityLogs'), securityLogData);
        console.log('✅ [GUEST-REGISTER] Log de seguridad creado en Firebase:', securityLogRef.id);
      } catch (logError) {
        console.warn('⚠️ [GUEST-REGISTER] Error creando log de seguridad en Firebase:', logError);
        // No interrumpir el flujo principal por errores de logging
      }

      Alert.alert(
        'Entrada Registrada',
        'Se ha registrado la entrada del invitado exitosamente.',
        [
          {
            text: 'Registrar Otro',
            onPress: clearForm,
          },
          {
            text: 'Finalizar',
            style: 'default',
          },
        ]
      );

    } catch (error) {
      console.error('❌ [GUEST-REGISTER] Error registrando entrada:', error);
      Alert.alert(
        'Error',
        'No se pudo registrar la entrada. Por favor, inténtalo de nuevo.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Navegación de Pestañas */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'form' && styles.activeTabButton]}
          onPress={() => switchTab('form')}
        >
          <Ionicons 
            name="person-add" 
            size={20} 
            color={activeTab === 'form' ? '#4CAF50' : '#666'} 
          />
          <Text style={[styles.tabButtonText, activeTab === 'form' && styles.activeTabButtonText]}>
            Invitados
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'logs' && styles.activeTabButton]}
          onPress={() => switchTab('logs')}
        >
          <Ionicons 
            name="shield-checkmark" 
            size={20} 
            color={activeTab === 'logs' ? '#4CAF50' : '#666'} 
          />
          <Text style={[styles.tabButtonText, activeTab === 'logs' && styles.activeTabButtonText]}>
            Logs
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido de las Pestañas */}
      <View style={styles.tabContent}>
        {activeTab === 'form' ? (
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Selector de Formularios */}
            <View style={styles.formSelectorContainer}>
              <FormSelector
                forms={formConfigs}
                selectedForm={selectedForm}
                onSelectForm={handleSelectForm}
                loading={configsLoading}
                error={configsError}
              />
            </View>

            {/* Formulario Dinámico */}
            {configsLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Cargando formularios disponibles...</Text>
              </View>
            ) : configsError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Error cargando formularios: {configsError}</Text>
              </View>
            ) : !selectedForm ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-outline" size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>Selecciona un formulario para continuar</Text>
              </View>
            ) : (
              <View style={styles.sectionsContainer}>
                {selectedForm.sections.map((section) => (
                  <View key={`section-${section.id}`} style={styles.section}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    {section.fields
                      .filter(field => field.visible) // Solo mostrar campos visibles
                      .map((field) => (
                        <DynamicFormField
                          key={`field-${field.id}`}
                          field={field}
                          value={formData[field.id] || null}
                          onChange={(value) => handleFieldChange(field.id, value)}
                          hasCameraPermission={hasCameraPermission}
                        />
                      ))}
                  </View>
                ))}
              </View>
            )}

            {/* Botones de Acción */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={() => {
                  console.log('🔍 [BUTTON-PRESS] Botón presionado, estado actual:', {
                    selectedForm: selectedForm?.name || 'No seleccionado',
                    selectedFormId: selectedForm?.id || 'No ID',
                    formDataKeys: Object.keys(formData),
                    isSubmitting
                  });
                  registerGuestEntry();
                }}
                disabled={isSubmitting}
              >
                <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Registrando...' : 'Registrar Entrada'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearForm}
                disabled={isSubmitting}
              >
                <Ionicons name="refresh" size={20} color="#666" />
                <Text style={styles.clearButtonText}>Limpiar Formulario</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          /* Pestaña de Logs de Seguridad */
          <View style={styles.logsTabContent}>
            {logsLoading ? (
              <View style={styles.logsLoadingContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.logsLoadingText}>Cargando logs de seguridad...</Text>
              </View>
            ) : securityLogs.length === 0 ? (
              <View style={styles.logsEmptyContainer}>
                <Ionicons name="shield-outline" size={64} color="#9ca3af" />
                <Text style={styles.logsEmptyText}>No hay logs de seguridad disponibles</Text>
                <Text style={styles.logsEmptySubtext}>
                  Los logs aparecerán aquí cuando haya actividad de acceso
                </Text>
              </View>
            ) : (
              <ScrollView 
                style={styles.logsList}
                refreshControl={
                  <RefreshControl refreshing={logsRefreshing} onRefresh={onRefreshLogs} />
                }
                showsVerticalScrollIndicator={false}
              >
                {securityLogs.map((log) => {
                  // Determinar si es miembro o desconocido basado en la acción
                  const isMember = log.action === 'qr_scan' || log.action === 'login';
                  const personName = log.guestName || log.userName || 'Usuario Desconocido';
                  
                  return (
                    <TouchableOpacity 
                      key={log.id} 
                      style={styles.logItem}
                      onPress={() => handleLogPress(log)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.logHeader}>
                        <View style={styles.logIconContainer}>
                          <Ionicons 
                            name={isMember ? 'person' : 'person-add'} 
                            size={20} 
                            color={isMember ? "#10b981" : "#f59e0b"} 
                          />
                        </View>
                        <View style={styles.logInfo}>
                          <Text style={styles.logUserName}>
                            {personName}
                          </Text>
                          <Text style={styles.logTime}>
                            {formatTimestamp(log.timestamp)}
                          </Text>
                        </View>
                        <View style={styles.logStatus}>
                          <View style={[
                            styles.typeBadge, 
                            { backgroundColor: isMember ? "#10b981" : "#f59e0b" }
                          ]}>
                            <Text style={styles.typeBadgeText}>
                              {isMember ? 'Miembro' : 'Desconocido'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        )}
      </View>

      {/* Modal de Detalle de Log */}
      <Modal
        visible={showLogDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeLogDetail}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalle del Registro</Text>
            <TouchableOpacity onPress={closeLogDetail} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          {selectedLog && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Datos del Formulario */}
              {selectedLog.formData && Object.keys(selectedLog.formData).length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Datos Registrados</Text>
                  <View style={styles.formFieldsContainer}>
                    {createFormFieldsFromLogData(selectedLog.formData).map((field) => (
                      <View key={field.id} style={styles.readOnlyFieldContainer}>
                        <DynamicFormField
                          field={field}
                          value={field.value}
                          onChange={() => {}} // No permitir cambios en modo lectura
                          hasCameraPermission={hasCameraPermission}
                          readOnly={true}
                        />
                      </View>
                    ))}
                  </View>
                </View>
              )}


            </ScrollView>
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 0,
    padding: 20,
    marginBottom: 20,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#2c3e50',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  actionsContainer: {
    paddingTop: 16,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 0,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0.1,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  clearButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 0,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  // Estilos para las fotos
  photoButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  photoButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  photoButtonTextDisabled: {
    color: '#999',
  },
  photoContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    color: '#2c3e50',
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  // Estilos para pestañas
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#4CAF50',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 8,
  },
  activeTabButtonText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  formSelectorContainer: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  sectionsContainer: {
    paddingTop: 16,
  },
  logsTabContent: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  // Estilos para logs de seguridad
  logsLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  logsLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  logsEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  logsEmptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    textAlign: 'center',
  },
  logsEmptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  logsList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  logItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  logIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logInfo: {
    flex: 1,
  },
  logUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  logTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  logStatus: {
    alignItems: 'flex-end',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  logDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  },
  
  // Estilos del Modal de Detalle
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  detailSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    flex: 1,
    marginRight: 12,
  },
  detailValue: {
    fontSize: 14,
    color: '#1f2937',
    flex: 2,
    textAlign: 'right',
  },
  detailValueSmall: {
    fontSize: 12,
    color: '#6b7280',
    flex: 2,
    textAlign: 'right',
  },
  inlineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-end',
  },
  inlineBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  
  // Estilos para campos de formulario en modal
  formFieldsContainer: {
    marginTop: 8,
  },
  readOnlyFieldContainer: {
    marginBottom: 16,
    opacity: 0.8, // Indicar que es solo lectura
  },
});
