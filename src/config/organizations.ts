import { Organization } from '../types';

// Configuración de organizaciones demo para desarrollo
export const demoOrganizations: Organization[] = [
  {
    id: 'org_1',
    name: 'privada_san_jose',
    displayName: 'Privada San José',
    address: 'Calle San José 123',
    city: 'Monterrey',
    state: 'Nuevo León',
    zipCode: '64000',
    country: 'México',
    contactInfo: {
      phone: '+52-81-1234-5678',
      email: 'admin@privadasanjose.com',
      website: 'www.privadasanjose.com'
    },
    settings: {
      theme: {
        primaryColor: '#007AFF',
        secondaryColor: '#10b981',
        logo: undefined
      },
      security: {
        qrCodeExpiryHours: 24,
        requirePhotoForGuests: true,
        maxGuestsPerResident: 5
      },
      notifications: {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false
      }
    },
    status: 'active',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date(),
    createdBy: 'super_admin_1'
  },
  {
    id: 'org_2',
    name: 'privada_los_pinos',
    displayName: 'Privada Los Pinos',
    address: 'Avenida Los Pinos 456',
    city: 'Guadalajara',
    state: 'Jalisco',
    zipCode: '44100',
    country: 'México',
    contactInfo: {
      phone: '+52-33-9876-5432',
      email: 'admin@privadalospinos.com',
      website: 'www.privadalospinos.com'
    },
    settings: {
      theme: {
        primaryColor: '#8b5cf6',
        secondaryColor: '#f59e0b',
        logo: undefined
      },
      security: {
        qrCodeExpiryHours: 12,
        requirePhotoForGuests: false,
        maxGuestsPerResident: 3
      },
      notifications: {
        emailNotifications: true,
        pushNotifications: false,
        smsNotifications: true
      }
    },
    status: 'active',
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date(),
    createdBy: 'super_admin_1'
  }
];

// Configuración de usuarios demo por organización
export const demoUsers = {
  org_1: {
    members: [
      {
        id: 'member_1',
        email: 'john@privadasanjose.com',
        password: 'demo123',
        name: 'John Smith',
        phone: '+1-555-0123',
        homeAddress: '123 Oak Street',
        vehicleInfo: 'Blue Honda Civic - ABC123',
        emergencyContacts: ['+1-555-0124', '+1-555-0125'],
        accessLevel: 'resident',
        residentSince: new Date('2023-01-01'),
        homeNumber: 'A1'
      },
      {
        id: 'member_2',
        email: 'maria@privadasanjose.com',
        password: 'demo123',
        name: 'María González',
        phone: '+1-555-0128',
        homeAddress: '456 Maple Drive',
        vehicleInfo: 'White Nissan Sentra - DEF456',
        emergencyContacts: ['+1-555-0129'],
        accessLevel: 'resident',
        residentSince: new Date('2023-03-01'),
        homeNumber: 'B2'
      }
    ],
    guards: [
      {
        id: 'guard_1',
        email: 'guard@privadasanjose.com',
        password: 'demo123',
        name: 'Mike Johnson',
        phone: '+1-555-0200',
        badgeNumber: 'G001',
        shiftHours: '6 AM - 6 PM',
        accessLevel: 'guard',
        assignedAccessPoints: ['ap_1', 'ap_2']
      },
      {
        id: 'guard_2',
        email: 'supervisor@privadasanjose.com',
        password: 'demo123',
        name: 'Roberto Martínez',
        phone: '+1-555-0202',
        badgeNumber: 'G002',
        shiftHours: '6 PM - 6 AM',
        accessLevel: 'supervisor',
        assignedAccessPoints: ['ap_1', 'ap_2']
      }
    ]
  },
  org_2: {
    members: [
      {
        id: 'member_3',
        email: 'sarah@privadalospinos.com',
        password: 'demo123',
        name: 'Sarah Wilson',
        phone: '+1-555-0126',
        homeAddress: '456 Pine Avenue',
        vehicleInfo: 'Red Toyota Camry - XYZ789',
        emergencyContacts: ['+1-555-0127'],
        accessLevel: 'resident',
        residentSince: new Date('2023-06-01'),
        homeNumber: 'B2'
      },
      {
        id: 'member_4',
        email: 'carlos@privadalospinos.com',
        password: 'demo123',
        name: 'Carlos Rodríguez',
        phone: '+1-555-0130',
        homeAddress: '789 Cedar Lane',
        vehicleInfo: 'Black Ford F-150 - GHI789',
        emergencyContacts: ['+1-555-0131', '+1-555-0132'],
        accessLevel: 'resident',
        residentSince: new Date('2023-08-01'),
        homeNumber: 'C3'
      }
    ],
    guards: [
      {
        id: 'guard_3',
        email: 'guard@privadalospinos.com',
        password: 'demo123',
        name: 'Carlos Rodriguez',
        phone: '+1-555-0201',
        badgeNumber: 'G003',
        shiftHours: '8 AM - 8 PM',
        accessLevel: 'supervisor',
        assignedAccessPoints: ['ap_3', 'ap_4']
      },
      {
        id: 'guard_4',
        email: 'nightguard@privadalospinos.com',
        password: 'demo123',
        name: 'Luis Hernández',
        phone: '+1-555-0203',
        badgeNumber: 'G004',
        shiftHours: '8 PM - 8 AM',
        accessLevel: 'guard',
        assignedAccessPoints: ['ap_3', 'ap_4']
      }
    ]
  }
};

// Configuración de puntos de acceso por organización
export const demoAccessPoints = {
  org_1: [
    {
      id: 'ap_1',
      name: 'Portería Principal',
      location: 'Entrada principal',
      type: 'main_gate',
      status: 'active',
      assignedGuards: ['guard_1', 'guard_2'],
      features: {
        hasCamera: true,
        hasIntercom: true,
        hasCardReader: false,
        hasBiometric: false
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'ap_2',
      name: 'Entrada Peatonal',
      location: 'Lado este',
      type: 'pedestrian_gate',
      status: 'active',
      assignedGuards: ['guard_1', 'guard_2'],
      features: {
        hasCamera: true,
        hasIntercom: false,
        hasCardReader: true,
        hasBiometric: false
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  org_2: [
    {
      id: 'ap_3',
      name: 'Portería Principal',
      location: 'Entrada principal',
      type: 'main_gate',
      status: 'active',
      assignedGuards: ['guard_3', 'guard_4'],
      features: {
        hasCamera: true,
        hasIntercom: true,
        hasCardReader: true,
        hasBiometric: false
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'ap_4',
      name: 'Entrada de Servicio',
      location: 'Lado oeste',
      type: 'service_entrance',
      status: 'active',
      assignedGuards: ['guard_3', 'guard_4'],
      features: {
        hasCamera: true,
        hasIntercom: false,
        hasCardReader: false,
        hasBiometric: false
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
};

// Función para obtener configuración de una organización específica
export const getOrganizationConfig = (orgId: string) => {
  const org = demoOrganizations.find(o => o.id === orgId);
  const users = demoUsers[orgId as keyof typeof demoUsers];
  const accessPoints = demoAccessPoints[orgId as keyof typeof demoAccessPoints];
  
  return {
    organization: org,
    users,
    accessPoints
  };
};

// Función para obtener todas las configuraciones
export const getAllOrganizationConfigs = () => {
  return demoOrganizations.map(org => ({
    ...org,
    users: demoUsers[org.id as keyof typeof demoUsers],
    accessPoints: demoAccessPoints[org.id as keyof typeof demoAccessPoints]
  }));
};
