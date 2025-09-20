import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../utils/authContext';
import { useOrganization } from '../utils/organizationContext';
import { Organization } from '../types';

const { width } = Dimensions.get('window');

export const OrganizationSelectorScreen: React.FC = () => {
  const { user, switchOrganization } = useAuth();
  const { userOrganizations, currentOrganization, loadUserOrganizations, isLoading } = useOrganization();
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadUserOrganizations(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (currentOrganization) {
      setSelectedOrgId(currentOrganization.id);
    }
  }, [currentOrganization]);

  const handleOrganizationSelect = async (orgId: string) => {
    try {
      setSelectedOrgId(orgId);
      await switchOrganization(orgId);
      Alert.alert('Éxito', 'Organización cambiada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo cambiar la organización');
      console.error('Error switching organization:', error);
    }
  };

  const handleContinue = () => {
    if (!selectedOrgId) {
      Alert.alert('Error', 'Por favor selecciona una organización');
      return;
    }
    // Navigation will be handled by the parent component
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando organizaciones...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (userOrganizations.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noOrganizationsContainer}>
          <Text style={styles.noOrganizationsTitle}>No tienes organizaciones</Text>
          <Text style={styles.noOrganizationsSubtitle}>
            Contacta a un administrador para ser agregado a una organización
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (userOrganizations.length === 1) {
    // Auto-select if only one organization
    useEffect(() => {
      if (userOrganizations[0] && !currentOrganization) {
        handleOrganizationSelect(userOrganizations[0].id);
      }
    }, [userOrganizations]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gradientBackground}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoIcon}>
                <Text style={styles.logoIconText}>🏢</Text>
              </View>
              <Text style={styles.logoText}>SafeGate System</Text>
              <Text style={styles.tagline}>Selecciona tu organización</Text>
            </View>
          </View>

          {/* User Info */}
          {user && (
            <View style={styles.userInfoContainer}>
              <Text style={styles.userInfoTitle}>Bienvenido, {user.name}</Text>
              <Text style={styles.userInfoSubtitle}>
                Tipo de usuario: {user.userType === 'member' ? 'Residente' : 
                               user.userType === 'guard' ? 'Guardia' : 
                               user.userType === 'admin' ? 'Administrador' : 'Super Administrador'}
              </Text>
            </View>
          )}

          {/* Organizations List */}
          <View style={styles.organizationsContainer}>
            <Text style={styles.sectionTitle}>Tus Organizaciones</Text>
            
            {userOrganizations.map((org) => (
              <TouchableOpacity
                key={org.id}
                style={[
                  styles.organizationCard,
                  selectedOrgId === org.id && styles.selectedOrganizationCard
                ]}
                onPress={() => setSelectedOrgId(org.id)}
              >
                <View style={styles.organizationHeader}>
                  <View style={styles.organizationIcon}>
                    <Text style={styles.organizationIconText}>🏠</Text>
                  </View>
                  <View style={styles.organizationInfo}>
                    <Text style={styles.organizationName}>{org.displayName}</Text>
                    <Text style={styles.organizationAddress}>
                      {org.address}, {org.city}, {org.state}
                    </Text>
                    <Text style={styles.organizationStatus}>
                      Estado: {org.status === 'active' ? 'Activa' : 
                              org.status === 'inactive' ? 'Inactiva' : 'Suspendida'}
                    </Text>
                  </View>
                </View>
                
                {selectedOrgId === org.id && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedIndicatorText}>✓ Seleccionada</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Continue Button */}
          {selectedOrgId && (
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
            >
              <Text style={styles.continueButtonText}>Continuar</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  gradientBackground: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoIconText: {
    fontSize: 40,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  userInfoContainer: {
    backgroundColor: '#f8fafc',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
  },
  userInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  userInfoSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  organizationsContainer: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 20,
  },
  organizationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedOrganizationCard: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  organizationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  organizationIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  organizationIconText: {
    fontSize: 24,
  },
  organizationInfo: {
    flex: 1,
  },
  organizationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  organizationAddress: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  organizationStatus: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  selectedIndicator: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'center',
  },
  selectedIndicatorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  continueButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  noOrganizationsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noOrganizationsTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  noOrganizationsSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});
