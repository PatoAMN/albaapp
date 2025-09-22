import { useState, useEffect } from 'react';
import { useAuth } from './authContext';
import { AdminPortal } from '../types/simple';

export const useAdminPortalLogic = () => {
  const { user } = useAuth();
  const [currentPortal, setCurrentPortal] = useState<AdminPortal>('member');
  const [isAdmin, setIsAdmin] = useState(false);
  
  console.log('🔍 [useAdminPortalLogic] Hook ejecutado');
  console.log('🔍 [useAdminPortalLogic] User recibido:', user);
  console.log('🔍 [useAdminPortalLogic] User role:', user?.role);
  console.log('🔍 [useAdminPortalLogic] IsAdmin state:', isAdmin);

  useEffect(() => {
    // Verificar si el usuario es administrador
    const checkAdminStatus = () => {
      if (user && (user.role === 'admin' || user.role === 'super_admin')) {
        setIsAdmin(true);
        // En React Native no tenemos localStorage, usar AsyncStorage o mantener estado local
        console.log('✅ [ADMIN] Usuario es administrador:', user.role);
      } else {
        setIsAdmin(false);
        console.log('❌ [ADMIN] Usuario NO es administrador:', user?.role);
      }
    };

    checkAdminStatus();
  }, [user]);

  const switchPortal = (newPortal: AdminPortal) => {
    if (newPortal === currentPortal) return;
    
    console.log('🔄 [ADMIN] Cambiando portal de', currentPortal, 'a', newPortal);
    
    setCurrentPortal(newPortal);
    
    // En React Native no tenemos localStorage, mantener solo en estado local
    console.log('✅ [ADMIN] Portal cambiado a:', newPortal);
  };

  const getPortalInfo = (portal: AdminPortal) => {
    switch (portal) {
      case 'member':
        return {
          name: 'Miembros',
          displayName: 'Portal de Miembros',
          icon: 'people',
          color: '#64B5F6',
          description: 'Gestionar residentes y miembros de la organización',
          features: [
            'Ver lista de miembros',
            'Gestionar perfiles',
            'Administrar accesos',
            'Ver historial de actividades',
            'Gestionar invitados',
          ],
          routes: [
            { name: 'Lista de Miembros', route: '/members', icon: 'people' },
            { name: 'Gestionar Perfiles', route: '/member-profiles', icon: 'person' },
            { name: 'Historial de Accesos', route: '/access-history', icon: 'time' },
            { name: 'Gestionar Invitados', route: '/guests', icon: 'person-add' },
          ],
        };
      case 'guard':
        return {
          name: 'Guardias',
          displayName: 'Portal de Guardias',
          icon: 'shield',
          color: '#4CAF50',
          description: 'Gestionar personal de seguridad y porterías',
          features: [
            'Ver lista de guardias',
            'Gestionar turnos',
            'Administrar porterías',
            'Ver registros de acceso',
            'Gestionar incidentes',
          ],
          routes: [
            { name: 'Lista de Guardias', route: '/guards', icon: 'shield' },
            { name: 'Gestionar Turnos', route: '/shifts', icon: 'time' },
            { name: 'Administrar Porterías', route: '/access-points', icon: 'location' },
            { name: 'Registros de Acceso', route: '/access-logs', icon: 'list' },
            { name: 'Gestionar Incidentes', route: '/incidents', icon: 'warning' },
          ],
        };
      default:
        return {
          name: 'Portal',
          displayName: 'Portal de Administración',
          icon: 'home',
          color: '#FF9800',
          description: 'Selecciona un portal para comenzar',
          features: [],
          routes: [],
        };
    }
  };

  const getCurrentPortalInfo = () => getPortalInfo(currentPortal);
  const getOtherPortalInfo = () => getPortalInfo(currentPortal === 'member' ? 'guard' : 'member');

  return {
    // Estado
    currentPortal,
    isAdmin,
    
    // Acciones
    switchPortal,
    
    // Información
    getPortalInfo,
    getCurrentPortalInfo,
    getOtherPortalInfo,
    
    // Utilidades
    canAccessPortal: isAdmin,
    isMemberPortal: currentPortal === 'member',
    isGuardPortal: currentPortal === 'guard',
  };
};
