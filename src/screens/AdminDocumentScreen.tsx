import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../utils/authContext';
import { Document, DocumentCategory } from '../types';
import { documentService } from '../utils/documentService';

const { width, height } = Dimensions.get('window');

interface AdminDocumentScreenProps {
  onGoBack?: () => void;
}

export const AdminDocumentScreen: React.FC<AdminDocumentScreenProps> = ({ onGoBack }) => {
  const { user, organization } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Estados para el formulario de subida
  const [documentName, setDocumentName] = useState('');
  const [documentDescription, setDocumentDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentResult | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Estados para el formulario de categoría
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  
  // Estados para edición
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!organization?.id) return;
    loadDocuments();
    loadCategories();
  }, [organization]);

  useEffect(() => {
    if (!organization?.id) return;
    
    // Suscribirse a cambios en documentos
    const unsubscribe = documentService.subscribeToDocuments(
      organization.id,
      (newDocuments) => {
        setDocuments(newDocuments);
        setLoading(false);
      }
    );
    
    return unsubscribe;
  }, [organization?.id]);

  const loadDocuments = async () => {
    if (!organization?.id) return;
    try {
      const docs = await documentService.getDocumentsByOrganization(organization.id);
      setDocuments(docs);
      setLoading(false);
    } catch (error) {
      console.error('Error loading documents:', error);
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    if (!organization?.id) return;
    try {
      const cats = await documentService.getDocumentCategories(organization.id);
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      
      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result);
        // Auto-completar el nombre del documento
        if (!documentName.trim()) {
          setDocumentName(result.assets[0].name);
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'No se pudo seleccionar el documento');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedFile.assets[0] || !organization?.id || !user) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (!documentName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para el documento');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Error', 'Por favor selecciona una categoría');
      return;
    }

    setUploading(true);
    
    try {
      // Convertir el archivo de Expo a File para Firebase
      const file = selectedFile.assets[0];
      const response = await fetch(file.uri);
      const blob = await response.blob();
      
      // Crear un objeto File
      const fileObj = new File([blob], file.name, { type: file.mimeType || 'application/octet-stream' });
      
      await documentService.uploadDocument(fileObj, {
        name: documentName.trim(),
        description: documentDescription.trim() || undefined,
        category: selectedCategory as any,
        organizationId: organization.id,
        uploadedBy: user.id,
        uploadedByName: user.name,
      });

      Alert.alert('Éxito', 'Documento subido correctamente');
      resetUploadForm();
      setShowUploadModal(false);
      
    } catch (error) {
      console.error('Error uploading document:', error);
      Alert.alert('Error', 'No se pudo subir el documento');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryName.trim() || !organization?.id) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la categoría');
      return;
    }

    try {
      await documentService.createDocumentCategory({
        name: categoryName.trim(),
        description: categoryDescription.trim() || undefined,
        organizationId: organization.id,
      });

      Alert.alert('Éxito', 'Categoría creada correctamente');
      resetCategoryForm();
      setShowCategoryModal(false);
      loadCategories();
      
    } catch (error) {
      console.error('Error creating category:', error);
      Alert.alert('Error', 'No se pudo crear la categoría');
    }
  };

  const handleEditDocument = async () => {
    if (!selectedDocument || !editName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para el documento');
      return;
    }

    try {
      await documentService.updateDocument(selectedDocument.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        category: editCategory as any,
      });

      Alert.alert('Éxito', 'Documento actualizado correctamente');
      setShowEditModal(false);
      setSelectedDocument(null);
      
    } catch (error) {
      console.error('Error updating document:', error);
      Alert.alert('Error', 'No se pudo actualizar el documento');
    }
  };

  const handleDeleteDocument = (document: Document) => {
    Alert.alert(
      'Eliminar Documento',
      `¿Estás seguro de que quieres eliminar "${document.name}"? Esta acción no se puede deshacer.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await documentService.deleteDocument(document.id);
              Alert.alert('Éxito', 'Documento eliminado correctamente');
            } catch (error) {
              console.error('Error deleting document:', error);
              Alert.alert('Error', 'No se pudo eliminar el documento');
            }
          },
        },
      ]
    );
  };

  const resetUploadForm = () => {
    setDocumentName('');
    setDocumentDescription('');
    setSelectedCategory('');
    setSelectedFile(null);
  };

  const resetCategoryForm = () => {
    setCategoryName('');
    setCategoryDescription('');
  };

  const openEditModal = (document: Document) => {
    setSelectedDocument(document);
    setEditName(document.name);
    setEditDescription(document.description || '');
    setEditCategory(document.category);
    setShowEditModal(true);
  };

  const getCategoryName = (categoryKey: string) => {
    const category = categories.find(cat => cat.id === categoryKey);
    return category?.name || categoryKey;
  };

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return 'document-text';
    if (fileType.includes('word') || fileType.includes('doc')) return 'document';
    if (fileType.includes('excel') || fileType.includes('xls')) return 'grid';
    if (fileType.includes('image')) return 'image';
    return 'document';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderDocumentItem = ({ item }: { item: Document }) => (
    <View style={styles.documentItem}>
      <View style={styles.documentIcon}>
        <Ionicons 
          name={getFileTypeIcon(item.fileType) as any} 
          size={32} 
          color="#64B5F6" 
        />
      </View>
      
      <View style={styles.documentInfo}>
        <Text style={styles.documentName} numberOfLines={2}>
          {item.name}
        </Text>
        
        {item.description && (
          <Text style={styles.documentDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        <View style={styles.documentMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="time" size={14} color="#666" />
            <Text style={styles.metaText}>
              {item.createdAt.toLocaleDateString('es-MX')}
            </Text>
          </View>
          
          <View style={styles.metaItem}>
            <Ionicons name="document" size={14} color="#666" />
            <Text style={styles.metaText}>
              {formatFileSize(item.fileSize)}
            </Text>
          </View>
          
          <View style={styles.metaItem}>
            <Ionicons name="folder" size={14} color="#666" />
            <Text style={styles.metaText}>
              {getCategoryName(item.category)}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.documentActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openEditModal(item)}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={20} color="#64B5F6" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteDocument(item)}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#64B5F6" />
          <Text style={styles.loadingText}>Cargando documentos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onGoBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#64B5F6" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Ionicons name="library" size={32} color="#64B5F6" />
          <Text style={styles.headerTitle}>Administrar Documentos</Text>
        </View>
        
        <View style={styles.headerRight} />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setShowUploadModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="cloud-upload" size={20} color="#ffffff" />
          <Text style={styles.primaryButtonText}>Subir Documento</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setShowCategoryModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="folder-open" size={20} color="#64B5F6" />
          <Text style={styles.secondaryButtonText}>Nueva Categoría</Text>
        </TouchableOpacity>
      </View>

      {/* Documents List */}
      <View style={styles.documentsContainer}>
        <View style={styles.documentsHeader}>
          <Text style={styles.sectionTitle}>Documentos ({documents.length})</Text>
        </View>

        {documents.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No hay documentos</Text>
            <Text style={styles.emptyStateSubtext}>
              Sube el primer documento para comenzar
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={documents}
            renderItem={renderDocumentItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.documentsList}
          />
        )}
      </View>

      {/* Upload Document Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Subir Documento</Text>
              <TouchableOpacity
                onPress={() => setShowUploadModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Nombre del documento *</Text>
              <TextInput
                style={styles.textInput}
                value={documentName}
                onChangeText={setDocumentName}
                placeholder="Ingresa el nombre del documento"
                placeholderTextColor="#999"
              />

              <Text style={styles.inputLabel}>Descripción (opcional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={documentDescription}
                onChangeText={setDocumentDescription}
                placeholder="Descripción del documento"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Categoría *</Text>
              <View style={styles.categorySelector}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryOption,
                      selectedCategory === category.id && styles.selectedCategoryOption
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      selectedCategory === category.id && styles.selectedCategoryOptionText
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Archivo *</Text>
              <TouchableOpacity
                style={styles.filePicker}
                onPress={pickDocument}
                activeOpacity={0.7}
              >
                {selectedFile && selectedFile.assets[0] ? (
                  <View style={styles.selectedFile}>
                    <Ionicons name="document" size={24} color="#64B5F6" />
                    <Text style={styles.selectedFileName}>
                      {selectedFile.assets[0].name}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.filePickerPlaceholder}>
                    <Ionicons name="cloud-upload" size={32} color="#ccc" />
                    <Text style={styles.filePickerText}>Seleccionar archivo</Text>
                  </View>
                )}
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowUploadModal(false)}
                disabled={uploading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
                onPress={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.uploadButtonText}>Subir</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Category Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Categoría</Text>
              <TouchableOpacity
                onPress={() => setShowCategoryModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Nombre de la categoría *</Text>
              <TextInput
                style={styles.textInput}
                value={categoryName}
                onChangeText={setCategoryName}
                placeholder="Ingresa el nombre de la categoría"
                placeholderTextColor="#999"
              />

              <Text style={styles.inputLabel}>Descripción (opcional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={categoryDescription}
                onChangeText={setCategoryDescription}
                placeholder="Descripción de la categoría"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCategoryModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleCreateCategory}
              >
                <Text style={styles.uploadButtonText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Document Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Documento</Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Nombre del documento *</Text>
              <TextInput
                style={styles.textInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Ingresa el nombre del documento"
                placeholderTextColor="#999"
              />

              <Text style={styles.inputLabel}>Descripción (opcional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Descripción del documento"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Categoría *</Text>
              <View style={styles.categorySelector}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryOption,
                      editCategory === category.id && styles.selectedCategoryOption
                    ]}
                    onPress={() => setEditCategory(category.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      editCategory === category.id && styles.selectedCategoryOptionText
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleEditDocument}
              >
                <Text style={styles.uploadButtonText}>Actualizar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
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
    borderRadius: 8,
    backgroundColor: '#f0f8ff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  headerTitle: {
    color: '#333',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#64B5F6',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#64B5F6',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#64B5F6',
    fontSize: 16,
    fontWeight: '600',
  },
  documentsContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  documentsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
  },
  documentsList: {
    padding: 20,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  documentIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  documentDescription: {
    color: '#666',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  documentMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: '#666',
    fontSize: 12,
  },
  documentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: width * 0.9,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  inputLabel: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  categoryOption: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedCategoryOption: {
    backgroundColor: '#64B5F6',
    borderColor: '#64B5F6',
  },
  categoryOptionText: {
    color: '#64B5F6',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedCategoryOptionText: {
    color: '#ffffff',
  },
  filePicker: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  filePickerPlaceholder: {
    alignItems: 'center',
  },
  filePickerText: {
    color: '#999',
    fontSize: 16,
    marginTop: 8,
  },
  selectedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedFileName: {
    color: '#64B5F6',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadButton: {
    flex: 1,
    backgroundColor: '#64B5F6',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadButtonDisabled: {
    backgroundColor: '#ccc',
  },
});
