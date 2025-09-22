import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { FormFieldConfig } from '../types/formConfig';
import { uploadImageToStorage } from '../utils/firebase';
import { useAuth } from '../utils/authContext';

interface DynamicFormFieldProps {
  field: FormFieldConfig;
  value: string | null;
  onChange: (value: string | null) => void;
  hasCameraPermission: boolean | null;
  readOnly?: boolean;
}

export const DynamicFormField: React.FC<DynamicFormFieldProps> = ({
  field,
  value,
  onChange,
  hasCameraPermission,
  readOnly = false,
}) => {
  const { user } = useAuth();
  const [photoUri, setPhotoUri] = useState<string | null>(value);
  const [isUploading, setIsUploading] = useState(false);

  const handleTextChange = (text: string) => {
    onChange(text);
  };

  const handlePhotoChange = async (uri: string | null) => {
    setPhotoUri(uri);
    
    if (uri && user?.organizationId) {
      try {
        setIsUploading(true);
        console.log('📤 [FORM-FIELD] Subiendo imagen para campo:', field.label);
        
        // Subir imagen a Firebase Storage
        const downloadURL = await uploadImageToStorage(
          uri, 
          user.organizationId, 
          field.id,
          user.id
        );
        
        console.log('✅ [FORM-FIELD] Imagen subida exitosamente:', downloadURL);
        onChange(downloadURL); // Usar la URL de Firebase Storage
      } catch (error) {
        console.error('❌ [FORM-FIELD] Error subiendo imagen:', error);
        Alert.alert(
          'Error', 
          'No se pudo subir la imagen. Se guardará localmente.',
          [{ text: 'OK' }]
        );
        onChange(uri); // Fallback a URI local
      } finally {
        setIsUploading(false);
      }
    } else {
      onChange(uri);
    }
  };

  const takePhoto = async () => {
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

    Alert.alert(
      `Foto de ${field.label}`,
      '¿Cómo desea obtener la foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Tomar Foto', 
          onPress: () => openCamera()
        },
        { 
          text: 'Seleccionar de Galería', 
          onPress: () => openImagePicker()
        },
      ]
    );
  };

  const openCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        handlePhotoChange(result.assets[0].uri);
      }
    } catch (error) {
      console.error('❌ Error tomando foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto. Inténtalo de nuevo.');
    }
  };

  const openImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        handlePhotoChange(result.assets[0].uri);
      }
    } catch (error) {
      console.error('❌ Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen. Inténtalo de nuevo.');
    }
  };

  const removePhoto = async () => {
    // Si la imagen está en Firebase Storage, eliminarla
    if (photoUri && photoUri.startsWith('https://firebasestorage.googleapis.com/')) {
      try {
        console.log('🗑️ [FORM-FIELD] Eliminando imagen de Firebase Storage:', photoUri);
        // Nota: Por ahora solo eliminamos la referencia local
        // En el futuro podríamos implementar la eliminación del archivo
      } catch (error) {
        console.error('❌ [FORM-FIELD] Error eliminando imagen:', error);
      }
    }
    
    handlePhotoChange(null);
  };

  const renderField = () => {
    // Debug: Log del tipo de campo recibido (solo cuando cambia el campo)
    useEffect(() => {
      console.log('🔍 [DYNAMIC-FORM-FIELD] Renderizando campo:', {
        fieldId: field.id,
        fieldLabel: field.label,
        fieldType: field.type,
        value: value
      });
    }, [field.id, field.type, value]);
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <TextInput
            style={[styles.textInput, readOnly && styles.readOnlyInput]}
            value={value || ''}
            onChangeText={handleTextChange}
            placeholder={field.placeholder}
            placeholderTextColor="#999"
            keyboardType={
              field.type === 'email' ? 'email-address' :
              field.type === 'phone' ? 'phone-pad' : 'default'
            }
            autoCapitalize={
              field.type === 'email' ? 'none' : 'words'
            }
            autoCorrect={field.type !== 'email'}
            editable={!readOnly}
          />
        );

      case 'textarea':
        return (
          <TextInput
            style={[styles.textInput, styles.textArea, readOnly && styles.readOnlyInput]}
            value={value || ''}
            onChangeText={handleTextChange}
            placeholder={field.placeholder}
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            editable={!readOnly}
          />
        );

      case 'select':
        return (
          <TouchableOpacity
            style={[styles.selectButton, readOnly && styles.readOnlyInput]}
            onPress={() => {
              if (!readOnly && field.options) {
                Alert.alert(
                  field.label,
                  'Seleccione una opción:',
                  [
                    ...field.options.map(option => ({
                      text: option,
                      onPress: () => handleTextChange(option),
                    })),
                    { text: 'Cancelar', style: 'cancel' },
                  ]
                );
              }
            }}
            disabled={readOnly}
          >
            <Text style={[styles.selectText, !value && styles.selectPlaceholder, readOnly && styles.readOnlyText]}>
              {value || field.placeholder || 'Seleccionar...'}
            </Text>
            {!readOnly && <Ionicons name="chevron-down" size={20} color="#666" />}
          </TouchableOpacity>
        );

      case 'photo':
      case 'file': // Agregar soporte para tipo 'file' también
        return (
          <View>
            {isUploading ? (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.uploadingText}>Subiendo imagen...</Text>
              </View>
            ) : photoUri ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                {!readOnly && (
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={removePhoto}
                  >
                    <Ionicons name="close-circle" size={24} color="#dc3545" />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              !readOnly && (
                <TouchableOpacity
                  style={styles.photoButton}
                  onPress={takePhoto}
                  disabled={hasCameraPermission === null}
                >
                  <Ionicons 
                    name="camera" 
                    size={24} 
                    color={hasCameraPermission === null ? "#999" : "#4CAF50"} 
                  />
                  <Text style={[
                    styles.photoButtonText,
                    hasCameraPermission === null && styles.photoButtonTextDisabled
                  ]}>
                    {hasCameraPermission === null ? 'Solicitando permisos...' : `Tomar Foto de ${field.label}`}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        );

      default:
        return (
          <TextInput
            style={[styles.textInput, readOnly && styles.readOnlyInput]}
            value={value || ''}
            onChangeText={handleTextChange}
            placeholder={field.placeholder}
            placeholderTextColor="#999"
            editable={!readOnly}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {field.label}
        {field.required && <Text style={styles.required}> *</Text>}
      </Text>
      {renderField()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  required: {
    color: '#dc3545',
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
  selectButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectText: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
  },
  selectPlaceholder: {
    color: '#999',
  },
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
  uploadingContainer: {
    height: 200,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  
  // Estilos para campos de solo lectura
  readOnlyInput: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e9ecef',
    opacity: 0.8,
  },
  readOnlyText: {
    color: '#6c757d',
  },
});
