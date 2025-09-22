import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../utils/authContext';
import { useOrganization } from '../utils/organizationContext';
import { Member } from '../types';
import { 
  updateUserProfile, 
  updateEmergencyContacts, 
  addEmergencyContact as addEmergencyContactToFirebase,
  updateEmergencyContact as updateEmergencyContactInFirebase,
  removeEmergencyContact as removeEmergencyContactFromFirebase,
  db
} from '../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

interface ProfileScreenProps {
  onGoBack?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onGoBack }) => {
  const { user, logout } = useAuth();
  const { currentOrganization, loadUserOrganizations } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const member = user as Member;

  // Estados para la información personal
  const [personalInfo, setPersonalInfo] = useState({
    name: member?.name || '',
    phone: member?.phone || '',
    homeAddress: member?.homeAddress || '',
    birthDate: member?.birthDate || '',
  });

  // Estados para la información de residencia
  const [residenceInfo, setResidenceInfo] = useState({
    homeNumber: member?.homeNumber || '',
    parkingSpot: member?.parkingSpot || '',
  });

  // Estados para la información del vehículo
  const [vehicleInfo, setVehicleInfo] = useState({
    plate: member?.vehicleInfo?.plate || '',
    model: member?.vehicleInfo?.model || '',
    color: member?.vehicleInfo?.color || '',
  });

  // Estados para información de edificio
  const [buildingInfo, setBuildingInfo] = useState({
    tower: member?.buildingInfo?.tower || '',
    apartment: member?.buildingInfo?.apartment || '',
  });

  // Estado para tipo de residencia (para comunidades mixtas)
  const [residenceType, setResidenceType] = useState<'casa' | 'edificio'>(
    member?.residenceType || 'casa'
  );

  // Estados para contactos de emergencia
  const [emergencyContacts, setEmergencyContacts] = useState(
    member?.emergencyContacts || []
  );

  // Estados para configuración
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    language: 'es',
    locationSharing: true,
  });

  useEffect(() => {
    if (member) {
      setPersonalInfo({
        name: member.name || '',
        phone: member.phone || '',
        homeAddress: member?.homeAddress || '',
        birthDate: member?.birthDate || '',
      });

      setResidenceInfo({
        homeNumber: member?.homeNumber || '',
        parkingSpot: member?.parkingSpot || '',
      });

      setVehicleInfo({
        plate: member?.vehicleInfo?.plate || '',
        model: member?.vehicleInfo?.model || '',
        color: member?.vehicleInfo?.color || '',
      });

      setBuildingInfo({
        tower: member?.buildingInfo?.tower || '',
        apartment: member?.buildingInfo?.apartment || '',
      });

      setResidenceType(member?.residenceType || 'casa');

      setEmergencyContacts(member?.emergencyContacts || []);
    }
  }, [member]);

  // Cargar la organización del usuario cuando el componente se monte
  useEffect(() => {
    if (member?.id) {
      console.log('🔄 Cargando organización para usuario:', member.id);
      loadUserOrganizations(member.id);
    }
  }, [member?.id]); // Removida la dependencia loadUserOrganizations para evitar bucle infinito

  const handleSaveChanges = async () => {
    if (!member?.id) {
      Alert.alert('❌ Error', 'No se pudo identificar al usuario');
      return;
    }

    setSaving(true);
    try {
      // Preparar los datos del perfil para guardar
      const profileData = {
        name: personalInfo.name,
        phone: personalInfo.phone,
        homeAddress: personalInfo.homeAddress,
        birthDate: personalInfo.birthDate,
        homeNumber: residenceInfo.homeNumber,
        parkingSpot: residenceInfo.parkingSpot,
        vehicleInfo: {
          plate: vehicleInfo.plate,
          model: vehicleInfo.model,
          color: vehicleInfo.color,
        },
        buildingInfo: {
          tower: buildingInfo.tower,
          apartment: buildingInfo.apartment,
        },
        residenceType: residenceType,
        emergencyContacts: emergencyContacts,
      };

      // Debug: mostrar los datos que se van a guardar
      console.log('💾 Datos del perfil a guardar:', profileData);
      console.log('🏢 Tipo de comunidad actual:', currentOrganization?.communityType);
      console.log('🏠 Tipo de residencia seleccionado:', residenceType);

      // Guardar en Firebase
      await updateUserProfile(member.id, profileData);
      
      // También sincronizar contactos de emergencia por separado para asegurar consistencia
      await updateEmergencyContacts(member.id, emergencyContacts);
      
      console.log('✅ Perfil guardado exitosamente en Firebase');
      Alert.alert('✨ Éxito', 'Todos los cambios se han guardado correctamente en Firebase');
      
      // Recargar los datos del usuario desde Firebase para asegurar sincronización
      await refreshUserData();
      
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      Alert.alert('❌ Error', 'No se pudieron guardar los cambios en Firebase');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      '🚪 Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', onPress: logout, style: 'destructive' },
      ]
    );
  };

  const addEmergencyContact = async () => {
    const newContact = {
      id: Date.now().toString(),
      name: '',
      phone: '',
      relation: '',
      priority: 'secondary' as 'primary' | 'secondary',
    };
    
    try {
      // Agregar a Firebase
      await addEmergencyContactToFirebase(member.id, newContact);
      
      // Actualizar estado local
      setEmergencyContacts([...emergencyContacts, newContact]);
      
      Alert.alert('✅ Éxito', 'Nuevo contacto de emergencia agregado');
    } catch (error) {
      console.error('Error adding emergency contact:', error);
      Alert.alert('❌ Error', 'No se pudo agregar el contacto de emergencia');
    }
  };

  const removeEmergencyContact = async (id: string) => {
    try {
      // Eliminar de Firebase
      await removeEmergencyContactFromFirebase(member.id, id);
      
      // Actualizar estado local
      setEmergencyContacts(emergencyContacts.filter(contact => contact.id !== id));
      
      Alert.alert('✅ Éxito', 'Contacto de emergencia eliminado correctamente');
    } catch (error) {
      console.error('Error removing emergency contact:', error);
      Alert.alert('❌ Error', 'No se pudo eliminar el contacto de emergencia');
    }
  };

  const updateEmergencyContact = (id: string, field: string, value: string) => {
    // Actualizar estado local inmediatamente para mejor UX
    setEmergencyContacts(emergencyContacts.map(contact =>
      contact.id === id ? { ...contact, [field]: value } : contact
    ));
    
    // Opcional: También se puede guardar automáticamente en Firebase aquí
    // Pero por ahora solo actualizamos el estado local
    // El usuario debe presionar el botón de guardar para persistir en Firebase
  };

  // Función para renderizar la información de residencia según el tipo de comunidad
  const renderResidenceInfo = () => {
    // Obtener el tipo de comunidad, con fallback a 'privada'
    let communityType = currentOrganization?.communityType || 'privada';
    
    // Debug: mostrar el tipo de comunidad actual
    console.log('🏘️ Tipo de comunidad detectado:', communityType);
    console.log('🏢 Organización actual:', currentOrganization?.name);
    console.log('🔍 Datos completos de la organización:', currentOrganization);
    console.log('🆔 ID de organización:', currentOrganization?.id);
    console.log('📱 Usuario actual:', member?.id);
    
    // Validar que el tipo sea válido
    if (!['privada', 'edificio', 'mixto'].includes(communityType)) {
      console.warn('⚠️ Tipo de comunidad no válido:', communityType, 'usando fallback: privada');
      // Fallback a privada si el tipo no es válido
      communityType = 'privada';
    }
    
    if (communityType === 'privada') {
      // Comunidad de puras casas - mostrar campos de casa
      return (
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="home" size={24} color="#9C27B0" />
            <Text style={styles.cardTitle}>Información de Residencia</Text>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Dirección</Text>
            <TextInput
              style={styles.textInput}
              value={personalInfo.homeAddress}
              onChangeText={(text) => setPersonalInfo({...personalInfo, homeAddress: text})}
              placeholder="Tu dirección de residencia"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Número de Casa</Text>
            <TextInput
              style={styles.textInput}
              value={residenceInfo.homeNumber}
              onChangeText={(text) => setResidenceInfo({...residenceInfo, homeNumber: text})}
              placeholder="Número de tu casa"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Lugar de Estacionamiento</Text>
            <TextInput
              style={styles.textInput}
              value={residenceInfo.parkingSpot}
              onChangeText={(text) => setResidenceInfo({...residenceInfo, parkingSpot: text})}
              placeholder="Tu lugar de estacionamiento"
            />
          </View>
        </View>
      );
    } else if (communityType === 'edificio') {
      // Comunidad de edificio - mostrar campos de torre y departamento
      return (
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="business" size={24} color="#9C27B0" />
            <Text style={styles.cardTitle}>Información de Edificio</Text>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Dirección</Text>
            <TextInput
              style={styles.textInput}
              value={personalInfo.homeAddress}
              onChangeText={(text) => setPersonalInfo({...personalInfo, homeAddress: text})}
              placeholder="Tu dirección de residencia"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Torre</Text>
            <TextInput
              style={styles.textInput}
              value={buildingInfo.tower}
              onChangeText={(text) => setBuildingInfo({...buildingInfo, tower: text})}
              placeholder="Número o nombre de la torre"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Departamento</Text>
            <TextInput
              style={styles.textInput}
              value={buildingInfo.apartment}
              onChangeText={(text) => setBuildingInfo({...buildingInfo, apartment: text})}
              placeholder="Número de departamento"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Lugar de Estacionamiento</Text>
            <TextInput
              style={styles.textInput}
              value={residenceInfo.parkingSpot}
              onChangeText={(text) => setResidenceInfo({...residenceInfo, parkingSpot: text})}
              placeholder="Tu lugar de estacionamiento"
            />
          </View>
        </View>
      );
    } else if (communityType === 'mixto') {
      // Comunidad mixta - mostrar botones de selección y campos según selección
      return (
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="home" size={24} color="#9C27B0" />
            <Text style={styles.cardTitle}>Información de Residencia</Text>
          </View>
          
          {/* Botones de selección de tipo de residencia */}
          <View style={styles.residenceTypeSelector}>
            <Text style={styles.inputLabel}>Tipo de Residencia</Text>
            <View style={styles.typeButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  residenceType === 'casa' && styles.typeButtonActive
                ]}
                onPress={() => setResidenceType('casa')}
              >
                <Ionicons 
                  name="home" 
                  size={20} 
                  color={residenceType === 'casa' ? '#ffffff' : '#9C27B0'} 
                />
                <Text style={[
                  styles.typeButtonText,
                  residenceType === 'casa' && styles.typeButtonTextActive
                ]}>
                  Casa
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  residenceType === 'edificio' && styles.typeButtonActive
                ]}
                onPress={() => setResidenceType('edificio')}
              >
                <Ionicons 
                  name="business" 
                  size={20} 
                  color={residenceType === 'edificio' ? '#ffffff' : '#9C27B0'} 
                />
                <Text style={[
                  styles.typeButtonText,
                  residenceType === 'edificio' && styles.typeButtonTextActive
                ]}>
                  Edificio
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Campos según el tipo seleccionado */}
          {residenceType === 'casa' ? (
            // Campos para casa
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Dirección</Text>
                <TextInput
                  style={styles.textInput}
                  value={personalInfo.homeAddress}
                  onChangeText={(text) => setPersonalInfo({...personalInfo, homeAddress: text})}
                  placeholder="Tu dirección de residencia"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Número de Casa</Text>
                <TextInput
                  style={styles.textInput}
                  value={residenceInfo.homeNumber}
                  onChangeText={(text) => setResidenceInfo({...residenceInfo, homeNumber: text})}
                  placeholder="Número de tu casa"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Lugar de Estacionamiento</Text>
                <TextInput
                  style={styles.textInput}
                  value={residenceInfo.parkingSpot}
                  onChangeText={(text) => setResidenceInfo({...residenceInfo, parkingSpot: text})}
                  placeholder="Tu lugar de estacionamiento"
                />
              </View>
            </>
          ) : (
            // Campos para edificio
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Dirección</Text>
                <TextInput
                  style={styles.textInput}
                  value={personalInfo.homeAddress}
                  onChangeText={(text) => setPersonalInfo({...personalInfo, homeAddress: text})}
                  placeholder="Tu dirección de residencia"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Torre</Text>
                <TextInput
                  style={styles.textInput}
                  value={buildingInfo.tower}
                  onChangeText={(text) => setBuildingInfo({...buildingInfo, tower: text})}
                  placeholder="Número o nombre de la torre"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Departamento</Text>
                <TextInput
                  style={styles.textInput}
                  value={buildingInfo.apartment}
                  onChangeText={(text) => setBuildingInfo({...buildingInfo, apartment: text})}
                  placeholder="Número de departamento"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Lugar de Estacionamiento</Text>
                <TextInput
                  style={styles.textInput}
                  value={residenceInfo.parkingSpot}
                  onChangeText={(text) => setResidenceInfo({...residenceInfo, parkingSpot: text})}
                  placeholder="Tu lugar de estacionamiento"
                />
              </View>
            </>
          )}
        </View>
      );
    }
    
    // Fallback para tipo no reconocido
    return null;
  };

  // Función para guardar un contacto de emergencia individual
  const handleSaveEmergencyContact = async (contactId: string) => {
    const contact = emergencyContacts.find(c => c.id === contactId);
    if (!contact) return;

    // Validar que el contacto tenga información básica
    if (!contact.name.trim() || !contact.phone.trim()) {
      Alert.alert('Error', 'Por favor completa el nombre y teléfono del contacto');
      return;
    }

    try {
      // Guardar en Firebase
      await updateEmergencyContactInFirebase(member.id, contactId, contact);
      
      // Actualizar estado local si es necesario
      setEmergencyContacts(prev => prev.map(c => 
        c.id === contactId ? { ...c, ...contact } : c
      ));
      
      Alert.alert('✅ Éxito', 'Contacto de emergencia guardado en Firebase correctamente');
    } catch (error) {
      console.error('Error saving emergency contact:', error);
      Alert.alert('❌ Error', 'No se pudo guardar el contacto de emergencia en Firebase');
    }
  };

  // Función para refrescar los datos del usuario desde Firebase
  const refreshUserData = async () => {
    if (!member?.id) return;
    
    try {
      console.log('🔄 Refrescando datos del usuario desde Firebase...');
      
      // Obtener datos actualizados del usuario desde Firebase
      const userRef = doc(db, 'users', member.id);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('📊 Datos actualizados del usuario:', userData);
        
        // Actualizar todos los estados con los datos frescos de Firebase
        setPersonalInfo({
          name: userData.name || '',
          phone: userData.phone || '',
          homeAddress: userData.homeAddress || '',
          birthDate: userData.birthDate || '',
        });

        setResidenceInfo({
          homeNumber: userData.homeNumber || '',
          parkingSpot: userData.parkingSpot || '',
        });

        setVehicleInfo({
          plate: userData.vehicleInfo?.plate || '',
          model: userData.vehicleInfo?.model || '',
          color: userData.vehicleInfo?.color || '',
        });

        setBuildingInfo({
          tower: userData.buildingInfo?.tower || '',
          apartment: userData.buildingInfo?.apartment || '',
        });

        setResidenceType(userData.residenceType || 'casa');
        setEmergencyContacts(userData.emergencyContacts || []);
        
        console.log('✅ Datos del usuario refrescados exitosamente');
      }
    } catch (error) {
      console.error('❌ Error refrescando datos del usuario:', error);
    }
  };

  // Función para formatear la fecha de nacimiento automáticamente
  const formatBirthDate = (text: string) => {
    // Remover todo excepto números
    const numbers = text.replace(/\D/g, '');
    
    // Aplicar formato DD/MM/AAAA
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else if (numbers.length <= 8) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`;
    } else {
      // Limitar a 8 dígitos (DD/MM/AAAA)
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
    }
  };

  if (!member) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#64B5F6" />
            <Text style={styles.loadingText}>Cargando perfil...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.centerSection}>
          <View style={styles.mainLogo}>
            <Ionicons name="person" size={32} color="#64B5F6" />
          </View>
          <Text style={styles.welcomeText}>PERFIL</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#ff6b6b" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header Card */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {member.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.avatarBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            </View>
          </View>
          <Text style={styles.userName}>{member.name || 'Usuario'}</Text>
          <Text style={styles.userEmail}>{member.email}</Text>
          <Text style={styles.userRole}>{member.userType === 'member' ? 'Miembro' : 'Usuario'}</Text>
        </View>



        {/* Personal Information Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-circle" size={24} color="#64B5F6" />
            <Text style={styles.cardTitle}>Información Personal</Text>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre Completo</Text>
            <TextInput
              style={styles.textInput}
              value={personalInfo.name}
              onChangeText={(text) => setPersonalInfo({...personalInfo, name: text})}
              placeholder="Tu nombre completo"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Teléfono</Text>
            <TextInput
              style={styles.textInput}
              value={personalInfo.phone}
              onChangeText={(text) => setPersonalInfo({...personalInfo, phone: text})}
              placeholder="Tu número de teléfono"
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Fecha de Nacimiento</Text>
            <TextInput
              style={styles.textInput}
              value={personalInfo.birthDate}
              onChangeText={(text) => {
                const formattedDate = formatBirthDate(text);
                setPersonalInfo({...personalInfo, birthDate: formattedDate});
              }}
              placeholder="DD/MM/AAAA"
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

        </View>

        {/* Residence Information Card - Renderizado condicional */}
        {renderResidenceInfo()}

        {/* Vehicle Information Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="car" size={24} color="#FF9800" />
            <Text style={styles.cardTitle}>Información del Vehículo</Text>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Placa del Vehículo</Text>
            <TextInput
              style={styles.textInput}
              value={vehicleInfo.plate}
              onChangeText={(text) => setVehicleInfo({...vehicleInfo, plate: text})}
              placeholder="Placa de tu vehículo"
              autoCapitalize="characters"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Modelo del Vehículo</Text>
            <TextInput
              style={styles.textInput}
              value={vehicleInfo.model}
              onChangeText={(text) => setVehicleInfo({...vehicleInfo, model: text})}
              placeholder="Modelo de tu vehículo"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Color del Vehículo</Text>
            <TextInput
              style={styles.textInput}
              value={vehicleInfo.color}
              onChangeText={(text) => setVehicleInfo({...vehicleInfo, color: text})}
              placeholder="Color de tu vehículo"
            />
          </View>
        </View>

        {/* Emergency Contacts Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="call" size={24} color="#FF5722" />
            <Text style={styles.cardTitle}>Contactos de Emergencia</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={addEmergencyContact}
            >
              <Ionicons name="add-circle" size={24} color="#4CAF50" />
            </TouchableOpacity>
          </View>
          
          {emergencyContacts.map((contact, index) => (
            <View key={contact.id} style={styles.emergencyContactItem}>
              <View style={styles.contactInputs}>
                <TextInput
                  style={[styles.textInput, styles.contactInput]}
                  value={contact.name}
                  onChangeText={(text) => updateEmergencyContact(contact.id, 'name', text)}
                  placeholder="Nombre del contacto"
                />
                <TextInput
                  style={[styles.textInput, styles.contactInput]}
                  value={contact.phone}
                  onChangeText={(text) => updateEmergencyContact(contact.id, 'phone', text)}
                  placeholder="Teléfono"
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={[styles.textInput, styles.contactInput]}
                  value={contact.relation}
                  onChangeText={(text) => updateEmergencyContact(contact.id, 'relation', text)}
                  placeholder="Relación (familiar, amigo, etc.)"
                />
              </View>
              <View style={styles.contactActions}>
                <TouchableOpacity 
                  style={styles.saveContactButton}
                  onPress={() => handleSaveEmergencyContact(contact.id)}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => removeEmergencyContact(contact.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF5722" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          
          {emergencyContacts.length === 0 && (
            <Text style={styles.emptyContactsText}>
              No hay contactos de emergencia configurados
            </Text>
          )}
        </View>

        {/* Settings Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="settings" size={24} color="#FF9800" />
            <Text style={styles.cardTitle}>Configuración</Text>
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications" size={20} color="#666" />
              <Text style={styles.settingText}>Notificaciones</Text>
            </View>
            <Switch
              value={settings.notifications}
              onValueChange={(value) => setSettings({...settings, notifications: value})}
              trackColor={{ false: '#e0e0e0', true: '#64B5F6' }}
              thumbColor={settings.notifications ? '#ffffff' : '#f4f3f4'}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="location" size={20} color="#666" />
              <Text style={styles.settingText}>Compartir Ubicación</Text>
            </View>
            <Switch
              value={settings.locationSharing}
              onValueChange={(value) => setSettings({...settings, locationSharing: value})}
              trackColor={{ false: '#e0e0e0', true: '#64B5F6' }}
              thumbColor={settings.locationSharing ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSaveChanges}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
          )}
        </TouchableOpacity>
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
  logoutButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  profileHeaderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 30,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#64B5F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  userRole: {
    fontSize: 14,
    color: '#9C27B0',
    fontWeight: '600',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
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
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  saveButton: {
    backgroundColor: '#64B5F6',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#64B5F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0.1,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    marginTop: 20,
  },
  // Emergency Contacts Styles
  addButton: {
    marginLeft: 'auto',
    padding: 4,
  },
  emergencyContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  contactInputs: {
    flex: 1,
    marginRight: 12,
  },
  contactInput: {
    marginBottom: 8,
    fontSize: 14,
    paddingVertical: 10,
  },
  removeButton: {
    padding: 8,
    backgroundColor: '#ffebee',
    borderRadius: 8,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveContactButton: {
    padding: 8,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
  },
  emptyContactsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  // Estilos para selector de tipo de residencia
  residenceTypeSelector: {
    marginBottom: 20,
  },
  typeButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#9C27B0',
    backgroundColor: '#ffffff',
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: '#9C27B0',
    borderColor: '#9C27B0',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9C27B0',
  },
  typeButtonTextActive: {
    color: '#ffffff',
  },

});

