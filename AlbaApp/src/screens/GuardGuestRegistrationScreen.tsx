import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { useAuth } from '../utils/authContext';
import { Guard } from '../types';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

export const GuardGuestRegistrationScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [guestName, setGuestName] = useState('');
  const [destination, setDestination] = useState('');
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Don't render if user is not a guard
  if (!user || user.userType !== 'guard') {
    return null;
  }

  const guard = user as Guard;
  const guardName = guard?.name || 'Guardia';

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
    return status === 'granted';
  };

  const takePhoto = async () => {
    if (!hasPermission) {
      const granted = await requestCameraPermission();
      if (!granted) {
        Alert.alert('Permiso denegado', 'Se necesita permiso de cámara para tomar la foto');
        return;
      }
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setIdPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const removePhoto = () => {
    setIdPhoto(null);
  };

  const handleSubmit = () => {
    if (!guestName.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre completo del invitado');
      return;
    }

    if (!destination.trim()) {
      Alert.alert('Error', 'Por favor ingresa el destino del invitado');
      return;
    }

    if (!idPhoto) {
      Alert.alert('Error', 'Por favor toma una foto de identificación');
      return;
    }

    // Aquí se enviaría la información a Firebase
    Alert.alert(
      'Invitado Registrado',
      `Invitado: ${guestName}\nDestino: ${destination}\nFoto: Capturada`,
      [
        {
          text: 'Registrar Otro',
          onPress: () => {
            setGuestName('');
            setDestination('');
            setIdPhoto(null);
          },
        },
        { text: 'OK' },
      ]
    );
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gradientBackground}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.badgeContainer}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>🛡️</Text>
              </View>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Registro de Invitados</Text>
                <Text style={styles.headerSubtitle}>
                  Guardia: {guardName}
                </Text>
              </View>
            </View>
            
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{guardName.charAt(0).toUpperCase()}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Formulario de Registro */}
        <View style={styles.formContainer}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>📝 Registro de Invitado</Text>
            <Text style={styles.formSubtitle}>
              Completa la información del invitado para su registro
            </Text>
          </View>

          {/* Campo Nombre Completo */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre Completo *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ingresa el nombre completo del invitado"
              value={guestName}
              onChangeText={setGuestName}
              autoCapitalize="words"
            />
          </View>

          {/* Campo Destino */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Destino *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="¿A dónde va el invitado?"
              value={destination}
              onChangeText={setDestination}
              autoCapitalize="words"
            />
          </View>

          {/* Campo Foto de Identificación */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Foto de Identificación *</Text>
            
            {!idPhoto ? (
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={takePhoto}
              >
                <Text style={styles.cameraButtonIcon}>📷</Text>
                <Text style={styles.cameraButtonText}>Tomar Foto de ID</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.photoPreviewContainer}>
                <Image source={{ uri: idPhoto }} style={styles.photoPreview} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={removePhoto}
                >
                  <Text style={styles.removePhotoButtonText}>🗑️ Eliminar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Botón de Envío */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!guestName.trim() || !destination.trim() || !idPhoto) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!guestName.trim() || !destination.trim() || !idPhoto}
          >
            <Text style={styles.submitButtonText}>✅ Registrar Invitado</Text>
          </TouchableOpacity>
        </View>

        {/* Botones de Acción */}
        <View style={styles.actionsContainer}>
          <Text style={styles.actionsTitle}>⚡ Acciones Rápidas</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>📋</Text>
              <Text style={styles.actionText}>Historial de Invitados</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>🔍</Text>
              <Text style={styles.actionText}>Buscar Invitado</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionText}>Reportes</Text>
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

      {/* Modal de Cámara */}
      {/* The camera modal is removed as per the new_code, as the camera functionality is now handled by expo-image-picker */}
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
    backgroundColor: '#dc2626',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  badgeContainer: {
    marginLeft: 15,
  },
  badge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerText: {
    marginLeft: 15,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formContainer: {
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
  formHeader: {
    marginBottom: 25,
    alignItems: 'center',
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 15,
    padding: 18,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    color: '#1f2937',
  },
  cameraButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cameraButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  cameraButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  photoPreviewContainer: {
    alignItems: 'center',
  },
  photoPreview: {
    width: 200,
    height: 150,
    borderRadius: 15,
    marginBottom: 15,
  },
  removePhotoButton: {
    backgroundColor: '#ef4444',
    borderRadius: 15,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  removePhotoButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#10b981',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
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
  // cameraModal: {
  //   position: 'absolute',
  //   top: 0,
  //   left: 0,
  //   right: 0,
  //   bottom: 0,
  //   backgroundColor: 'black',
  // },
  // camera: {
  //   flex: 1,
  // },
  // cameraOverlay: {
  //   position: 'absolute',
  //   bottom: 0,
  //   left: 0,
  //   right: 0,
  //   backgroundColor: 'rgba(0,0,0,0.5)',
  //   padding: 20,
  // },
  // cameraControls: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   alignItems: 'center',
  // },
  // cancelButton: {
  //   backgroundColor: '#ef4444',
  //   borderRadius: 15,
  //   padding: 15,
  //   alignItems: 'center',
  // },
  // cancelButtonText: {
  //   color: 'white',
  //   fontSize: 16,
  //   fontWeight: '600',
  // },
  // captureButton: {
  //   width: 80,
  //   height: 80,
  //   borderRadius: 40,
  //   backgroundColor: 'white',
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   borderWidth: 4,
  //   borderColor: '#3b82f6',
  // },
  // captureButtonInner: {
  //   width: 60,
  //   height: 60,
  //   borderRadius: 30,
  //   backgroundColor: '#3b82f6',
  // },
});
