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
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../utils/authContext';
import { Document, DocumentCategory } from '../types';
import { documentService } from '../utils/documentService';

const { width, height } = Dimensions.get('window');

interface LibraryScreenProps {
  onGoBack?: () => void;
}

export const LibraryScreen: React.FC<LibraryScreenProps> = ({ onGoBack }) => {
  const { user, organization } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleDocumentPress = async (document: Document) => {
    try {
      // Verificar acceso al documento
      const hasAccess = await documentService.checkDocumentAccess(
        document.id,
        user?.id || '',
        user?.role || ''
      );
      
      if (!hasAccess) {
        Alert.alert('Acceso Denegado', 'No tienes permisos para ver este documento.');
        return;
      }
      
      // Abrir documento en el navegador o app nativa
      const supported = await Linking.canOpenURL(document.fileUrl);
      
      if (supported) {
        await Linking.openURL(document.fileUrl);
      } else {
        Alert.alert(
          'Error',
          'No se puede abrir este tipo de archivo. El documento se descargará.',
          [
            {
              text: 'Cancelar',
              style: 'cancel',
            },
            {
              text: 'Descargar',
              onPress: () => {
                // Aquí se podría implementar la descarga
                Alert.alert('Descarga', 'Función de descarga en desarrollo');
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error opening document:', error);
      Alert.alert('Error', 'No se pudo abrir el documento');
    }
  };

  const getFilteredDocuments = () => {
    let filtered = documents;
    
    // Filtrar por categoría
    if (selectedCategory) {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }
    
    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getCategoryName = (categoryKey: string) => {
    const category = categories.find(cat => cat.id === categoryKey);
    return category?.name || categoryKey;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'reglamento':
        return 'document-text';
      case 'manual':
        return 'book';
      case 'formulario':
        return 'clipboard';
      default:
        return 'document';
    }
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

  const renderCategoryItem = ({ item }: { item: DocumentCategory }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.id && styles.selectedCategoryItem
      ]}
      onPress={() => setSelectedCategory(selectedCategory === item.id ? null : item.id)}
      activeOpacity={0.7}
    >
      <Ionicons 
        name="folder" 
        size={24} 
        color={selectedCategory === item.id ? '#ffffff' : '#64B5F6'} 
      />
      <Text style={[
        styles.categoryText,
        selectedCategory === item.id && styles.selectedCategoryText
      ]}>
        {item.name}
      </Text>
      {item.description && (
        <Text style={[
          styles.categoryDescription,
          selectedCategory === item.id && styles.selectedCategoryDescription
        ]}>
          {item.description}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderDocumentItem = ({ item }: { item: Document }) => (
    <TouchableOpacity
      style={styles.documentItem}
      onPress={() => handleDocumentPress(item)}
      activeOpacity={0.7}
    >
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
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#64B5F6" />
          <Text style={styles.loadingText}>Cargando biblioteca...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredDocuments = getFilteredDocuments();

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
          <Text style={styles.headerTitle}>Biblioteca</Text>
        </View>
        
        <View style={styles.headerRight} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={20} color="#666" />
          <Text style={styles.searchPlaceholder}>
            Buscar documentos...
          </Text>
        </View>
      </View>

      {/* Categories */}
      {categories.length > 0 && (
        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>Categorías</Text>
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>
      )}

      {/* Documents */}
      <View style={styles.documentsContainer}>
        <View style={styles.documentsHeader}>
          <Text style={styles.sectionTitle}>
            Documentos {selectedCategory ? `- ${getCategoryName(selectedCategory)}` : ''}
          </Text>
          <Text style={styles.documentsCount}>
            {filteredDocuments.length} documento{filteredDocuments.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {filteredDocuments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>
              {searchQuery.trim() || selectedCategory 
                ? 'No se encontraron documentos' 
                : 'No hay documentos disponibles'
              }
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery.trim() || selectedCategory 
                ? 'Intenta con otros términos de búsqueda' 
                : 'Los administradores agregarán documentos pronto'
              }
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={filteredDocuments}
            renderItem={renderDocumentItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.documentsList}
          />
        )}
      </View>
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchPlaceholder: {
    color: '#999',
    fontSize: 16,
    marginLeft: 12,
  },
  categoriesContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 100,
  },
  selectedCategoryItem: {
    backgroundColor: '#64B5F6',
    borderColor: '#64B5F6',
  },
  categoryText: {
    color: '#64B5F6',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: '#ffffff',
  },
  categoryDescription: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  selectedCategoryDescription: {
    color: '#ffffff',
    opacity: 0.8,
  },
  documentsContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  documentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  documentsCount: {
    color: '#666',
    fontSize: 14,
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
    marginLeft: 12,
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
});
