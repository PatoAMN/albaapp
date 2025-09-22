
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  ScrollView,

  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Share,
  Platform,
  StatusBar,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { QRValidationService } from '../utils/qrValidationService';
import guestsService, { Guest, GuestQR } from '../utils/guestsService';
import { useAuth } from '../utils/authContext';
import * as FileSystem from 'expo-file-system';
import { Member } from '../types';
import { GuestQRDetailScreen } from './GuestQRDetailScreen';
import { GuestHistoryScreen } from './GuestHistoryScreen';

const { width, height } = Dimensions.get('window');

interface GuestsScreenProps {
  onGoBack?: () => void;
}

export const GuestsScreen: React.FC<GuestsScreenProps> = ({ onGoBack }) => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [showQRForm, setShowQRForm] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [selectedQR, setSelectedQR] = useState<GuestQR | null>(null);
  const [showQRDetail, setShowQRDetail] = useState(false);
  const [showGuestHistory, setShowGuestHistory] = useState(false);
  const [guestForHistory, setGuestForHistory] = useState<Guest | null>(null);
  
  // Contexto de autenticación
  const { user, organization } = useAuth();

  // Cargar invitados desde Firebase cuando se monta el componente
  useEffect(() => {
    const loadGuests = async () => {
      console.log('🔍 Debug - useAuth context:', { 
        userId: user?.id, 
        organizationId: organization?.id,
        user: user,
        organization: organization
      });
      
      if (user?.id && organization?.id) {
        try {
          console.log('✅ Cargando invitados para:', user.id, 'en organización:', organization.id);
          const loadedGuests = await guestsService.getGuestsByMember(user.id, organization.id);
          setGuests(loadedGuests);
          console.log('✅ Invitados cargados:', loadedGuests.length);
        } catch (error) {
          console.error('❌ Error cargando invitados:', error);
          // Si hay error, mantener la lista vacía
        }
      } else {
        console.log('⚠️ No se pueden cargar invitados - faltan datos:', {
          hasUserId: !!user?.id,
          hasOrgId: !!organization?.id
        });
      }
    };

    loadGuests();
  }, [user?.id, organization?.id]);
  
  // Estados para formulario de invitado
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestRelationship, setGuestRelationship] = useState('');
  
  // Estados para formulario de código QR
  const [qrPurpose, setQrPurpose] = useState('');
  const [qrStartDateTime, setQrStartDateTime] = useState(new Date());
  const [qrEndDateTime, setQrEndDateTime] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [isCreating, setIsCreating] = useState(false);
  
  // Estados para el calendario
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentPickerType, setCurrentPickerType] = useState<'start' | 'end'>('start');
  const [currentPickerDate, setCurrentPickerDate] = useState(new Date());
  
  // Estados para los pickers de fecha y hora
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [activePicker, setActivePicker] = useState<'start' | 'end'>('start');
  
  // Funciones para seleccionar fecha usando pickers nativos
  const selectStartDate = () => {
    setActivePicker('start');
    setPickerMode('date');
    setShowStartDatePicker(true);
  };

  const selectStartTime = () => {
    console.log('🔍 selectStartTime llamado');
    setActivePicker('start');
    setPickerMode('time');
    setShowStartTimePicker(true);
  };

  const selectEndDate = () => {
    setActivePicker('end');
    setPickerMode('date');
    setShowEndDatePicker(true);
  };
  
  // Funciones para manejar el calendario
  const handleDateConfirm = () => {
    if (currentPickerType === 'start') {
      setQrStartDateTime(currentPickerDate);
    } else {
      setQrEndDateTime(currentPickerDate);
    }
    setShowDatePicker(false);
  };
  
  const handleDateCancel = () => {
    setShowDatePicker(false);
  };
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentPickerDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentPickerDate(newDate);
  };
  


  const selectEndTime = () => {
    console.log('🔍 selectEndTime llamado');
    setActivePicker('end');
    setPickerMode('time');
    setShowEndTimePicker(true);
  };

  // Función para manejar los cambios de fecha y hora
  const handleDateTimeChange = (event: any, selectedDate?: Date) => {
    console.log('🔍 handleDateTimeChange llamado');
    console.log('🔍 Evento:', event);
    console.log('🔍 Fecha seleccionada:', selectedDate);
    console.log('🔍 Estado actual:', { activePicker, pickerMode, showStartTimePicker, showEndTimePicker });
    
    if (Platform.OS === 'android') {
      console.log('🔍 Cerrando pickers en Android');
      setShowStartDatePicker(false);
      setShowStartTimePicker(false);
      setShowEndDatePicker(false);
      setShowEndTimePicker(false);
    }

    if (selectedDate) {
      console.log('🔍 Procesando fecha seleccionada');
      if (activePicker === 'start') {
        if (pickerMode === 'date') {
          // Mantener la hora actual, cambiar solo la fecha
          const newDate = new Date(selectedDate);
          newDate.setHours(qrStartDateTime.getHours());
          newDate.setMinutes(qrStartDateTime.getMinutes());
          setQrStartDateTime(newDate);
          console.log('🔍 Fecha de inicio actualizada:', newDate);
        } else {
          // Mantener la fecha actual, cambiar solo la hora
          const newDate = new Date(qrStartDateTime);
          newDate.setHours(selectedDate.getHours());
          newDate.setMinutes(selectedDate.getMinutes());
          setQrStartDateTime(newDate);
          console.log('🔍 Hora de inicio actualizada:', newDate);
        }
      } else {
        if (pickerMode === 'date') {
          // Mantener la hora actual, cambiar solo la fecha
          const newDate = new Date(selectedDate);
          newDate.setHours(qrEndDateTime.getHours());
          newDate.setMinutes(qrEndDateTime.getMinutes());
          setQrEndDateTime(newDate);
          console.log('🔍 Fecha de fin actualizada:', newDate);
        } else {
          // Mantener la fecha actual, cambiar solo la hora
          const newDate = new Date(qrEndDateTime);
          newDate.setHours(selectedDate.getHours());
          newDate.setMinutes(selectedDate.getMinutes());
          setQrEndDateTime(newDate);
          console.log('🔍 Hora de fin actualizada:', newDate);
        }
      }
    } else {
      console.log('🔍 No se seleccionó fecha, cerrando pickers');
      // En iOS, cuando se cancela, selectedDate es undefined
      setShowStartTimePicker(false);
      setShowEndTimePicker(false);
    }
  };
  
  // Función para crear nuevo invitado
  const createGuest = async () => {
    console.log('🔍 Debug - createGuest:', { 
      guestName: guestName.trim(),
      guestPhone: guestPhone.trim(),
      userId: user?.id,
      organizationId: organization?.id,
      user: user,
      organization: organization
    });
    
    if (!guestName.trim() || !guestPhone.trim()) {
      Alert.alert('Error', 'Por favor completa el nombre y teléfono');
      return;
    }

    if (!user?.id || !organization?.id) {
      console.error('❌ Error - Faltan datos de autenticación:', {
        hasUserId: !!user?.id,
        hasOrgId: !!organization?.id
      });
      Alert.alert('Error', 'No se pudo identificar al usuario o la organización');
      return;
    }

    // Validar que los campos opcionales no sean solo espacios en blanco
    const cleanEmail = guestEmail.trim() || undefined;
    const cleanRelationship = guestRelationship.trim() || undefined;

    try {
      const guestId = await guestsService.createGuest({
        name: guestName.trim(),
        phone: guestPhone.trim(),
        email: cleanEmail,
        relationship: cleanRelationship,
        memberId: user.id,
        organizationId: organization.id,
      });

      // Crear el objeto del invitado para el estado local
      const newGuest: Guest = {
        id: guestId,
        name: guestName.trim(),
        phone: guestPhone.trim(),
        email: guestEmail.trim() || '',
        relationship: guestRelationship.trim() || '',
        memberId: user.id,
        organizationId: organization.id,
        createdAt: new Date(),
        qrCodes: [],
      };

      setGuests(prev => [newGuest, ...prev]);
      
      // Limpiar formulario
      setGuestName('');
      setGuestPhone('');
      setGuestEmail('');
      setGuestRelationship('');
      setShowGuestForm(false);
      
      Alert.alert('Éxito', 'Invitado creado exitosamente');
    } catch (error) {
      console.error('Error creando invitado:', error);
      Alert.alert('Error', 'No se pudo crear el invitado. Inténtalo de nuevo.');
    }
  };

  // Función para generar código QR para un invitado existente
  const generateGuestQR = async () => {
    if (!selectedGuest || !qrPurpose.trim()) {
      Alert.alert('Error', 'Por favor selecciona un invitado y especifica el propósito');
      return;
    }

    if (!organization?.id) {
      Alert.alert('Error', 'No se pudo identificar la organización');
      return;
    }

    // Validar que la fecha de inicio sea anterior a la de fin
    const startDateTime = new Date(qrStartDateTime);
    const endDateTime = new Date(qrEndDateTime);
    
    if (startDateTime >= endDateTime) {
      Alert.alert('Error', 'La fecha y hora de inicio debe ser anterior a la de fin');
      return;
    }

    // Validar que la fecha de fin sea en el futuro
    if (endDateTime <= new Date()) {
      Alert.alert('Error', 'La fecha y hora de fin debe ser en el futuro');
      return;
    }

    // Validar que la fecha de fin sea al menos 1 hora después del inicio
    const minEndTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hora después
    if (endDateTime <= minEndTime) {
      Alert.alert('Error', 'La fecha y hora de fin debe ser al menos 1 hora después del inicio');
      return;
    }

    console.log('🚀 Iniciando generación de QR para invitado:', selectedGuest.name);
    console.log('🔍 Datos del formulario:', {
      guestId: selectedGuest.id,
      organizationId: organization.id,
      purpose: qrPurpose.trim(),
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString()
    });

    setIsCreating(true);
    try {
      console.log('📞 Llamando a guestsService.createGuestQR...');
      
      // Usar el nuevo servicio para crear el QR del invitado
      const newGuestQR = await guestsService.createGuestQR(
        selectedGuest.id,
        organization.id,
        qrPurpose.trim(),
        startDateTime,
        endDateTime
      );
      
      console.log('✅ createGuestQR exitoso:', newGuestQR);
      console.log('🔍 Hash generado:', newGuestQR.qrCodeHash);
      
      // Generar imagen QR con información del invitado
      const qrData = JSON.stringify({
        qrCodeHash: newGuestQR.qrCodeHash,
        guest: selectedGuest.name,
        purpose: qrPurpose.trim(),
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString()
      });
      
      console.log('🔍 QR Data generado:', qrData);
      
      // Generar URL del QR usando la misma API que funciona en el pase personal
      const qrCodeImage = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
      
      console.log('🔍 URL del QR generada:', qrCodeImage);
      
      // Crear el código QR en Firebase
      console.log('📞 Llamando a guestsService.addQRCodeToGuest...');
      console.log('🔍 Datos que se van a guardar en Firebase:', {
        purpose: qrPurpose.trim(),
        qrCodeHash: newGuestQR.qrCodeHash,
        qrCodeImage,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        isActive: true,
      });
      
      const qrCodeId = await guestsService.addQRCodeToGuest(selectedGuest.id, organization.id, {
        purpose: qrPurpose.trim(),
        qrCodeHash: newGuestQR.qrCodeHash,
        qrCodeImage,
        startDateTime,
        endDateTime,
        isActive: true,
      });

      console.log('✅ addQRCodeToGuest exitoso, ID:', qrCodeId);

      // Log para verificar que la URL del QR se está enviando correctamente
      console.log('🔍 qrCodeImage que se está enviando a Firebase:', qrCodeImage);
      console.log('🔍 Longitud de la URL del QR:', qrCodeImage.length);

      // Crear el objeto del código QR para el estado local
      const newQR: GuestQR = {
        id: qrCodeId,
        purpose: qrPurpose.trim(),
        qrCodeHash: newGuestQR.qrCodeHash,
        qrCodeImage,
        createdAt: new Date(),
        startDateTime,
        endDateTime,
        isActive: true,
      };

      console.log('🔍 Objeto QR local creado:', newQR);

      // Agregar el código QR al invitado
      setGuests(prev => prev.map(guest => 
        guest.id === selectedGuest.id 
          ? { ...guest, qrCodes: [newQR, ...guest.qrCodes] }
          : guest
      ));
      
      console.log('✅ Estado local actualizado con el nuevo QR');
      
      // Limpiar formulario
      setQrPurpose('');
      setQrStartDateTime(new Date());
      setQrEndDateTime(new Date(Date.now() + 24 * 60 * 60 * 1000));
      setShowQRForm(false);
      
      // Abrir directamente el detalle del QR recién creado
      setSelectedGuest(selectedGuest);
      setSelectedQR(newQR);
      setShowQRDetail(true);
      
      console.log('🎯 Abriendo detalle del QR recién creado...');
      Alert.alert('Éxito', 'Código QR creado exitosamente. Abriendo detalle...');
    } catch (error) {
      console.error('❌ Error generando QR:', error);
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
      Alert.alert('Error', 'No se pudo generar el código QR');
    } finally {
      setIsCreating(false);
    }
  };

  // Función para mostrar el detalle del QR
  const showQRDetailScreen = (guest: Guest, qrCode: GuestQR) => {
    setSelectedGuest(guest);
    setSelectedQR(qrCode);
    setShowQRDetail(true);
  };

  // Función para cerrar el detalle del QR
  const closeQRDetailScreen = () => {
    console.log('🔍 Cerrando pantalla de detalle del QR');
    setShowQRDetail(false);
    setSelectedGuest(null);
    setSelectedQR(null);
    console.log('🔍 Estados actualizados - showQRDetail: false, selectedQR: null');
  };

  // Función para abrir el historial de un invitado
  const openGuestHistory = (guest: Guest) => {
    setGuestForHistory(guest);
    setShowGuestHistory(true);
  };

  // Función para cerrar el historial de un invitado
  const closeGuestHistory = () => {
    setShowGuestHistory(false);
    setGuestForHistory(null);
  };

  // Función para guardar el QR en la galería
  const saveQRToGallery = async (guest: Guest, qrCode: GuestQR) => {
    try {
      Alert.alert(
        'Guardando QR',
        'Descargando el código QR...',
        [{ text: 'OK' }]
      );

      const localImageUri = await downloadQR(qrCode);
      
      if (localImageUri) {
        Alert.alert(
          'QR Descargado',
          `El código QR de ${guest.name} se ha descargado exitosamente en el dispositivo`,
          [{ text: 'Perfecto' }]
        );
      } else {
        Alert.alert(
          'Error',
          'No se pudo descargar el código QR',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error descargando QR:', error);
      Alert.alert(
        'Error',
        'Ocurrió un error al descargar el código QR',
        [{ text: 'OK' }]
      );
    }
  };

  // Función para descargar la imagen del QR
  const downloadQR = async (qrCode: GuestQR): Promise<string | null> => {
    try {
      // Crear nombre único para el archivo
      const fileName = `QR_${Date.now()}.png`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      // Descargar la imagen del QR
      const downloadResult = await FileSystem.downloadAsync(qrCode.qrCodeImage, fileUri);
      
      if (downloadResult.status === 200) {
        return fileUri;
      }
      
      return null;
    } catch (error) {
      console.error('Error descargando QR:', error);
      return null;
    }
  };

  // Función para compartir código QR como imagen
  const shareQRCode = async (guest: Guest, qrCode: GuestQR) => {
    try {
      const startTime = qrCode.startDateTime.toLocaleString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const endTime = qrCode.endDateTime.toLocaleString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Crear mensaje con información del invitado
      const message = `Código QR para ${guest.name}\n\nPropósito: ${qrCode.purpose}\n\nVálido desde: ${startTime}\nHasta: ${endTime}`;
      
      // Compartir la URL de la imagen del QR
      await Share.share({
        message: `${message}\n\nCódigo QR: ${qrCode.qrCodeImage}`,
        title: `QR Invitado - ${guest.name}`,
      });
      
    } catch (error) {
      console.error('Error compartiendo:', error);
      // Fallback: compartir solo texto si falla la imagen
      Alert.alert(
        'Error al Compartir',
        'No se pudo compartir. Compartiendo información en texto.',
        [
          {
            text: 'Compartir Texto',
            onPress: () => shareQRCodeAsText(guest, qrCode)
          },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
    }
  };

  // Función de respaldo para compartir solo texto
  const shareQRCodeAsText = async (guest: Guest, qrCode: GuestQR) => {
    try {
      const startTime = qrCode.startDateTime.toLocaleString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const endTime = qrCode.endDateTime.toLocaleString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      await Share.share({
        message: `Código QR para ${guest.name}\n\nPropósito: ${qrCode.purpose}\n\nVálido desde: ${startTime}\nHasta: ${endTime}\n\nCódigo: ${qrCode.qrCodeHash}`,
        title: `QR Invitado - ${guest.name}`,
      });
    } catch (error) {
      console.error('Error compartiendo texto:', error);
    }
  };

  // Función para desactivar código QR
  const deactivateQR = async (guestId: string, qrId: string) => {
    try {
      await guestsService.updateQRCode(guestId, organization!.id, qrId, { isActive: false });
      setGuests(prev => prev.map(guest => 
        guest.id === guestId 
          ? { ...guest, qrCodes: guest.qrCodes.map(qr => 
              qr.id === qrId ? { ...qr, isActive: false } : qr
            )}
          : guest
      ));
    } catch (error) {
      console.error('Error desactivando código QR:', error);
      Alert.alert('Error', 'No se pudo desactivar el código QR');
    }
  };

  // Función para verificar si un código QR está en su horario válido
  const isQRInValidTimeRange = (qrCode: GuestQR): boolean => {
    // Validar que las fechas existan
    if (!qrCode.startDateTime || !qrCode.endDateTime) {
      console.log('🔍 QR sin fechas válidas');
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
      console.log('🔍 QR con fecha de inicio no válida:', qrCode.startDateTime);
      return false;
    }
    
    if ((qrCode.endDateTime as any).seconds) {
      endDate = new Date((qrCode.endDateTime as any).seconds * 1000);
    } else if (qrCode.endDateTime instanceof Date) {
      endDate = qrCode.endDateTime;
    } else {
      console.log('🔍 QR con fecha de fin no válida:', qrCode.endDateTime);
      return false;
    }
    
    const now = new Date();
    const isInRange = now >= startDate && now <= endDate;
    
    console.log('🔍 Validación de horario QR:', {
      now: now.toISOString(),
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      isInRange
    });
    
    return isInRange;
  };



  // Función para formatear fechas de manera amigable
  const formatDateTime = (dateTime: Date | undefined | null): string => {
    // Validar que la fecha exista y sea una instancia válida de Date
    if (!dateTime || !(dateTime instanceof Date) || isNaN(dateTime.getTime())) {
      return 'Fecha no disponible';
    }
    
    const dateStr = dateTime.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const timeStr = dateTime.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `${dateStr} a las ${timeStr}`;
  };

  // Función para formatear fechas de manera segura en el historial
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

  // Función para activar código QR
  const activateQR = async (guestId: string, qrId: string) => {
    try {
      await guestsService.updateQRCode(guestId, organization!.id, qrId, { isActive: true });
      setGuests(prev => prev.map(guest => 
        guest.id === guestId 
          ? { ...guest, qrCodes: guest.qrCodes.map(qr => 
              qr.id === qrId ? { ...qr, isActive: true } : qr
            )}
          : guest
      ));
    } catch (error) {
      console.error('Error activando código QR:', error);
      Alert.alert('Error', 'No se pudo activar el código QR');
    }
  };

  // Función para eliminar código QR
  const deleteQR = async (guestId: string, qrId: string) => {
    Alert.alert(
      'Eliminar Código QR',
      '¿Estás seguro de que quieres eliminar este código?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await guestsService.deleteQRCode(guestId, organization!.id, qrId);
              setGuests(prev => prev.map(guest => 
                guest.id === guestId 
                  ? { ...guest, qrCodes: guest.qrCodes.filter(qr => qr.id !== qrId) }
                  : guest
              ));
              Alert.alert('Éxito', 'Código QR eliminado exitosamente');
            } catch (error) {
              console.error('Error eliminando código QR:', error);
              Alert.alert('Error', 'No se pudo eliminar el código QR');
            }
          }
        },
      ]
    );
  };

  // Función para eliminar invitado
  const deleteGuest = async (guestId: string) => {
    Alert.alert(
      'Eliminar Invitado',
      '¿Estás seguro de que quieres eliminar este invitado y todos sus códigos QR?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await guestsService.deleteGuest(guestId, organization!.id);
              setGuests(prev => prev.filter(guest => guest.id !== guestId));
              if (selectedGuest?.id === guestId) {
                setSelectedGuest(null);
              }
              Alert.alert('Éxito', 'Invitado eliminado exitosamente');
            } catch (error) {
              console.error('Error eliminando invitado:', error);
              Alert.alert('Error', 'No se pudo eliminar el invitado. Inténtalo de nuevo.');
            }
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Pantalla de detalle del QR - PANTALLA COMPLETA */}
      {showQRDetail && selectedGuest && selectedQR ? (
        <GuestQRDetailScreen
          guest={selectedGuest}
          qrCode={selectedQR}
          onGoBack={closeQRDetailScreen}
          onDelete={deleteQR}
          onRenew={(guestId, qrId) => {
            // Implementar renovación del QR
            Alert.alert('Renovar', 'Función de renovación en desarrollo');
          }}
          onShare={shareQRCode}
        />
      ) : (
        <>
          {/* Header con botón de regresar */}
          {/* Header principal solo cuando no hay formularios activos */}
          {!showGuestForm && !showQRForm && !showGuestHistory && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
            <Ionicons name="arrow-back" size={24} color="#6366f1" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>PASES DE VISITA</Text>
          </View>
          
          <View style={styles.placeholder} />
        </View>
      )}
      
      {/* Header del formulario QR cuando está activo - REEMPLAZA al header principal */}
      {showQRForm && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setShowQRForm(false)}>
            <Ionicons name="close" size={24} color="#6366f1" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Nuevo Código QR</Text>
          </View>
          
          <View style={styles.placeholder} />
        </View>
      )}
      
              {/* Pantalla de historial del invitado - Solo lista de pases */}
        {showGuestHistory && guestForHistory && !showQRForm ? (
          <View style={styles.guestHistoryContainer}>
            {/* Header del historial */}
            <View style={styles.guestHistoryHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={closeGuestHistory}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color="#64B5F6" />
              </TouchableOpacity>
              <Text style={styles.guestHistoryTitle}>Historial de Pases</Text>
              <View style={styles.placeholder} />
            </View>
            
            {/* Lista de pases del invitado */}
            <ScrollView style={styles.guestHistoryContent} showsVerticalScrollIndicator={false}>
              {guestForHistory.qrCodes && guestForHistory.qrCodes.length > 0 ? (
                guestForHistory.qrCodes.map((qrCode) => (
                  <TouchableOpacity
                    key={qrCode.id}
                    style={styles.qrHistoryItem}
                    onPress={() => {
                      console.log('🔍 Pase tocado:', qrCode.id);
                      console.log('🔍 QR Code:', qrCode);
                      console.log('🔍 Guest for history:', guestForHistory);
                      setSelectedGuest(guestForHistory); // Establecer el invitado seleccionado
                      setSelectedQR(qrCode);
                      setShowQRDetail(true);
                      console.log('🔍 Estados actualizados - selectedGuest:', guestForHistory?.id, 'selectedQR:', qrCode.id, 'showQRDetail: true');
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.qrHistoryItemContent}>
                      <View style={styles.qrHistoryItemLeft}>
                        <Text style={styles.qrHistoryItemPurpose}>{qrCode.purpose}</Text>
                        <Text style={styles.qrHistoryItemDate}>
                          {qrCode.startDateTime && qrCode.endDateTime ? (
                            `${new Date((qrCode.startDateTime as any).seconds * 1000).toLocaleDateString('es-MX')} - ${new Date((qrCode.endDateTime as any).seconds * 1000).toLocaleDateString('es-MX')}`
                          ) : 'Fechas no disponibles'}
                        </Text>
                      </View>
                      <View style={styles.qrHistoryItemRight}>
                        <View style={[
                          styles.qrHistoryItemStatus,
                          isQRInValidTimeRange(qrCode) ? styles.qrHistoryItemStatusValid : styles.qrHistoryItemStatusExpired
                        ]}>
                          <Text style={styles.qrHistoryItemStatusText}>
                            {isQRInValidTimeRange(qrCode) ? 'Válido' : 'Expirado'}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#999" />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyStateCard}>
                  <Ionicons name="qr-code-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyStateText}>
                    No hay pases QR para este invitado
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    Crea un nuevo pase QR para comenzar
                  </Text>
                </View>
              )}
              
              {/* Botón Crear QR - Sección separada */}
              <View style={styles.createQRSection}>
                <TouchableOpacity
                  style={styles.createQRButton}
                  onPress={() => {
                    setSelectedGuest(guestForHistory);
                    setShowQRForm(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={20} color="#ffffff" />
                  <Text style={styles.createQRButtonText}>Crear QR</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
      ) : showQRForm ? (
        // Solo mostrar el formulario QR cuando está activo
        <View style={styles.section}>
          
          <View style={styles.formCard}>
            {/* Campo Invitado */}
            <Text style={styles.formLabel}>Invitado:</Text>
            {selectedGuest && (
              <Text style={styles.guestNameDisplay}>{selectedGuest.name}</Text>
            )}
            
            {/* Campo Propósito */}
            <Text style={styles.formLabel}>Propósito del QR:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ej: Visita familiar, reunión de trabajo..."
              placeholderTextColor="#999"
              value={qrPurpose}
              onChangeText={setQrPurpose}
              multiline={false}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
              blurOnSubmit={true}
            />
            
            {/* Fecha y Hora de Inicio */}
            <Text style={styles.formLabel}>Fecha y Hora de Inicio:</Text>
            <View style={styles.dateTimeDisplay}>
              <Text style={styles.dateTimeText}>
                {qrStartDateTime.toLocaleDateString('es-MX')}, {qrStartDateTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            
            {/* Botones para fecha y hora de inicio */}
            <View style={styles.pickerButtonsContainer}>
              <TouchableOpacity 
                style={styles.pickerButton}
                onPress={selectStartDate}
              >
                <Text style={styles.pickerButtonText}>Cambiar Fecha</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.pickerButton}
                onPress={selectStartTime}
              >
                <Text style={styles.pickerButtonText}>Cambiar Hora</Text>
              </TouchableOpacity>
            </View>

            {/* Fecha y Hora de Fin */}
            <Text style={styles.formLabel}>Fecha y Hora de Fin:</Text>
            <View style={styles.dateTimeDisplay}>
              <Text style={styles.dateTimeText}>
                {qrEndDateTime.toLocaleDateString('es-MX')}, {qrEndDateTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            
            {/* Botones para fecha y hora de fin */}
            <View style={styles.pickerButtonsContainer}>
              <TouchableOpacity 
                style={styles.pickerButton}
                onPress={selectEndDate}
              >
                <Text style={styles.pickerButtonText}>Cambiar Fecha</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.pickerButton}
                onPress={selectEndTime}
              >
                <Text style={styles.pickerButtonText}>Cambiar Hora</Text>
              </TouchableOpacity>
            </View>

            {/* Botón Resetear Fechas */}
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setQrStartDateTime(new Date());
                setQrEndDateTime(new Date(Date.now() + 24 * 60 * 60 * 1000));
              }}
            >
              <Text style={styles.resetButtonText}>Resetear Fechas</Text>
            </TouchableOpacity>

            {/* Botón Crear QR */}
            <TouchableOpacity
              style={styles.generateButton}
              onPress={generateGuestQR}
              disabled={!selectedGuest || !qrPurpose.trim()}
            >
              <Text style={styles.generateButtonText}>Crear QR</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Header de sección con botón - Solo mostrar cuando no hay formularios activos */}
            {!showGuestForm && !showQRForm && (
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="list" size={24} color="#4CAF50" />
                  <Text style={styles.sectionTitle}>Invitados</Text>
                </View>
                
                <TouchableOpacity
                  style={styles.createGuestButton}
                  onPress={() => setShowGuestForm(!showGuestForm)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={showGuestForm ? "close" : "add"} size={20} color="#ffffff" />
                  <Text style={styles.createGuestButtonText}>
                    {showGuestForm ? 'Cancelar' : 'Nuevo Invitado'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Formulario para crear invitado */}
            {showGuestForm && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="add" size={24} color="#4CAF50" />
                    <Text style={styles.sectionTitle}>Nuevo Invitado</Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowGuestForm(false)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close" size={20} color="#ffffff" />
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.formCard}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Nombre del invitado"
                    placeholderTextColor="#999"
                    value={guestName}
                    onChangeText={setGuestName}
                  />
                  
                  <TextInput
                    style={styles.textInput}
                    placeholder="Teléfono"
                    placeholderTextColor="#999"
                    value={guestPhone}
                    onChangeText={setGuestPhone}
                    keyboardType="phone-pad"
                  />
                  
                  <TextInput
                    style={styles.textInput}
                    placeholder="Email (opcional)"
                    placeholderTextColor="#999"
                    value={guestEmail}
                    onChangeText={setGuestEmail}
                    keyboardType="email-address"
                  />
                  
                  <TextInput
                    style={styles.textInput}
                    placeholder="Relación (opcional)"
                    placeholderTextColor="#999"
                    value={guestRelationship}
                    onChangeText={setGuestRelationship}
                  />
                  
                  <TouchableOpacity
                    style={styles.generateButton}
                    onPress={createGuest}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.generateButtonText}>Crear Invitado</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Lista de invitados - Solo mostrar cuando no hay formularios activos */}
            {!showGuestForm && !showQRForm && (
              <View style={styles.section}>
                {guests.length === 0 ? (
                  <View style={styles.emptyStateCard}>
                    <Ionicons name="people-outline" size={48} color="#ccc" />
                    <Text style={styles.emptyStateText}>
                      No has creado ningún invitado
                    </Text>
                    <Text style={styles.emptyStateSubtext}>
                      Toca "Nuevo Invitado" para comenzar
                    </Text>
                  </View>
                ) : (
                  guests.map((guest) => (
                    <TouchableOpacity
                      key={guest.id}
                      style={styles.guestCard}
                      onPress={() => openGuestHistory(guest)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.guestCardName}>{guest.name}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </ScrollView>
        </>
      )}

      {/* Debug de estados */}
      {(() => {
        console.log('🔍 Estados actuales:', { showQRDetail, selectedGuest: !!selectedGuest, selectedQR: !!selectedQR });
        return null;
      })()}

      {/* Debug de pickers */}
      {(() => {
        console.log('🔍 Renderizando pickers:', {
          platform: Platform.OS,
          showStartDatePicker,
          showStartTimePicker,
          showEndDatePicker,
          showEndTimePicker,
          pickerMode
        });
        return null;
      })()}

      {/* DateTimePickers para Android */}
      {Platform.OS === 'android' && showStartDatePicker && (
        <DateTimePicker
          value={qrStartDateTime}
          mode="date"
          is24Hour={true}
          display="default"
          onChange={handleDateTimeChange}
        />
      )}
      {Platform.OS === 'android' && showStartTimePicker && (
        <DateTimePicker
          value={qrStartDateTime}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleDateTimeChange}
        />
      )}
      {Platform.OS === 'android' && showEndDatePicker && (
        <DateTimePicker
          value={qrEndDateTime}
          mode="date"
          is24Hour={true}
          display="default"
          onChange={handleDateTimeChange}
        />
      )}
      {Platform.OS === 'android' && showEndTimePicker && (
        <DateTimePicker
          value={qrEndDateTime}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleDateTimeChange}
        />
      )}

      {/* DateTimePickers para iOS */}
      {Platform.OS === 'ios' && (showStartTimePicker || showEndTimePicker) && (
        <View style={styles.iosPickerContainer}>
          <Text style={styles.iosPickerTitle}>
            {showStartTimePicker ? 'Seleccionar Hora de Inicio' : 'Seleccionar Hora de Fin'}
          </Text>
          <DateTimePicker
            value={showStartTimePicker ? qrStartDateTime : qrEndDateTime}
            mode="time"
            is24Hour={true}
            display="spinner"
            onChange={handleDateTimeChange}
            style={styles.iosPicker}
          />
          <TouchableOpacity 
            style={styles.iosPickerButton}
            onPress={() => {
              setShowStartTimePicker(false);
              setShowEndTimePicker(false);
            }}
          >
            <Text style={styles.iosPickerButtonText}>Confirmar</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {Platform.OS === 'ios' && (showStartDatePicker || showEndDatePicker) && (
        <View style={styles.iosPickerContainer}>
          <Text style={styles.iosPickerTitle}>
            {showStartDatePicker ? 'Seleccionar Fecha de Inicio' : 'Seleccionar Fecha de Fin'}
          </Text>
          <DateTimePicker
            value={showStartDatePicker ? qrStartDateTime : qrEndDateTime}
            mode="date"
            display="inline"
            onChange={handleDateTimeChange}
            style={styles.iosPicker}
          />
          <TouchableOpacity 
            style={styles.iosPickerButton}
            onPress={() => {
              setShowStartDatePicker(false);
              setShowEndDatePicker(false);
            }}
          >
            <Text style={styles.iosPickerButtonText}>Confirmar</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Modal del Calendario */}
      {showDatePicker && (
        <View style={styles.calendarModal}>
          <View style={styles.calendarContainer}>
            {/* Header del calendario */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity 
                style={styles.calendarButton} 
                onPress={handleDateCancel}
              >
                <Text style={styles.calendarButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <Text style={styles.calendarTitle}>
                Seleccionar Fecha
              </Text>
              
              <TouchableOpacity 
                style={styles.calendarButton} 
                onPress={handleDateConfirm}
              >
                <Text style={styles.calendarButtonText}>Listo</Text>
              </TouchableOpacity>
            </View>
            
            {/* Fecha seleccionada */}
            <View style={styles.selectedDateContainer}>
              <Text style={styles.selectedDateText}>
                Fecha seleccionada: {currentPickerDate.toLocaleDateString('es-MX')}
              </Text>
            </View>
            
            {/* Navegación del mes */}
            <View style={styles.monthNavigation}>
              <TouchableOpacity 
                style={styles.monthButton}
                onPress={() => navigateMonth('prev')}
              >
                <Text style={styles.monthButtonText}>‹</Text>
              </TouchableOpacity>
              
              <Text style={styles.monthYearText}>
                {currentPickerDate.toLocaleDateString('es-MX', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </Text>
              
              <TouchableOpacity 
                style={styles.monthButton}
                onPress={() => navigateMonth('next')}
              >
                <Text style={styles.monthButtonText}>›</Text>
              </TouchableOpacity>
            </View>
            
            {/* Días de la semana */}
            <View style={styles.weekDaysContainer}>
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                <Text key={day} style={styles.weekDayText}>{day}</Text>
              ))}
            </View>
            
            {/* Calendario */}
            <View style={styles.calendarGrid}>
              {(() => {
                const year = currentPickerDate.getFullYear();
                const month = currentPickerDate.getMonth();
                const firstDay = new Date(year, month, 1);
                const lastDay = new Date(year, month + 1, 0);
                const startDate = new Date(firstDay);
                startDate.setDate(startDate.getDate() - firstDay.getDay());
                
                const days = [];
                for (let i = 0; i < 42; i++) {
                  const date = new Date(startDate);
                  date.setDate(startDate.getDate() + i);
                  const isCurrentMonth = date.getMonth() === month;
                  const isSelected = date.toDateString() === currentPickerDate.toDateString();
                  const isToday = date.toDateString() === new Date().toDateString();
                  
                  days.push(
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.calendarDay,
                        !isCurrentMonth && styles.calendarDayOtherMonth,
                        isSelected && styles.calendarDaySelected,
                        isToday && styles.calendarDayToday
                      ]}
                      onPress={() => {
                        const newDate = new Date(currentPickerDate);
                        newDate.setDate(date.getDate());
                        setCurrentPickerDate(newDate);
                      }}
                      disabled={!isCurrentMonth}
                    >
                      <Text style={[
                        styles.calendarDayText,
                        !isCurrentMonth && styles.calendarDayTextOtherMonth,
                        isSelected && styles.calendarDayTextSelected,
                        isToday && styles.calendarDayTextToday
                      ]}>
                        {date.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                }
                return days;
              })()}
            </View>
          </View>
        </View>
      )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
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
  placeholder: {
    width: 40,
  },
  headerIcon: {
    marginRight: 12,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  buttonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 20,
    gap: 12,
  },
  createGuestButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createGuestButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  createQRButton: {
    flex: 1,
    backgroundColor: '#64B5F6',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#64B5F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createQRButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0.1,
  },
  createQRButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  formContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 100, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  formSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
    textAlign: 'center',
  },
  guestSelector: {
    marginBottom: 20,
  },
  guestOption: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  guestOptionSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.15,
  },
  guestOptionText: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '600',
  },
  guestOptionTextSelected: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  selectedGuestInfo: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 20,
    textAlign: 'center',
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedGuestName: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  
  // Estilos para el nombre del invitado
  guestNameDisplay: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  
  // Estilos para el display de fecha y hora
  dateTimeDisplay: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  
  dateTimeLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    fontWeight: '500',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateTimeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateTimeButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  pickerButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  pickerButtonText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
  },
  doneButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iosPicker: {
    width: '100%',
    height: 200,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  timeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeButtonText: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0.1,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  guestsListContainer: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  guestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  guestCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  guestCardInfo: {
    flex: 1,
  },
  guestCardName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  guestCardPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  guestCardEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  guestCardRelationship: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  guestCardCreated: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  guestCardActions: {
    alignItems: 'flex-end',
  },
  deleteGuestButton: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#f44336',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  deleteGuestButtonText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '500',
  },
  qrCodesSection: {
    marginTop: 16,
  },
  qrCodesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  noQRCodesText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  qrCodeItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#64B5F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  qrCodeInfo: {
    marginBottom: 12,
  },
  qrCodePurpose: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  qrCodeExpiry: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  qrCodeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
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
  qrCodeImage: {
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  qrImage: {
    width: 150,
    height: 150,
  },
  qrCodeActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#f0f8ff',
    borderWidth: 1,
    borderColor: '#64B5F6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  actionButtonText: {
    color: '#64B5F6',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  viewDetailButton: {
    borderColor: 'rgba(99, 102, 241, 0.5)',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  downloadButton: {
    borderColor: 'rgba(76, 175, 80, 0.5)',
  },
  activateButton: {
    borderColor: 'rgba(76, 175, 80, 0.5)',
  },
  deactivateButton: {
    borderColor: 'rgba(255, 193, 7, 0.5)',
  },
  deleteButton: {
    borderColor: 'rgba(244, 67, 54, 0.5)',
  },
  
  // Nuevos estilos para la interfaz expandible
  guestCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  guestCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  guestCardBadge: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  guestCardBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  viewHistoryButton: {
    backgroundColor: '#f0f4ff',
    borderWidth: 1,
    borderColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewHistoryButtonText: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  qrHistorySection: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
    marginTop: 8,
  },
  qrHistoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  qrHistoryItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#64B5F6',
  },
  qrHistoryInfo: {
    marginBottom: 8,
  },
  qrHistoryPurpose: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  qrHistoryDates: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  qrHistoryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrHistoryActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 6,
  },
  // Header styles matching PrincipalScreen
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
  backButton: {
    width: 40,
    height: 40,
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
  headerRight: {
    width: 40,
    height: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  // Section styles
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
    marginTop: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 24,
    minHeight: 50,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
    paddingVertical: 0,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C3E50',
    marginLeft: 12,
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  // Form styles
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#64B5F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  // Date/Time selector styles
  selectorContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  controlSection: {
    marginBottom: 10,
  },
  controlLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
    textAlign: 'center',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  controlButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  currentValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00ff64',
  },
  // Button styles
  generateButton: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 56,
  },
  generateButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0.1,
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Empty state styles
  emptyStateCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#64B5F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  resetButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  resetButtonText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
  },
  scheduleSummary: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#64B5F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scheduleSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  scheduleSummaryText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  scheduleLabel: {
    fontWeight: '600',
    color: '#00ff64',
  },
  // Button container styles
  buttonsContainer: {
    marginTop: 32,
    marginBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'flex-end',
  },
  createGuestButton: {
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
    alignSelf: 'center',
  },
  createGuestButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignSelf: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  createQRButton: {
    backgroundColor: '#FF9800',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    minHeight: 60,
  },
  createQRButtonDisabled: {
    backgroundColor: '#E0E0E0',
    shadowOpacity: 0.1,
    elevation: 2,
  },
  createQRButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  
  // Estilos del calendario
  calendarModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  calendarContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  calendarButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'center',
    flex: 1,
  },
  selectedDateContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 50,
    alignItems: 'center',
  },
  monthButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6366f1',
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    textTransform: 'capitalize',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 1,
  },
  calendarDayOtherMonth: {
    opacity: 0.3,
  },
  calendarDaySelected: {
    backgroundColor: '#6366f1',
    borderRadius: 20,
  },
  calendarDayToday: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  calendarDayTextOtherMonth: {
    color: '#999999',
  },
  calendarDayTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  calendarDayTextToday: {
    color: '#ffffff',
    fontWeight: '700',
  },
  
  // Estilos para el historial del invitado
  guestHistoryContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  guestHistoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  guestHistoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    flex: 1,
    textAlign: 'center',
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
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  createQRButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  createQRSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  guestHistoryContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  qrHistoryItem: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  qrHistoryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  qrHistoryItemLeft: {
    flex: 1,
  },
  qrHistoryItemPurpose: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  qrHistoryItemDate: {
    fontSize: 14,
    color: '#666666',
  },
  qrHistoryItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrHistoryItemStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 12,
  },
  qrHistoryItemStatusValid: {
    backgroundColor: '#4CAF50',
  },
  qrHistoryItemStatusExpired: {
    backgroundColor: '#F44336',
  },
  qrHistoryItemStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  
  // Estilos para los pickers de iOS
  iosPickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
  },
  iosPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
  },
  iosPicker: {
    width: '100%',
    height: 200,
    backgroundColor: '#ffffff',
  },
  iosPickerButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  iosPickerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
