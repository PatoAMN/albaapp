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
  StatusBar,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// TODO: Import incidents service when Firebase integration is ready
// import { incidentsService } from '../utils/incidentsService';

interface Incident {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  reportedBy: string;
  reportedAt: Date;
  location?: string;
  images?: string[];
}

interface IncidentsScreenProps {
  onGoBack?: () => void;
}

export const IncidentsScreen: React.FC<IncidentsScreenProps> = ({ onGoBack }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [showNewIncidentForm, setShowNewIncidentForm] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showIncidentDetail, setShowIncidentDetail] = useState(false);
  
  // Form states
  const [incidentTitle, setIncidentTitle] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentCategory, setIncidentCategory] = useState('');
  const [incidentPriority, setIncidentPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load incidents from Firebase (to be implemented)
  useEffect(() => {
    // TODO: Implement Firebase integration
    // const loadIncidents = async () => {
    //   try {
    //     const incidentsData = await incidentsService.getIncidents();
    //     setIncidents(incidentsData);
    //   } catch (error) {
    //     console.error('Error loading incidents:', error);
    //   }
    // };
    // loadIncidents();
  }, []);

  const categories = [
    'Mantenimiento',
    'Electricidad',
    'Plomería',
    'Seguridad',
    'Conducta',
    'Limpieza',
    'Otros'
  ];

  const priorities = [
    { value: 'low', label: 'Baja', color: '#4CAF50' },
    { value: 'medium', label: 'Media', color: '#FF9800' },
    { value: 'high', label: 'Alta', color: '#F44336' },
    { value: 'critical', label: 'Crítica', color: '#9C27B0' }
  ];

  const getPriorityColor = (priority: string) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return priorityObj?.color || '#666';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'in_progress': return '#2196F3';
      case 'resolved': return '#4CAF50';
      case 'closed': return '#666';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'in_progress': return 'En Progreso';
      case 'resolved': return 'Resuelto';
      case 'closed': return 'Cerrado';
      default: return 'Desconocido';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSubmitIncident = async () => {
    if (!incidentTitle.trim() || !incidentDescription.trim() || !incidentCategory) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // TODO: Implement Firebase integration
      // const newIncident = await incidentsService.createIncident({
      //   title: incidentTitle.trim(),
      //   description: incidentDescription.trim(),
      //   category: incidentCategory,
      //   priority: incidentPriority,
      //   location: incidentLocation.trim() || undefined,
      // });
      
      // For now, create local incident for testing
      const newIncident: Incident = {
        id: Date.now().toString(),
        title: incidentTitle.trim(),
        description: incidentDescription.trim(),
        category: incidentCategory,
        priority: incidentPriority,
        status: 'pending',
        reportedBy: 'Usuario Actual',
        reportedAt: new Date(),
        location: incidentLocation.trim() || undefined,
      };

      setIncidents(prev => [newIncident, ...prev]);
      
      // Reset form
      setIncidentTitle('');
      setIncidentDescription('');
      setIncidentCategory('');
      setIncidentPriority('medium');
      setIncidentLocation('');
      setShowNewIncidentForm(false);
      
      Alert.alert('Éxito', 'Incidencia reportada exitosamente');
    } catch (error) {
      console.error('Error submitting incident:', error);
      Alert.alert('Error', 'No se pudo reportar la incidencia. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openIncidentDetail = (incident: Incident) => {
    setSelectedIncident(incident);
    setShowIncidentDetail(true);
  };

  const closeIncidentDetail = () => {
    setShowIncidentDetail(false);
    setSelectedIncident(null);
  };

  const updateIncidentStatus = async (incidentId: string, newStatus: Incident['status']) => {
    try {
      // TODO: Implement Firebase integration
      // await incidentsService.updateIncidentStatus(incidentId, newStatus);
      
      // For now, update local state
      setIncidents(prev => prev.map(incident => 
        incident.id === incidentId 
          ? { ...incident, status: newStatus }
          : incident
      ));
      
      if (selectedIncident) {
        setSelectedIncident(prev => prev ? { ...prev, status: newStatus } : null);
      }
      
      Alert.alert('Éxito', `Estado de la incidencia actualizado a: ${getStatusText(newStatus)}`);
    } catch (error) {
      console.error('Error updating incident status:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado de la incidencia');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
          <Ionicons name="arrow-back" size={24} color="#6366f1" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>INCIDENCIAS</Text>
        </View>
        
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Action Button */}
        <View style={styles.actionButtonContainer}>
          <TouchableOpacity
            style={styles.newIncidentButton}
            onPress={() => setShowNewIncidentForm(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#ffffff" />
            <Text style={styles.newIncidentButtonText}>
              + Reportar Nueva Incidencia
            </Text>
          </TouchableOpacity>
        </View>

        {/* Incidents List */}
        <View style={styles.incidentsSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="warning" size={24} color="#9C27B0" />
            <Text style={styles.sectionTitle}>Incidencias Reportadas</Text>
          </View>

          {incidents.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No hay incidencias reportadas</Text>
              <Text style={styles.emptyStateSubtext}>
                ¡Excelente! Todo está funcionando correctamente
              </Text>
            </View>
          ) : (
            incidents.map((incident) => (
              <TouchableOpacity
                key={incident.id}
                style={styles.incidentCard}
                onPress={() => openIncidentDetail(incident)}
                activeOpacity={0.7}
              >
                <View style={styles.incidentHeader}>
                  <View style={styles.incidentTitleRow}>
                    <Text style={styles.incidentTitle} numberOfLines={1}>
                      {incident.title}
                    </Text>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(incident.priority) }]}>
                      <Text style={styles.priorityText}>
                        {priorities.find(p => p.value === incident.priority)?.label}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.incidentMeta}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{incident.category}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(incident.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(incident.status)}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.incidentDescription} numberOfLines={2}>
                  {incident.description}
                </Text>

                <View style={styles.incidentFooter}>
                  <View style={styles.incidentInfo}>
                    <Ionicons name="person" size={14} color="#666" />
                    <Text style={styles.incidentInfoText}>{incident.reportedBy}</Text>
                  </View>
                  
                  <View style={styles.incidentInfo}>
                    <Ionicons name="time" size={14} color="#666" />
                    <Text style={styles.incidentInfoText}>{formatDate(incident.reportedAt)}</Text>
                  </View>
                  
                  {incident.location && (
                    <View style={styles.incidentInfo}>
                      <Ionicons name="location" size={14} color="#666" />
                      <Text style={styles.incidentInfoText}>{incident.location}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* New Incident Form Modal */}
      <Modal
        visible={showNewIncidentForm}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNewIncidentForm(false)}>
              <Text style={styles.cancelButton}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nueva Incidencia</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Título de la incidencia *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Describe brevemente el problema"
                value={incidentTitle}
                onChangeText={setIncidentTitle}
                maxLength={100}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Descripción detallada *</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Proporciona todos los detalles relevantes..."
                value={incidentDescription}
                onChangeText={setIncidentDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Categoría *</Text>
              <View style={styles.categorySelector}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryOption,
                      incidentCategory === category && styles.categoryOptionSelected
                    ]}
                    onPress={() => setIncidentCategory(category)}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      incidentCategory === category && styles.categoryOptionTextSelected
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Prioridad</Text>
              <View style={styles.prioritySelector}>
                {priorities.map((priority) => (
                  <TouchableOpacity
                    key={priority.value}
                    style={[
                      styles.priorityOption,
                      incidentPriority === priority.value && styles.priorityOptionSelected
                    ]}
                    onPress={() => setIncidentPriority(priority.value as any)}
                  >
                    <View style={[styles.priorityIndicator, { backgroundColor: priority.color }]} />
                    <Text style={[
                      styles.priorityOptionText,
                      incidentPriority === priority.value && styles.priorityOptionTextSelected
                    ]}>
                      {priority.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Ubicación (opcional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="¿Dónde ocurrió el problema?"
                value={incidentLocation}
                onChangeText={setIncidentLocation}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmitIncident}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Reportando...' : 'Reportar Incidencia'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Incident Detail Modal */}
      <Modal
        visible={showIncidentDetail}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeIncidentDetail}>
              <Text style={styles.cancelButton}>Cerrar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Detalle de Incidencia</Text>
            <View style={styles.placeholder} />
          </View>

          {selectedIncident && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>{selectedIncident.title}</Text>
                
                <View style={styles.detailMeta}>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(selectedIncident.priority) }]}>
                    <Text style={styles.priorityText}>
                      {priorities.find(p => p.value === selectedIncident.priority)?.label}
                    </Text>
                  </View>
                  
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedIncident.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(selectedIncident.status)}</Text>
                  </View>
                </View>

                <Text style={styles.detailDescription}>{selectedIncident.description}</Text>

                <View style={styles.detailInfo}>
                  <View style={styles.detailInfoRow}>
                    <Text style={styles.detailLabel}>Categoría:</Text>
                    <Text style={styles.detailValue}>{selectedIncident.category}</Text>
                  </View>
                  
                  <View style={styles.detailInfoRow}>
                    <Text style={styles.detailLabel}>Reportado por:</Text>
                    <Text style={styles.detailValue}>{selectedIncident.reportedBy}</Text>
                  </View>
                  
                  <View style={styles.detailInfoRow}>
                    <Text style={styles.detailLabel}>Fecha:</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedIncident.reportedAt)}</Text>
                  </View>
                  
                  {selectedIncident.location && (
                    <View style={styles.detailInfoRow}>
                      <Text style={styles.detailLabel}>Ubicación:</Text>
                      <Text style={styles.detailValue}>{selectedIncident.location}</Text>
                    </View>
                  )}
                </View>

                {/* Status Update Section */}
                <View style={styles.statusUpdateSection}>
                  <Text style={styles.statusUpdateTitle}>Actualizar Estado</Text>
                  <View style={styles.statusUpdateButtons}>
                    {['pending', 'in_progress', 'resolved', 'closed'].map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusUpdateButton,
                          selectedIncident.status === status && styles.statusUpdateButtonActive
                        ]}
                        onPress={() => updateIncidentStatus(selectedIncident.id, status as any)}
                      >
                        <Text style={[
                          styles.statusUpdateButtonText,
                          selectedIncident.status === status && styles.statusUpdateButtonTextActive
                        ]}>
                          {getStatusText(status)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  actionButtonContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  newIncidentButton: {
    backgroundColor: '#9C27B0',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#9C27B0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  newIncidentButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  incidentsSection: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 12,
  },
  emptyState: {
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
  incidentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  incidentHeader: {
    marginBottom: 12,
  },
  incidentTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  incidentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
    marginRight: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  priorityText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  incidentMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  incidentDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 16,
  },
  incidentFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  incidentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  incidentInfoText: {
    fontSize: 12,
    color: '#666666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cancelButton: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
  },
  textArea: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
    minHeight: 100,
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryOptionSelected: {
    backgroundColor: '#9C27B0',
    borderColor: '#9C27B0',
  },
  categoryOptionText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryOptionTextSelected: {
    color: '#ffffff',
  },
  prioritySelector: {
    gap: 8,
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  priorityOptionSelected: {
    backgroundColor: '#f3e5f5',
    borderColor: '#9C27B0',
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  priorityOptionText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
  },
  priorityOptionTextSelected: {
    color: '#9C27B0',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#9C27B0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  detailSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  detailMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  detailDescription: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
    marginBottom: 20,
  },
  detailInfo: {
    gap: 12,
    marginBottom: 24,
  },
  detailInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  statusUpdateSection: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 20,
  },
  statusUpdateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  statusUpdateButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusUpdateButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusUpdateButtonActive: {
    backgroundColor: '#9C27B0',
    borderColor: '#9C27B0',
  },
  statusUpdateButtonText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
  },
  statusUpdateButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
