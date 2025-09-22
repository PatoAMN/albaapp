// Tipos para configuración dinámica de formularios

export interface FormFieldConfig {
  id: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'photo';
  required: boolean;
  visible: boolean; // Si el campo es visible en la app
  placeholder?: string;
  options?: string[]; // Para campos de tipo select
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  order: number; // Orden de aparición en el formulario
}

export interface FormSectionConfig {
  id: string;
  title: string;
  fields: FormFieldConfig[];
  order: number;
}

export interface CommunityFormConfig {
  organizationId: string;
  organizationName: string;
  sections: FormSectionConfig[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Configuración por defecto (fallback)
export const DEFAULT_FORM_CONFIG: CommunityFormConfig = {
  organizationId: 'default',
  organizationName: 'Default Community',
  sections: [
    {
      id: 'guest-info',
      title: 'Información del Invitado',
      order: 1,
      fields: [
        {
          id: 'guest-name',
          label: 'Nombre Completo',
          type: 'text',
          required: true,
          visible: true,
          placeholder: 'Ingrese el nombre completo del invitado',
          order: 1,
        },
        {
          id: 'guest-id-photo',
          label: 'Foto de Identificación',
          type: 'photo',
          required: false,
          visible: true,
          order: 2,
        },
      ],
    },
    {
      id: 'host-info',
      title: 'Información del Anfitrión',
      order: 2,
      fields: [
        {
          id: 'host-name',
          label: 'Nombre del Anfitrión',
          type: 'text',
          required: true,
          visible: true,
          placeholder: 'Nombre del residente que recibe',
          order: 1,
        },
        {
          id: 'host-unit',
          label: 'Unidad/Departamento',
          type: 'text',
          required: true,
          visible: true,
          placeholder: 'Ej: A-101, Torre 1, Casa 25',
          order: 2,
        },
      ],
    },
    {
      id: 'vehicle-info',
      title: 'Información del Vehículo',
      order: 3,
      fields: [
        {
          id: 'vehicle-type',
          label: 'Tipo de Vehículo',
          type: 'select',
          required: false,
          visible: true,
          options: ['Automóvil', 'Motocicleta', 'Bicicleta', 'A pie', 'Otro'],
          order: 1,
        },
        {
          id: 'license-plate',
          label: 'Placa/Número',
          type: 'text',
          required: false,
          visible: true,
          placeholder: 'Número de placa o identificación',
          order: 2,
        },
        {
          id: 'license-plate-photo',
          label: 'Foto de la Placa',
          type: 'photo',
          required: false,
          visible: true,
          order: 3,
        },
      ],
    },
    {
      id: 'additional-info',
      title: 'Información Adicional',
      order: 4,
      fields: [
        {
          id: 'notes',
          label: 'Observaciones',
          type: 'textarea',
          required: false,
          visible: true,
          placeholder: 'Información adicional relevante sobre la visita',
          order: 1,
        },
      ],
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: true,
};

// Campos disponibles para configuración
export const AVAILABLE_FIELDS: FormFieldConfig[] = [
  // Información del invitado
  {
    id: 'guest-name',
    label: 'Nombre Completo',
    type: 'text',
    required: true,
    visible: true,
    placeholder: 'Ingrese el nombre completo del invitado',
    order: 1,
  },
  {
    id: 'guest-phone',
    label: 'Teléfono',
    type: 'phone',
    required: false,
    visible: true,
    placeholder: 'Número de teléfono',
    order: 2,
  },
  {
    id: 'guest-email',
    label: 'Email',
    type: 'email',
    required: false,
    visible: true,
    placeholder: 'Correo electrónico',
    order: 3,
  },
  {
    id: 'guest-id-photo',
    label: 'Foto de Identificación',
    type: 'photo',
    required: false,
    visible: true,
    order: 4,
  },
  
  // Información del anfitrión
  {
    id: 'host-name',
    label: 'Nombre del Anfitrión',
    type: 'text',
    required: true,
    visible: true,
    placeholder: 'Nombre del residente que recibe',
    order: 5,
  },
  {
    id: 'host-unit',
    label: 'Unidad/Departamento',
    type: 'text',
    required: true,
    visible: true,
    placeholder: 'Ej: A-101, Torre 1, Casa 25',
    order: 6,
  },
  
  // Detalles de la visita
  {
    id: 'visit-purpose',
    label: 'Propósito de la Visita',
    type: 'select',
    required: false,
    visible: true,
    options: ['Visita familiar', 'Entrega de paquete', 'Servicio técnico', 'Reunión de trabajo', 'Otro'],
    order: 7,
  },
  {
    id: 'expected-duration',
    label: 'Duración Estimada',
    type: 'select',
    required: false,
    visible: true,
    options: ['30 minutos', '1 hora', '2 horas', 'Media jornada', 'Todo el día', 'Indefinido'],
    order: 8,
  },
  
  // Información del vehículo
  {
    id: 'vehicle-type',
    label: 'Tipo de Vehículo',
    type: 'select',
    required: false,
    visible: true,
    options: ['Automóvil', 'Motocicleta', 'Bicicleta', 'A pie', 'Otro'],
    order: 9,
  },
  {
    id: 'license-plate',
    label: 'Placa/Número',
    type: 'text',
    required: false,
    visible: true,
    placeholder: 'Número de placa o identificación',
    order: 10,
  },
  {
    id: 'license-plate-photo',
    label: 'Foto de la Placa',
    type: 'photo',
    required: false,
    visible: true,
    order: 11,
  },
  
  // Información adicional
  {
    id: 'notes',
    label: 'Observaciones',
    type: 'textarea',
    required: false,
    visible: true,
    placeholder: 'Información adicional relevante sobre la visita',
    order: 12,
  },
];
