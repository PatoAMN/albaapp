import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommunityFormConfig } from '../types/formConfig';

interface FormSelectorProps {
  forms: CommunityFormConfig[];
  selectedForm: CommunityFormConfig | null;
  onSelectForm: (form: CommunityFormConfig) => void;
  loading?: boolean;
  error?: string | null;
}

export const FormSelector: React.FC<FormSelectorProps> = ({
  forms,
  selectedForm,
  onSelectForm,
  loading = false,
  error = null,
}) => {
  const [showModal, setShowModal] = useState(false);

  // Log de depuración para verificar los datos (solo cuando cambian los formularios)
  useEffect(() => {
    console.log('🔍 [FORM-SELECTOR] Props recibidas:', {
      formsCount: forms.length,
      forms: forms.map(f => ({ id: f.id, name: f.name })),
      selectedForm: selectedForm?.name || 'Ninguno',
      loading,
      error
    });
  }, [forms.length, selectedForm?.id, loading, error]);

  const handleSelectForm = (form: CommunityFormConfig) => {
    onSelectForm(form);
    setShowModal(false);
  };

  const renderFormItem = ({ item, index }: { item: CommunityFormConfig; index: number }) => {
    // Validar que el item tenga los datos necesarios
    if (!item || (!item.id && !item.name)) {
      console.warn('⚠️ [FORM-SELECTOR] Item inválido en índice:', index, item);
      return null;
    }

    const totalFields = item.sections?.reduce((total, section) => total + (section.fields?.length || 0), 0) || 0;
    
    return (
      <TouchableOpacity
        key={item.id || `form-item-${index}`}
        style={styles.formItem}
        onPress={() => handleSelectForm(item)}
      >
        <View style={styles.formItemHeader}>
          <View style={styles.formIcon}>
            <Ionicons name="document-text" size={24} color="#6366f1" />
          </View>
          <View style={styles.formInfo}>
            <Text style={styles.formName}>{item.name}</Text>
            <Text style={styles.formDescription}>
              {item.description || 'Formulario de registro de invitados'}
            </Text>
          </View>
          <View style={styles.formStats}>
            <Text style={styles.formStatsText}>
              {item.sections?.length || 0} secciones
            </Text>
            <Text style={styles.formStatsText}>
              {totalFields} campos
            </Text>
          </View>
        </View>
        
        <View style={styles.formItemFooter}>
          <View style={styles.formStatus}>
            <View style={[styles.statusDot, { backgroundColor: item.isActive ? '#10b981' : '#ef4444' }]} />
            <Text style={styles.statusText}>
              {item.isActive ? 'Activo' : 'Inactivo'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.selectorButton}>
          <Ionicons name="document-text" size={20} color="#6366f1" />
          <Text style={styles.selectorButtonText}>Cargando formularios...</Text>
          <Ionicons name="chevron-down" size={20} color="#9ca3af" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={[styles.selectorButton, styles.errorButton]}>
          <Ionicons name="alert-circle" size={20} color="#ef4444" />
          <Text style={[styles.selectorButtonText, styles.errorText]}>
            Error cargando formularios
          </Text>
        </View>
      </View>
    );
  }

  if (forms.length === 0) {
    return (
      <View style={styles.container}>
        <View style={[styles.selectorButton, styles.emptyButton]}>
          <Ionicons name="document-outline" size={20} color="#9ca3af" />
          <Text style={[styles.selectorButtonText, styles.emptyText]}>
            No hay formularios disponibles
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setShowModal(true)}
      >
        <Ionicons name="document-text" size={20} color="#6366f1" />
        <Text style={styles.selectorButtonText}>
          {selectedForm ? selectedForm.name : 'Seleccionar formulario'}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#9ca3af" />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Formulario</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={forms.filter(form => form && (form.id || form.name))}
            keyExtractor={(item, index) => item.id || `form-${index}`}
            renderItem={renderFormItem}
            style={styles.formList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.formListContent}
            extraData={forms}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 0,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  errorButton: {
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  emptyButton: {
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  selectorButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 12,
    fontWeight: '500',
  },
  errorText: {
    color: '#ef4444',
  },
  emptyText: {
    color: '#9ca3af',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f8f9fa',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  closeButton: {
    padding: 4,
  },
  formList: {
    flex: 1,
  },
  formListContent: {
    padding: 20,
  },
  formItem: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
  formItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  formIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f0f0ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  formInfo: {
    flex: 1,
  },
  formName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  formDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  formStats: {
    alignItems: 'flex-end',
  },
  formStatsText: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  formItemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
});
