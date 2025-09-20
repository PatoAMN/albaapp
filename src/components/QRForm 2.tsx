import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Guest } from '../utils/guestsService';
import { GuestsService } from '../utils/guestsService';

// Componente personalizado de picker de fecha y hora con comportamiento de rueda
interface CustomDateTimePickerProps {
  value: Date;
  mode: 'date' | 'time';
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({
  value,
  mode,
  onConfirm,
  onCancel,
}) => {
  const [tempDate, setTempDate] = useState(value);

  const handleConfirm = () => {
    onConfirm(tempDate);
  };

  const handleCancel = () => {
    onCancel();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-MX');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Generar arrays para horas, minutos y AM/PM
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const ampm = ['AM', 'PM'];

  const handleHourChange = (hour: number) => {
    const newDate = new Date(tempDate);
    const currentHour = tempDate.getHours();
    const isPM = currentHour >= 12;
    
    if (isPM) {
      newDate.setHours(hour + 12);
    } else {
      newDate.setHours(hour);
    }
    setTempDate(newDate);
  };

  const handleMinuteChange = (minute: number) => {
    const newDate = new Date(tempDate);
    newDate.setMinutes(minute);
    setTempDate(newDate);
  };

  const handleAMPMChange = (ampmValue: string) => {
    const newDate = new Date(tempDate);
    const currentHour = tempDate.getHours();
    
    if (ampmValue === 'PM' && currentHour < 12) {
      newDate.setHours(currentHour + 12);
    } else if (ampmValue === 'AM' && currentHour >= 12) {
      newDate.setHours(currentHour - 12);
    }
    setTempDate(newDate);
  };

  const getCurrentHour = () => {
    const hour = tempDate.getHours();
    return hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  };

  const getCurrentAMPM = () => {
    return tempDate.getHours() >= 12 ? 'PM' : 'AM';
  };

  // Referencias para los ScrollViews
  const hourScrollRef = React.useRef<ScrollView>(null);
  const minuteScrollRef = React.useRef<ScrollView>(null);
  const ampmScrollRef = React.useRef<ScrollView>(null);

  // Función para hacer scroll a una posición específica
  const scrollToPosition = (scrollViewRef: React.RefObject<ScrollView | null>, index: number) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: index * 40, animated: true });
    }
  };

  // Scroll inicial a las posiciones correctas
  React.useEffect(() => {
    setTimeout(() => {
      scrollToPosition(hourScrollRef, getCurrentHour() - 1);
      scrollToPosition(minuteScrollRef, tempDate.getMinutes());
      scrollToPosition(ampmScrollRef, getCurrentAMPM() === 'AM' ? 0 : 1);
    }, 100);
  }, []);

  // Manejar el scroll de horas
  const handleHourScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / 40);
    if (index >= 0 && index < 12) {
      const hour = index + 1;
      handleHourChange(hour);
    }
  };

  // Manejar el scroll de minutos
  const handleMinuteScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / 40);
    if (index >= 0 && index < 60) {
      handleMinuteChange(index);
    }
  };

  // Manejar el scroll de AM/PM
  const handleAMPMScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / 40);
    if (index >= 0 && index < 2) {
      const ampmValue = index === 0 ? 'AM' : 'PM';
      handleAMPMChange(ampmValue);
    }
  };

  return (
    <View style={styles.customPickerModal}>
      <View style={styles.customPickerContainer}>
        <View style={styles.customPickerHeader}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.customPickerTitle}>
            {mode === 'date' ? 'Seleccionar Fecha' : 'Seleccionar Hora'}
          </Text>
          <TouchableOpacity onPress={handleConfirm} style={styles.doneButton}>
            <Text style={styles.doneButtonText}>Listo</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.customPickerContent}>
          {mode === 'date' ? (
            <>
              <Text style={styles.currentValueText}>
                Fecha seleccionada: {formatDate(tempDate)}
              </Text>
              <View style={styles.dateControls}>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => {
                    const newDate = new Date(tempDate);
                    newDate.setDate(newDate.getDate() - 1);
                    setTempDate(newDate);
                  }}
                >
                  <Text style={styles.dateButtonText}>-1 día</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => {
                    const newDate = new Date(tempDate);
                    newDate.setDate(newDate.getDate() + 1);
                    setTempDate(newDate);
                  }}
                >
                  <Text style={styles.dateButtonText}>+1 día</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dateControls}>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => {
                    const newDate = new Date(tempDate);
                    newDate.setDate(newDate.getDate() - 7);
                    setTempDate(newDate);
                  }}
                >
                  <Text style={styles.dateButtonText}>-1 semana</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => {
                    const newDate = new Date(tempDate);
                    newDate.setDate(newDate.getDate() + 7);
                    setTempDate(newDate);
                  }}
                >
                  <Text style={styles.dateButtonText}>+1 semana</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.currentValueText}>
                Hora seleccionada: {formatTime(tempDate)}
              </Text>
              
              {/* Selector de hora tipo rueda (spinner) */}
              <View style={styles.timePickerContainer}>
                {/* Columna de horas */}
                <View style={styles.timeColumn}>
                  <Text style={styles.timeColumnLabel}>Hora</Text>
                  <View style={styles.timeWheelContainer}>
                    <View style={styles.timeWheelSelection} />
                    <ScrollView 
                      ref={hourScrollRef}
                      style={styles.timeWheel}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={40}
                      decelerationRate="fast"
                      contentContainerStyle={styles.timeWheelContent}
                      onMomentumScrollEnd={handleHourScroll}
                      scrollEventThrottle={16}
                    >
                      {hours.map((hour) => (
                        <View key={hour} style={styles.timeWheelOption}>
                          <Text style={[
                            styles.timeWheelOptionText,
                            getCurrentHour() === hour && styles.timeWheelOptionTextSelected
                          ]}>
                            {hour}
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                {/* Columna de minutos */}
                <View style={styles.timeColumn}>
                  <Text style={styles.timeColumnLabel}>Minuto</Text>
                  <View style={styles.timeWheelContainer}>
                    <View style={styles.timeWheelSelection} />
                    <ScrollView 
                      ref={minuteScrollRef}
                      style={styles.timeWheel}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={40}
                      decelerationRate={40}
                      contentContainerStyle={styles.timeWheelContent}
                      onMomentumScrollEnd={handleMinuteScroll}
                      scrollEventThrottle={16}
                    >
                      {minutes.map((minute) => (
                        <View key={minute} style={styles.timeWheelOption}>
                          <Text style={styles.timeWheelOptionText}>
                            {minute.toString().padStart(2, '0')}
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                {/* Columna de AM/PM */}
                <View style={styles.timeColumn}>
                  <Text style={styles.timeColumnLabel}>AM/PM</Text>
                  <View style={styles.timeWheelContainer}>
                    <View style={styles.timeWheelSelection} />
                    <ScrollView 
                      ref={ampmScrollRef}
                      style={styles.timeWheel}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={40}
                      decelerationRate="fast"
                      contentContainerStyle={styles.timeWheelContent}
                      onMomentumScrollEnd={handleAMPMScroll}
                      scrollEventThrottle={16}
                    >
                      {ampm.map((ampmValue) => (
                        <View key={ampmValue} style={styles.timeWheelOption}>
                          <Text style={[
                            styles.timeWheelOptionText,
                            getCurrentAMPM() === ampmValue && styles.timeWheelOptionTextSelected
                          ]}>
                            {ampmValue}
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

interface QRFormProps {
  guest: Guest;
  organizationId: string;
  onClose: () => void;
  onQRCreated: () => void;
}

interface CustomDateTimePickerProps {
  value: Date;
  mode: 'date' | 'time';
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({
  value,
  mode,
  onConfirm,
  onCancel,
}) => {
  const [tempDate, setTempDate] = useState(value);

  const handleConfirm = () => {
    onConfirm(tempDate);
  };

  const handleCancel = () => {
    onCancel();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-MX');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Generar arrays para horas, minutos y AM/PM
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const ampm = ['AM', 'PM'];

  const handleHourChange = (hour: number) => {
    const newDate = new Date(tempDate);
    const currentHour = tempDate.getHours();
    const isPM = currentHour >= 12;
    
    if (isPM) {
      newDate.setHours(hour + 12);
    } else {
      newDate.setHours(hour);
    }
    setTempDate(newDate);
  };

  const handleMinuteChange = (minute: number) => {
    const newDate = new Date(tempDate);
    newDate.setMinutes(minute);
    setTempDate(newDate);
  };

  const handleAMPMChange = (ampmValue: string) => {
    const newDate = new Date(tempDate);
    const currentHour = tempDate.getHours();
    
    if (ampmValue === 'PM' && currentHour < 12) {
      newDate.setHours(currentHour + 12);
    } else if (ampmValue === 'AM' && currentHour >= 12) {
      newDate.setHours(currentHour - 12);
    }
    setTempDate(newDate);
  };

  const getCurrentHour = () => {
    const hour = tempDate.getHours();
    return hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  };

  const getCurrentAMPM = () => {
    return tempDate.getHours() >= 12 ? 'PM' : 'AM';
  };

  // Referencias para los ScrollViews
  const hourScrollRef = React.useRef<ScrollView>(null);
  const minuteScrollRef = React.useRef<ScrollView>(null);
  const ampmScrollRef = React.useRef<ScrollView>(null);

  // Función para hacer scroll a una posición específica
  const scrollToPosition = (scrollViewRef: React.RefObject<ScrollView | null>, index: number) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: index * 40, animated: true });
    }
  };

  // Scroll inicial a las posiciones correctas
  React.useEffect(() => {
    setTimeout(() => {
      scrollToPosition(hourScrollRef, getCurrentHour() - 1);
      scrollToPosition(minuteScrollRef, tempDate.getMinutes());
      scrollToPosition(ampmScrollRef, getCurrentAMPM() === 'AM' ? 0 : 1);
    }, 100);
  }, []);

  // Manejar el scroll de horas
  const handleHourScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / 40);
    if (index >= 0 && index < 12) {
      const hour = index + 1;
      handleHourChange(hour);
    }
  };

  // Manejar el scroll de minutos
  const handleMinuteScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / 40);
    if (index >= 0 && index < 60) {
      handleMinuteChange(index);
    }
  };

  // Manejar el scroll de AM/PM
  const handleAMPMScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / 40);
    if (index >= 0 && index < 2) {
      const ampmValue = index === 0 ? 'AM' : 'PM';
      handleAMPMChange(ampmValue);
    }
  };

  return (
    <View style={styles.customPickerModal}>
      <View style={styles.customPickerContainer}>
        <View style={styles.customPickerHeader}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.customPickerTitle}>
            {mode === 'date' ? 'Seleccionar Fecha' : 'Seleccionar Hora'}
          </Text>
          <TouchableOpacity onPress={handleConfirm} style={styles.doneButton}>
            <Text style={styles.doneButtonText}>Listo</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.customPickerContent}>
          {mode === 'date' ? (
            <>
              <Text style={styles.currentValueText}>
                Fecha seleccionada: {formatDate(tempDate)}
              </Text>
              <View style={styles.dateControls}>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => {
                    const newDate = new Date(tempDate);
                    newDate.setDate(newDate.getDate() - 1);
                    setTempDate(newDate);
                  }}
                >
                  <Text style={styles.dateButtonText}>-1 día</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => {
                    const newDate = new Date(tempDate);
                    newDate.setDate(newDate.getDate() + 1);
                    setTempDate(newDate);
                  }}
                >
                  <Text style={styles.dateButtonText}>+1 día</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dateControls}>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => {
                    const newDate = new Date(tempDate);
                    newDate.setDate(newDate.getDate() - 7);
                    setTempDate(newDate);
                  }}
                >
                  <Text style={styles.dateButtonText}>-1 semana</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => {
                    const newDate = new Date(tempDate);
                    newDate.setDate(newDate.getDate() + 7);
                    setTempDate(newDate);
                  }}
                >
                  <Text style={styles.dateButtonText}>+1 semana</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.currentValueText}>
                Hora seleccionada: {formatTime(tempDate)}
              </Text>
              
              {/* Selector de hora tipo rueda (spinner) */}
              <View style={styles.timePickerContainer}>
                {/* Columna de horas */}
                <View style={styles.timeColumn}>
                  <Text style={styles.timeColumnLabel}>Hora</Text>
                  <View style={styles.timeWheelContainer}>
                    <View style={styles.timeWheelSelection} />
                    <ScrollView 
                      ref={hourScrollRef}
                      style={styles.timeWheel}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={40}
                      decelerationRate="fast"
                      contentContainerStyle={styles.timeWheelContent}
                      onMomentumScrollEnd={handleHourScroll}
                      scrollEventThrottle={16}
                    >
                      {hours.map((hour) => (
                        <View key={hour} style={styles.timeWheelOption}>
                          <Text style={[
                            styles.timeWheelOptionText,
                            getCurrentHour() === hour && styles.timeWheelOptionTextSelected
                          ]}>
                            {hour}
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                {/* Columna de minutos */}
                <View style={styles.timeColumn}>
                  <Text style={styles.timeColumnLabel}>Minuto</Text>
                  <View style={styles.timeWheelContainer}>
                    <View style={styles.timeWheelSelection} />
                    <ScrollView 
                      ref={minuteScrollRef}
                      style={styles.timeWheel}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={40}
                      decelerationRate="fast"
                      contentContainerStyle={styles.timeWheelContent}
                      onMomentumScrollEnd={handleMinuteScroll}
                      scrollEventThrottle={16}
                    >
                      {minutes.map((minute) => (
                        <View key={minute} style={styles.timeWheelOption}>
                          <Text style={[
                            styles.timeWheelOptionText,
                            tempDate.getMinutes() === minute && styles.timeWheelOptionTextSelected
                          ]}>
                            {minute.toString().padStart(2, '0')}
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                {/* Columna de AM/PM */}
                <View style={styles.timeColumn}>
                  <Text style={styles.timeColumnLabel}>AM/PM</Text>
                  <View style={styles.timeWheelContainer}>
                    <View style={styles.timeWheelSelection} />
                    <ScrollView 
                      ref={ampmScrollRef}
                      style={styles.timeWheel}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={40}
                      decelerationRate="fast"
                      contentContainerStyle={styles.timeWheelContent}
                      onMomentumScrollEnd={handleAMPMScroll}
                      scrollEventThrottle={16}
                    >
                      {ampm.map((ampmValue) => (
                        <View key={ampmValue} style={styles.timeWheelOption}>
                          <Text style={[
                            styles.timeWheelOptionText,
                            getCurrentAMPM() === ampmValue && styles.timeWheelOptionTextSelected
                          ]}>
                            {ampmValue}
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

export const QRForm: React.FC<QRFormProps> = ({
  guest,
  organizationId,
  onClose,
  onQRCreated,
}) => {
  const [qrPurpose, setQrPurpose] = useState('');
  const [qrStartDateTime, setQrStartDateTime] = useState(new Date());
  const [qrEndDateTime, setQrEndDateTime] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [isCreating, setIsCreating] = useState(false);
  
  // Estados para los pickers de fecha y hora
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [activePicker, setActivePicker] = useState<'start' | 'end'>('start');

  const guestsService = GuestsService.getInstance();

  const selectStartDate = () => {
    console.log('🔍 selectStartDate llamado');
    setActivePicker('start');
    setPickerMode('date');
    setShowStartDatePicker(true);
    console.log('🔍 showStartDatePicker establecido en true');
  };

  const selectStartTime = () => {
    console.log('🔍 selectStartTime llamado');
    setActivePicker('start');
    setPickerMode('time');
    setShowStartTimePicker(true);
    console.log('🔍 showStartTimePicker establecido en true');
  };

  const selectEndDate = () => {
    console.log('🔍 selectEndDate llamado');
    setActivePicker('end');
    setPickerMode('date');
    setShowEndDatePicker(true);
    console.log('🔍 showEndDatePicker establecido en true');
  };

  const selectEndTime = () => {
    console.log('🔍 selectEndTime llamado');
    setActivePicker('end');
    setPickerMode('time');
    setShowEndTimePicker(true);
    console.log('🔍 showEndTimePicker establecido en true');
  };

  const handleDateTimeChange = (event: any, selectedDate?: Date) => {
    console.log('🔍 handleDateTimeChange llamado', { event, selectedDate, activePicker, pickerMode });
    
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
      setShowStartTimePicker(false);
      setShowEndDatePicker(false);
      setShowEndTimePicker(false);
    }

    if (selectedDate) {
      if (activePicker === 'start') {
        if (pickerMode === 'date') {
          // Mantener la hora actual, cambiar solo la fecha
          const newDate = new Date(selectedDate);
          newDate.setHours(qrStartDateTime.getHours());
          newDate.setMinutes(qrStartDateTime.getMinutes());
          setQrStartDateTime(newDate);
          console.log('🔍 Nueva fecha de inicio establecida:', newDate);
        } else {
          // Mantener la fecha actual, cambiar solo la hora
          const newDate = new Date(qrStartDateTime);
          newDate.setHours(selectedDate.getHours());
          newDate.setMinutes(selectedDate.getMinutes());
          setQrStartDateTime(newDate);
          console.log('🔍 Nueva hora de inicio establecida:', newDate);
        }
      } else {
        if (pickerMode === 'date') {
          // Mantener la hora actual, cambiar solo la fecha
          const newDate = new Date(selectedDate);
          newDate.setHours(qrEndDateTime.getHours());
          newDate.setMinutes(qrEndDateTime.getMinutes());
          setQrEndDateTime(newDate);
          console.log('🔍 Nueva fecha de fin establecida:', newDate);
        } else {
          // Mantener la fecha actual, cambiar solo la hora
          const newDate = new Date(qrEndDateTime);
          newDate.setHours(selectedDate.getHours());
          newDate.setMinutes(selectedDate.getMinutes());
          setQrEndDateTime(newDate);
          console.log('🔍 Nueva hora de fin establecida:', newDate);
        }
      }
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('es-MX') + ' ' + date.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const generateGuestQR = async () => {
    if (!qrPurpose.trim()) {
      Alert.alert('Error', 'Por favor especifica el propósito de la visita');
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

    setIsCreating(true);
    try {
      // Usar el servicio para crear el QR del invitado
      const newGuestQR = await guestsService.createGuestQR(
        guest.id,
        organizationId,
        qrPurpose.trim(),
        startDateTime,
        endDateTime
      );
      
      // Generar imagen QR con información del invitado
      const qrData = JSON.stringify({
        qrCodeHash: newGuestQR.qrCodeHash,
        guest: guest.name,
        purpose: qrPurpose.trim(),
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString()
      });
      
      const qrCodeImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}&format=png&margin=10&color=000000&bgcolor=FFFFFF`;
      
      // Crear el código QR en Firebase
      await guestsService.addQRCodeToGuest(guest.id, organizationId, {
        purpose: qrPurpose.trim(),
        qrCodeHash: newGuestQR.qrCodeHash,
        qrCodeImage,
        startDateTime,
        endDateTime,
        isActive: true,
      });

      // Limpiar formulario
      setQrPurpose('');
      setQrStartDateTime(new Date());
      setQrEndDateTime(new Date(Date.now() + 24 * 60 * 60 * 1000));
      
      Alert.alert('Éxito', 'Código QR creado exitosamente');
      onQRCreated(); // Notificar que se creó el QR
      onClose(); // Cerrar el formulario
    } catch (error) {
      console.error('Error generando QR:', error);
      Alert.alert('Error', 'No se pudo generar el código QR');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo Código QR</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.guestInfo}>
            Invitado: <Text style={styles.guestName}>{guest.name}</Text>
          </Text>
          
          <Text style={styles.formLabel}>Propósito de la visita:</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ej: Visita familiar, Entrega de paquete, etc."
            placeholderTextColor="#999"
            value={qrPurpose}
            onChangeText={setQrPurpose}
            multiline
          />
          
          <Text style={styles.formLabel}>Fecha y Hora de Inicio:</Text>
          <TouchableOpacity 
            style={styles.dateTimeButton}
            onPress={selectStartDate}
          >
            <Text style={styles.dateTimeButtonText}>
              📅 {qrStartDateTime.toLocaleDateString('es-MX')} 🕐 {qrStartDateTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.pickerButtonsContainer}>
            <TouchableOpacity 
              style={styles.pickerButton}
              onPress={selectStartDate}
            >
              <Text style={styles.pickerButtonText}>📅 Cambiar Fecha</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.pickerButton}
              onPress={selectStartTime}
            >
              <Text style={styles.pickerButtonText}>🕐 Cambiar Hora</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.formLabel}>Fecha y Hora de Fin:</Text>
          <TouchableOpacity 
            style={styles.dateTimeButton}
            onPress={selectEndDate}
          >
            <Text style={styles.dateTimeButtonText}>
              📅 {qrEndDateTime.toLocaleDateString('es-MX')} 🕐 {qrEndDateTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.pickerButtonsContainer}>
            <TouchableOpacity 
              style={styles.pickerButton}
              onPress={selectEndDate}
            >
              <Text style={styles.pickerButtonText}>📅 Cambiar Fecha</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.pickerButton}
              onPress={selectEndTime}
            >
              <Text style={styles.pickerButtonText}>🕐 Cambiar Hora</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.resetButton}
            onPress={() => {
              setQrStartDateTime(new Date());
              setQrEndDateTime(new Date(Date.now() + 24 * 60 * 60 * 1000));
            }}
          >
            <Text style={styles.resetButtonText}>🔄 Resetear Fechas</Text>
          </TouchableOpacity>
          
          <View style={styles.scheduleSummary}>
            <Text style={styles.scheduleSummaryTitle}>📋 Horario Configurado</Text>
            <Text style={styles.scheduleSummaryText}>
              <Text style={styles.scheduleLabel}>Inicio:</Text> {formatDateTime(qrStartDateTime)}
            </Text>
            <Text style={styles.scheduleSummaryText}>
              <Text style={styles.scheduleLabel}>Fin:</Text> {formatDateTime(qrEndDateTime)}
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.generateButton, isCreating && styles.generateButtonDisabled]}
            onPress={generateGuestQR}
            disabled={isCreating}
            activeOpacity={0.8}
          >
            <Text style={styles.generateButtonText}>
              {isCreating ? 'Creando...' : 'Generar Código QR'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

              {/* DateTimePickers para Android */}
        {Platform.OS === 'android' && showStartDatePicker && (
          <CustomDateTimePicker
            value={qrStartDateTime}
            mode="date"
            onConfirm={(date) => {
              const newDate = new Date(date);
              newDate.setHours(qrStartDateTime.getHours());
              newDate.setMinutes(qrStartDateTime.getMinutes());
              setQrStartDateTime(newDate);
              setShowStartDatePicker(false);
            }}
            onCancel={() => setShowStartDatePicker(false)}
          />
        )}
        {Platform.OS === 'android' && showStartTimePicker && (
          <CustomDateTimePicker
            value={qrStartDateTime}
            mode="time"
            onConfirm={(date) => {
              const newDate = new Date(qrStartDateTime);
              newDate.setHours(date.getHours());
              newDate.setMinutes(date.getMinutes());
              setQrStartDateTime(newDate);
              setShowStartTimePicker(false);
            }}
            onCancel={() => setShowStartTimePicker(false)}
          />
        )}
        {Platform.OS === 'android' && showEndDatePicker && (
          <CustomDateTimePicker
            value={qrEndDateTime}
            mode="date"
            onConfirm={(date) => {
              const newDate = new Date(date);
              newDate.setHours(qrEndDateTime.getHours());
              newDate.setMinutes(qrEndDateTime.getMinutes());
              setQrEndDateTime(newDate);
              setShowStartDatePicker(false);
            }}
            onCancel={() => setShowEndDatePicker(false)}
          />
        )}
        {Platform.OS === 'android' && showEndTimePicker && (
          <CustomDateTimePicker
            value={qrEndDateTime}
            mode="time"
            onConfirm={(date) => {
              const newDate = new Date(qrEndDateTime);
              newDate.setHours(date.getHours());
              newDate.setMinutes(date.getMinutes());
              setQrEndDateTime(newDate);
              setShowEndTimePicker(false);
            }}
            onCancel={() => setShowEndTimePicker(false)}
          />
        )}

              {/* DateTimePickers para iOS */}
        {Platform.OS === 'ios' && (showStartDatePicker || showStartTimePicker) && (
          <CustomDateTimePicker
            value={qrStartDateTime}
            mode={pickerMode}
            onConfirm={(date) => {
              if (pickerMode === 'date') {
                const newDate = new Date(date);
                newDate.setHours(qrStartDateTime.getHours());
                newDate.setMinutes(qrStartDateTime.getMinutes());
                setQrStartDateTime(newDate);
              } else {
                const newDate = new Date(qrStartDateTime);
                newDate.setHours(date.getHours());
                newDate.setMinutes(date.getMinutes());
                setQrStartDateTime(newDate);
              }
              setShowStartDatePicker(false);
              setShowStartTimePicker(false);
            }}
            onCancel={() => {
              setShowStartDatePicker(false);
              setShowStartTimePicker(false);
            }}
          />
        )}
        {Platform.OS === 'ios' && (showEndDatePicker || showEndTimePicker) && (
          <CustomDateTimePicker
            value={qrEndDateTime}
            mode={pickerMode}
            onConfirm={(date) => {
              if (pickerMode === 'date') {
                const newDate = new Date(date);
                newDate.setHours(qrEndDateTime.getHours());
                newDate.setMinutes(date.getMinutes());
                setQrEndDateTime(newDate);
              } else {
                const newDate = new Date(qrEndDateTime);
                newDate.setHours(date.getHours());
                newDate.setMinutes(date.getMinutes());
                setQrEndDateTime(newDate);
              }
              setShowEndDatePicker(false);
              setShowEndTimePicker(false);
              setShowEndTimePicker(false);
            }}
            onCancel={() => {
              setShowEndDatePicker(false);
              setShowEndTimePicker(false);
            }}
          />
        )}
    </View>
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
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginTop: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  guestInfo: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
    textAlign: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  guestName: {
    fontWeight: '600',
    color: '#333333',
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    marginTop: 20,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333333',
    backgroundColor: '#ffffff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateTimeButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  dateTimeButtonText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  pickerButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pickerButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 0.48,
  },
  pickerButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  resetButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  scheduleSummary: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  scheduleSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },
  scheduleSummaryText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 6,
  },
  scheduleLabel: {
    fontWeight: '600',
    color: '#333333',
  },
  generateButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  generateButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // New styles for CustomDateTimePicker
  customPickerModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  customPickerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '80%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  customPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  customPickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  doneButton: {
    padding: 8,
  },
  doneButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  customPickerContent: {
    padding: 20,
  },
  currentValueText: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 15,
    textAlign: 'center',
  },
  dateControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  dateButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  timeColumn: {
    alignItems: 'center',
  },
  timeColumnLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 10,
  },
  timeWheelContainer: {
    width: 100,
    height: 150,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  timeWheel: {
    flex: 1,
  },
  timeWheelContent: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  timeWheelOption: {
    paddingVertical: 10,
  },
  timeWheelOptionText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333333',
  },
  timeWheelOptionTextSelected: {
    color: '#6366f1',
  },
  timeWheelSelection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: '#6366f1',
    borderRadius: 5,
    zIndex: 1,
  },
});
