import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Linking,
  ActivityIndicator,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../utils/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../utils/authContext';


interface Document {
  id: string;
  title: string;
  description: string;
  category: string;
  organizationId: string;
  organizationName: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  storagePath: string;
  createdAt: any;
  updatedAt: any;
  status: 'active' | 'inactive';
}

interface LibraryScreenProps {
  onGoBack: () => void;
}

const LibraryScreen: React.FC<LibraryScreenProps> = ({ onGoBack }) => {
  const { user, organization } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  const categories = [
    { id: 'all', label: 'Todos', icon: 'grid', color: '#f59e0b' },
    { id: 'reglamentos', label: 'Reglamentos', icon: 'document-text', color: '#ef4444' },
    { id: 'manuales', label: 'Manuales', icon: 'book', color: '#10b981' },
    { id: 'formularios', label: 'Formularios', icon: 'clipboard', color: '#3b82f6' },
    { id: 'avisos', label: 'Avisos', icon: 'megaphone', color: '#8b5cf6' },
    { id: 'otros', label: 'Otros', icon: 'folder', color: '#64748b' },
  ];

  useEffect(() => {
    if (user?.organizationId || organization?.id) {
      fetchDocuments();
    }
  }, [user?.organizationId, organization?.id]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      
      const organizationId = user?.organizationId || organization?.id;
      if (!organizationId) {
        console.log('No organization ID available');
        setDocuments([]);
        return;
      }

      console.log('🔍 Loading documents for organization:', organizationId);
      
      const libraryRef = collection(db, 'library');
      const q = query(
        libraryRef, 
        where('organizationId', '==', organizationId),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(q);
      
      console.log('📊 Firebase query result - Total docs:', snapshot.size);
      
      const docs: Document[] = [];
      snapshot.forEach((doc: any) => {
        console.log('📄 Document data:', doc.data());
        docs.push({
          id: doc.id,
          ...doc.data(),
        } as Document);
      });

      // Sort by creation date (newest first)
      docs.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

      console.log('📚 Final documents data:', docs);
      console.log('📚 Loaded documents count:', docs.length);
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      Alert.alert('Error', 'No se pudieron cargar los documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentPress = async (document: Document) => {
    try {
      // Verificar si es un tipo de archivo que podemos mostrar en la app
      const supportedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'txt', 'html'];
      const fileExtension = document.fileType?.split('/')[1]?.toLowerCase() || 
                           document.fileName?.split('.').pop()?.toLowerCase() || '';
      
      // Siempre mostrar primero en el visor integrado para mejor experiencia
      setSelectedDocument(document);
      setShowViewer(true);
      
    } catch (error) {
      console.error('Error opening document:', error);
      Alert.alert('Error', 'No se pudo abrir el documento');
    }
  };

  const copyToClipboard = (text: string) => {
    // For now, just show an alert. In a real app, you'd use a clipboard library
    Alert.alert('URL copiada', 'La URL del documento ha sido copiada al portapapeles');
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.icon : 'document';
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      reglamentos: '#FF6B6B',
      manuales: '#4ECDC4',
      formularios: '#45B7D1',
      avisos: '#96CEB4',
      otros: '#FFEAA7'
    };
    return colors[category] || '#DDA0DD';
  };

  const filteredDocuments = documents.filter(doc => {
    const categoryMatch = selectedCategory === 'all' || doc.category === selectedCategory;
    const searchMatch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       doc.description.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: any) => {
    if (!date) return 'Fecha desconocida';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.header}>
          <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Biblioteca</Text>
          <View style={styles.placeholder} />
        </View>
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
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Biblioteca y Reglamentos</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar documentos..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <View style={styles.categoryContent}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonActive,
                { 
                  borderColor: category.color,
                  backgroundColor: selectedCategory === category.id ? category.color : '#ffffff'
                }
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
                          <Ionicons 
              name={category.icon as any} 
              size={16} 
              color={selectedCategory === category.id ? '#fff' : category.color} 
            />
              <Text style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextActive
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Documents List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredDocuments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="library" size={64} color="#ccc" />
            <Text style={styles.emptyStateTitle}>No hay documentos</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery.length > 0 
                ? 'No se encontraron documentos con tu búsqueda'
                : 'No hay documentos disponibles en esta categoría'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.documentsList}>
            {filteredDocuments.map((document) => (
              <TouchableOpacity
                key={document.id}
                style={styles.documentCard}
                onPress={() => handleDocumentPress(document)}
              >
                <View style={styles.documentHeader}>
                  <View style={[
                    styles.documentIcon,
                    { backgroundColor: getCategoryColor(document.category) }
                  ]}>
                    <Ionicons 
                      name={getCategoryIcon(document.category) as any} 
                      size={24} 
                      color="#fff" 
                    />
                  </View>
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentTitle} numberOfLines={2}>
                      {document.title}
                    </Text>
                    <Text style={styles.documentDescription} numberOfLines={2}>
                      {document.description}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.openButton}
                    onPress={() => handleDocumentPress(document)}
                  >
                    <Ionicons name="open-outline" size={20} color="#64B5F6" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.documentFooter}>
                  <View style={styles.documentMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={14} color="#666" />
                      <Text style={styles.metaText}>{formatDate(document.createdAt)}</Text>
                    </View>
                    {document.fileSize > 0 && (
                      <View style={styles.metaItem}>
                        <Ionicons name="document-outline" size={14} color="#666" />
                        <Text style={styles.metaText}>{formatFileSize(document.fileSize)}</Text>
                      </View>
                    )}
                    {document.fileType && (
                      <View style={styles.metaItem}>
                        <Ionicons name="file-tray-outline" size={14} color="#666" />
                        <Text style={styles.metaText}>{document.fileType.toUpperCase()}</Text>
                      </View>
                    )}
                  </View>
                  

                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Document Viewer Modal */}
      <Modal
        visible={showViewer}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowViewer(false)}
      >
        <SafeAreaView style={styles.viewerContainer}>
          <View style={styles.viewerHeader}>
            <TouchableOpacity 
              onPress={() => setShowViewer(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.viewerTitle} numberOfLines={1}>
              {selectedDocument?.title || 'Documento'}
            </Text>
            <TouchableOpacity 
              onPress={() => {
                if (selectedDocument) {
                  Linking.openURL(selectedDocument.fileUrl);
                }
              }}
              style={styles.externalButton}
            >
              <Ionicons name="open-outline" size={20} color="#64B5F6" />
            </TouchableOpacity>
          </View>
          
          {selectedDocument && (
            <View style={styles.viewerContent}>
              {/* Icono del tipo de archivo */}
              <View style={[
                styles.documentIcon,
                { backgroundColor: getCategoryColor(selectedDocument.category) }
              ]}>
                <Ionicons 
                  name={getCategoryIcon(selectedDocument.category) as any} 
                  size={48} 
                  color="#fff" 
                />
              </View>
              
              {/* Información del documento */}
              <Text style={styles.documentTitle} numberOfLines={3}>
                {selectedDocument.title}
              </Text>
              <Text style={styles.documentDescription} numberOfLines={3}>
                {selectedDocument.description}
              </Text>
              
              {/* Metadatos del archivo */}
              <View style={styles.documentFooter}>
                <View style={styles.documentMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="document-outline" size={16} color="#666" />
                    <Text style={styles.metaText}>{selectedDocument.fileName}</Text>
                  </View>
                  
                  <View style={styles.metaItem}>
                    <Ionicons name="file-tray-outline" size={16} color="#666" />
                    <Text style={styles.metaText}>
                      {selectedDocument.fileType?.toUpperCase() || 'TIPO DESCONOCIDO'}
                    </Text>
                  </View>
                  
                  <View style={styles.metaItem}>
                    <Ionicons name="resize-outline" size={16} color="#666" />
                    <Text style={styles.metaText}>{formatFileSize(selectedDocument.fileSize)}</Text>
                  </View>
                  
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <Text style={styles.metaText}>{formatDate(selectedDocument.createdAt)}</Text>
                  </View>
                </View>
              </View>
              
              {/* Botón de acción */}
              <TouchableOpacity 
                style={[styles.documentCard, { backgroundColor: '#64B5F6', marginTop: 20 }]}
                onPress={() => {
                  if (selectedDocument) {
                    Linking.openURL(selectedDocument.fileUrl);
                  }
                }}
              >
                <View style={styles.documentHeader}>
                  <Ionicons name="open-outline" size={24} color="#fff" />
                  <Text style={[styles.documentTitle, { color: '#fff', marginLeft: 12 }]}>
                    Abrir Documento
                  </Text>
                </View>
              </TouchableOpacity>
              
              <Text style={styles.viewerInfo}>
                El documento se abrirá en tu navegador para la mejor experiencia de visualización
              </Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>
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
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 5,
  },
  categoryContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 16,
    minHeight: 80,
  },
  categoryContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    height: 50,
    justifyContent: 'center',
    marginBottom: 12,
    minWidth: 80,
  },
  categoryButtonActive: {
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  categoryText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign: 'left',
    lineHeight: 16,
    flexShrink: 0,
  },
  categoryTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 15,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  documentsList: {
    paddingBottom: 20,
  },
  documentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
    marginRight: 12,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    lineHeight: 20,
  },
  documentDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  openButton: {
    padding: 8,
  },
  documentFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  documentMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#666',
  },
  // Document Viewer Modal Styles
  viewerContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 8,
  },
  viewerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  externalButton: {
    padding: 8,
  },
  viewerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  viewerInfo: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  // Additional viewer styles


});

export default LibraryScreen;
