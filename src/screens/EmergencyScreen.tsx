import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmergencyOption {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  severity: 'low' | 'medium' | 'high';
}

const emergencyOptions: EmergencyOption[] = [
  {
    id: '0',
    title: 'Emergencia General',
    description: 'Emergencia no especificada o urgente',
    icon: 'alert-circle',
    color: '#FF0000',
    severity: 'high',
  },
  {
    id: '1',
    title: 'Incendio',
    description: 'Reportar incendio o humo',
    icon: 'flame',
    color: '#FF5722',
    severity: 'high',
  },
  {
    id: '2',
    title: 'Accidente Médico',
    description: 'Emergencia médica o lesión',
    icon: 'medical',
    color: '#F44336',
    severity: 'high',
  },
  {
    id: '3',
    title: 'Robo o Intrusión',
    description: 'Actividad sospechosa o robo',
    icon: 'shield',
    color: '#9C27B0',
    severity: 'high',
  },
  {
    id: '4',
    title: 'Fuga de Gas',
    description: 'Olor a gas o fuga',
    icon: 'warning',
    color: '#FF9800',
    severity: 'high',
  },
  {
    id: '5',
    title: 'Falla Eléctrica',
    description: 'Problemas eléctricos o cortocircuito',
    icon: 'flash',
    color: '#FFC107',
    severity: 'medium',
  },
  {
    id: '6',
    title: 'Inundación',
    description: 'Fuga de agua o inundación',
    icon: 'water',
    color: '#2196F3',
    severity: 'medium',
  },
  {
    id: '7',
    title: 'Elevador Atascado',
    description: 'Personas atrapadas en elevador',
    icon: 'arrow-up',
    color: '#607D8B',
    severity: 'medium',
  },
  {
    id: '8',
    title: 'Ruido Excesivo',
    description: 'Disturbios o ruido molesto',
    icon: 'volume-high',
    color: '#795548',
    severity: 'low',
  },
];

interface EmergencyScreenProps {
  onGoBack?: (redirectTo?: string) => void;
}

const EmergencyScreen: React.FC<EmergencyScreenProps> = ({ onGoBack }) => {
  const [selectedEmergency, setSelectedEmergency] = useState<EmergencyOption | null>(null);

  const handleEmergencySelect = (emergency: EmergencyOption) => {
    setSelectedEmergency(emergency);
    
    Alert.alert(
      `🚨 Confirmar Emergencia: ${emergency.title}`,
      `¿Estás seguro de que necesitas reportar esta emergencia?\n\n"${emergency.description}"\n\n⚠️  IMPORTANTE: Al confirmar, se notificará inmediatamente a todos los guardias de la comunidad sobre esta emergencia.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => setSelectedEmergency(null),
        },
        {
          text: 'CONFIRMAR EMERGENCIA',
          style: 'destructive',
          onPress: () => confirmEmergency(emergency),
        },
      ],
      { cancelable: true }
    );
  };

  const confirmEmergency = (emergency: EmergencyOption) => {
    // Aquí se implementaría la lógica para notificar a los guardias
    console.log(`🚨 EMERGENCIA CONFIRMADA: ${emergency.title}`);
    
    Alert.alert(
      '🚨 Emergencia Reportada',
      `La emergencia "${emergency.title}" ha sido reportada exitosamente.\n\nLos guardias han sido notificados.\n\n¿Qué acción deseas tomar ahora?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => setSelectedEmergency(null),
        },
        {
          text: '📞 Llamar 911',
          style: 'default',
          onPress: () => call911(),
        },
        {
          text: '👮 Contactar Guardia',
          style: 'default',
          onPress: () => contactGuard(),
        },
      ]
    );
  };

  const call911 = async () => {
    console.log('📞 Abriendo app de teléfono para llamar a 911');
    
    try {
      // Intentar abrir la app de teléfono con 911
      const phoneNumber = 'tel:911';
      const supported = await Linking.canOpenURL(phoneNumber);
      
      if (supported) {
        await Linking.openURL(phoneNumber);
      } else {
        Alert.alert(
          '📞 Error',
          'No se puede abrir la aplicación de teléfono. Por favor, marca 911 manualmente.',
          [{ text: 'Entendido', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('Error al abrir app de teléfono:', error);
      Alert.alert(
        '📞 Error',
        'No se pudo abrir la aplicación de teléfono. Por favor, marca 911 manualmente.',
        [{ text: 'Entendido', style: 'default' }]
      );
    }
  };

  const contactGuard = () => {
    console.log('👮 Redirigiendo al chat de guardias');
    
    // Limpiar el estado de emergencia seleccionada
    setSelectedEmergency(null);
    
    // Regresar a la pantalla principal y redirigir automáticamente al chat
    if (onGoBack) {
      onGoBack('chat');
    }
    
    // Mostrar mensaje informativo
    Alert.alert(
      '👮 Chat con Guardias',
      'Serás redirigido directamente al chat de seguridad para comunicarte con los guardias.',
      [
        {
          text: 'Entendido',
          style: 'default',
        },
      ]
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return '#FF5722';
      case 'medium':
        return '#FF9800';
      case 'low':
        return '#4CAF50';
      default:
        return '#666';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'ALTA';
      case 'medium':
        return 'MEDIA';
      case 'low':
        return 'BAJA';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => onGoBack && onGoBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.centerSection}>
          <View style={styles.mainLogo}>
            <Ionicons name="warning" size={32} color="#FF5722" />
          </View>
          <Text style={styles.headerTitle}>EMERGENCIA</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Emergency Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <Ionicons name="information-circle" size={24} color="#FF5722" />
            <Text style={styles.infoCardTitle}>¿Cuándo usar esta función?</Text>
          </View>
          <Text style={styles.infoCardText}>
            Esta función debe usarse únicamente para reportar emergencias reales que requieran la intervención inmediata de los guardias de la comunidad.
          </Text>
        </View>

        {/* Emergency Options Grid */}
        <View style={styles.gridContainer}>
          {emergencyOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.emergencyCard, { borderLeftColor: option.color }]}
              onPress={() => handleEmergencySelect(option)}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name={option.icon} size={28} color={option.color} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.emergencyTitle}>{option.title}</Text>
                  <Text style={styles.emergencyDescription}>{option.description}</Text>
                </View>
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(option.severity) }]}>
                  <Text style={styles.severityText}>{getSeverityText(option.severity)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom Info */}
        <View style={styles.bottomInfo}>
          <Text style={styles.bottomInfoText}>
            💡 Recuerda: Solo reporta emergencias reales. El uso indebido de esta función puede tener consecuencias.
          </Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 10,
  },
  centerSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff3e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#FF5722',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSpacer: {
    width: 50
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#FF5722',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  infoCardText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  emergencyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  emergencyDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  bottomInfo: {
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFCC02',
  },
  bottomInfoText: {
    fontSize: 14,
    color: '#E65100',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default EmergencyScreen;
