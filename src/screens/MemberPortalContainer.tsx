import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MemberHomeScreen } from './MemberHomeScreen';
import { ChatScreen } from './ChatScreen';
import { GuestsScreen } from './GuestsScreen';
import { ProfileScreen } from './ProfileScreen';
import PrincipalScreen from './PrincipalScreen';
import EmergencyScreen from './EmergencyScreen';
import LibraryScreen from './LibraryScreen';
import { IncidentsScreen } from './IncidentsScreen';
import AnnouncementsScreen from './AnnouncementsScreen';

export const MemberPortalContainer: React.FC = () => {
  const [activeTab, setActiveTab] = useState('principal');
  const navigation = useNavigation();
  const route = useRoute();

  // Escuchar cambios en la ruta para cambiar la pestaña activa
  useEffect(() => {
    console.log('🔄 MemberPortalContainer - Ruta actual:', route.name);
    if (route.name === 'MemberHome') {
      console.log('📍 Cambiando a pestaña home');
      setActiveTab('home');
    } else {
      console.log('📍 Manteniendo pestaña principal');
      setActiveTab('principal');
    }
  }, [route.name]);

  // Asegurar que siempre se muestre la pantalla principal por defecto
  useEffect(() => {
    console.log('🎯 MemberPortalContainer - Pestaña activa:', activeTab);
  }, [activeTab]);

  const handlePrincipalCardPress = (card: any) => {
    console.log('🖱️ Card presionada:', card.action);
    if (card.action === 'navigate_to_home') {
      setActiveTab('home');
    } else if (card.action === 'navigate_to_guests') {
      setActiveTab('guests');
    } else if (card.action === 'navigate_to_chat') {
      setActiveTab('chat');
    } else if (card.action === 'navigate_to_profile') {
      setActiveTab('profile');
    } else if (card.action === 'navigate_to_emergency') {
      setActiveTab('emergency');
    } else if (card.action === 'navigate_to_library') {
      setActiveTab('library');
    } else if (card.action === 'navigate_to_incidents') {
      setActiveTab('incidents');
    } else if (card.action === 'navigate_to_announcements') {
      setActiveTab('announcements');
    }
  };

  const handleGoBackToPrincipal = (redirectTo?: string) => {
    if (redirectTo === 'chat') {
      console.log('🔄 Regresando a pantalla principal y redirigiendo al chat');
      setActiveTab('principal');
      // Después de un breve delay, navegar al chat
      setTimeout(() => {
        setActiveTab('chat');
      }, 100);
    } else {
      console.log('⬅️ Regresando a pantalla principal');
      setActiveTab('principal');
    }
  };

  const renderCurrentScreen = () => {
    console.log('🎬 Renderizando pantalla:', activeTab);
    switch (activeTab) {
      case 'principal':
        return <PrincipalScreen onCardPress={handlePrincipalCardPress} />;
      case 'home':
        return <MemberHomeScreen onGoBack={handleGoBackToPrincipal} />;
      case 'chat':
        return <ChatScreen onGoBack={handleGoBackToPrincipal} />;
      case 'guests':
        return <GuestsScreen onGoBack={handleGoBackToPrincipal} />;
      case 'profile':
        return <ProfileScreen onGoBack={handleGoBackToPrincipal} />;
      case 'emergency':
        return <EmergencyScreen onGoBack={handleGoBackToPrincipal} />;
      case 'library':
        return <LibraryScreen onGoBack={handleGoBackToPrincipal} />;
      case 'incidents':
        return <IncidentsScreen onGoBack={handleGoBackToPrincipal} />;
      case 'announcements':
        return <AnnouncementsScreen onGoBack={handleGoBackToPrincipal} />;
      default:
        console.log('⚠️ Pestaña no reconocida, mostrando principal por defecto');
        return <PrincipalScreen onCardPress={handlePrincipalCardPress} />;
    }
  };

  return (
    <View style={styles.container}>
      {renderCurrentScreen()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
});
