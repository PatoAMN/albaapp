import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface TabItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  isActive: boolean;
}

interface BottomTabNavigatorProps {
  activeTab: string;
  onTabPress: (tabId: string) => void;
}

export const BottomTabNavigator: React.FC<BottomTabNavigatorProps> = ({
  activeTab,
  onTabPress,
}) => {
  const tabs: TabItem[] = [
    {
      id: 'home',
      title: 'Inicio',
      icon: 'home',
      isActive: activeTab === 'home',
    },
    {
      id: 'guest',
      title: 'Invitado',
      icon: 'person-add',
      isActive: activeTab === 'guest',
    },
    {
      id: 'chat',
      title: 'Chat',
      icon: 'chatbubble',
      isActive: activeTab === 'chat',
    },
    {
      id: 'profile',
      title: 'Perfil',
      icon: 'person',
      isActive: activeTab === 'profile',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, tab.isActive && styles.activeTab]}
            onPress={() => onTabPress(tab.id)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={tab.icon} 
              size={24} 
              color={tab.isActive ? '#4CAF50' : '#666'} 
              style={styles.tabIcon}
            />
            <Text style={[styles.tabTitle, tab.isActive && styles.activeTabTitle]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 0.5,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  activeTab: {
    backgroundColor: 'transparent',
  },
  tabIcon: {
    marginBottom: 4,
  },
  tabTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  activeTabTitle: {
    color: '#4CAF50',
    fontWeight: '600',
  },
});
