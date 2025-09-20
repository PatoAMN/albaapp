import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../utils/authContext';

interface AccessLog {
  id: string;
  userId?: string;
  userName?: string;
  guestId?: string;
  guestName?: string;
  action: string;
  timestamp: string | Date;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failed' | 'blocked';
  location: string;
  organizationId?: string;
  guardId?: string;
  guardName?: string;
  qrCodeHash?: string;
  accessType?: 'entry' | 'exit';
  verificationMethod?: 'qr_scan' | 'manual' | 'card' | 'biometric';
}

export default function SecurityLogsScreen() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    action: '',
    limit: 50
  });

  // Cargar logs de seguridad desde Firebase
  const fetchSecurityLogs = async () => {
    try {
      setLoading(true);
      console.log('🔍 [SECURITY-LOGS] Cargando logs de seguridad desde Firebase...');
      
      if (!user?.organizationId) {
        console.warn('⚠️ [SECURITY-LOGS] No hay organizationId disponible');
        setLogs([]);
        return;
      }

      // Obtener logs de seguridad desde Firebase
      const { collection, getDocs, query, where, limit } = await import('firebase/firestore');
      const { db } = await import('../utils/firebase');
      
      let q = query(
        collection(db, 'securityLogs'),
        where('organizationId', '==', user.organizationId),
        limit(filters.limit)
      );

      const querySnapshot = await getDocs(q);
      let logs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Aplicar filtros en el cliente
      if (filters.status) {
        logs = logs.filter(log => log.status === filters.status);
      }
      if (filters.action) {
        logs = logs.filter(log => log.action === filters.action);
      }

      // Ordenar por timestamp en el cliente (más reciente primero)
      const sortedLogs = logs.sort((a, b) => {
        const timestampA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
        const timestampB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
        return timestampB.getTime() - timestampA.getTime();
      });

      setLogs(sortedLogs);
      console.log('✅ [SECURITY-LOGS] Logs cargados exitosamente desde Firebase:', sortedLogs.length);
    } catch (error) {
      console.error('❌ [SECURITY-LOGS] Error cargando logs desde Firebase:', error);
      Alert.alert('Error', 'Error al cargar los logs de seguridad');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para refrescar
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSecurityLogs();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchSecurityLogs();
  }, [filters]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#10b981';
      case 'failed': return '#ef4444';
      case 'blocked': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success': return 'Exitoso';
      case 'failed': return 'Fallido';
      case 'blocked': return 'Bloqueado';
      default: return 'Desconocido';
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'guest_entry': return 'Entrada de Invitado';
      case 'qr_scan': return 'Escaneo QR';
      case 'member_entry': return 'Entrada de Miembro';
      case 'login': return 'Login';
      case 'logout': return 'Logout';
      default: return action;
    }
  };

  const getMethodText = (method?: string) => {
    switch (method) {
      case 'qr_scan': return 'QR';
      case 'manual': return 'Manual';
      case 'card': return 'Tarjeta';
      case 'biometric': return 'Biométrico';
      default: return 'N/A';
    }
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderLogItem = (log: AccessLog) => (
    <View key={log.id} style={styles.logItem}>
      <View style={styles.logHeader}>
        <View style={styles.logIconContainer}>
          <Ionicons 
            name={log.action === 'guest_entry' ? 'person-add' : 
                  log.action === 'qr_scan' ? 'qr-code' : 
                  log.action === 'login' ? 'log-in' : 'shield-checkmark'} 
            size={20} 
            color="#6366f1" 
          />
        </View>
        <View style={styles.logInfo}>
          <Text style={styles.logTitle}>
            {getActionText(log.action)}
          </Text>
          <Text style={styles.logUser}>
            {log.guestName || log.userName || 'Usuario Desconocido'}
          </Text>
          {log.guardName && (
            <Text style={styles.logGuard}>
              Guardia: {log.guardName}
            </Text>
          )}
        </View>
        <View style={styles.logStatus}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(log.status) }]}>
            <Text style={styles.statusText}>
              {getStatusText(log.status)}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.logDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#6b7280" />
          <Text style={styles.detailText}>
            {formatTimestamp(log.timestamp)}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="shield-outline" size={16} color="#6b7280" />
          <Text style={styles.detailText}>
            Método: {getMethodText(log.verificationMethod)}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#6b7280" />
          <Text style={styles.detailText}>
            {log.location}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Cargando logs de seguridad...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Logs de Seguridad</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Estado:</Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, filters.status === '' && styles.filterButtonActive]}
              onPress={() => setFilters(prev => ({ ...prev, status: '' }))}
            >
              <Text style={[styles.filterButtonText, filters.status === '' && styles.filterButtonTextActive]}>
                Todos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filters.status === 'success' && styles.filterButtonActive]}
              onPress={() => setFilters(prev => ({ ...prev, status: 'success' }))}
            >
              <Text style={[styles.filterButtonText, filters.status === 'success' && styles.filterButtonTextActive]}>
                Exitoso
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filters.status === 'failed' && styles.filterButtonActive]}
              onPress={() => setFilters(prev => ({ ...prev, status: 'failed' }))}
            >
              <Text style={[styles.filterButtonText, filters.status === 'failed' && styles.filterButtonTextActive]}>
                Fallido
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {logs.filter(log => log.status === 'success').length}
          </Text>
          <Text style={styles.statLabel}>Exitosos</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {logs.filter(log => log.status === 'failed').length}
          </Text>
          <Text style={styles.statLabel}>Fallidos</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {logs.length}
          </Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* Lista de Logs */}
      <ScrollView
        style={styles.logsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {logs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="shield-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No hay logs de seguridad disponibles</Text>
            <Text style={styles.emptySubtext}>
              Los logs aparecerán aquí cuando haya actividad de acceso
            </Text>
          </View>
        ) : (
          logs.map(renderLogItem)
        )}
      </ScrollView>
    </View>
  );
}

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
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  refreshButton: {
    padding: 8,
  },
  filtersContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginRight: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    flex: 1,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#f3f4f6',
  },
  filterButtonActive: {
    backgroundColor: '#6366f1',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  logsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  logItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  logIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logInfo: {
    flex: 1,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  logUser: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  logGuard: {
    fontSize: 12,
    color: '#6366f1',
  },
  logStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  logDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
