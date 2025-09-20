import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from './firebase';
import { CommunityFormConfig, DEFAULT_FORM_CONFIG, FormFieldConfig } from '../types/formConfig';

export class FormConfigService {
  private static readonly COLLECTION_NAME = 'formConfigurations';

  /**
   * Obtiene la configuración del formulario para una organización específica
   */
  static async getFormConfig(organizationId: string): Promise<CommunityFormConfig> {
    try {
      console.log('🔍 [FORM-CONFIG] Obteniendo configuración para organización:', organizationId);
      
      // Buscar formularios activos para esta organización
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('organizationId', '==', organizationId),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      
      console.log('🔍 [FORM-CONFIG] Query ejecutada, resultados encontrados:', querySnapshot.size);
      
      if (!querySnapshot.empty) {
        // Tomar el primer formulario activo encontrado
        const doc = querySnapshot.docs[0];
        const docData = doc.data();
        
        console.log('🔍 [FORM-CONFIG] Documento encontrado:', {
          id: doc.id,
          name: docData.name,
          organizationId: docData.organizationId,
          isActive: docData.isActive,
          sectionsCount: docData.sections?.length || 0
        });
        
        const config = {
          id: doc.id,
          ...docData,
          // Convertir fechas de Firebase si existen
          createdAt: docData.createdAt?.toDate ? docData.createdAt.toDate() : (docData.createdAt || new Date()),
          updatedAt: docData.updatedAt?.toDate ? docData.updatedAt.toDate() : (docData.updatedAt || new Date()),
          // Mapear tipos de campo para compatibilidad
          sections: docData.sections?.map((section: any) => ({
            ...section,
            fields: section.fields?.map((field: any) => {
              const originalType = field.type;
              const mappedType = field.type === 'file' || field.type === 'archivo' ? 'photo' : field.type;
              
              if (originalType !== mappedType) {
                console.log('🔄 [FORM-CONFIG] Mapeando tipo de campo:', {
                  fieldId: field.id,
                  fieldLabel: field.label,
                  originalType,
                  mappedType
                });
              }
              
              return {
                ...field,
                // Mapear tipos de archivo a photo
                type: mappedType
              };
            })
          }))
        } as CommunityFormConfig;
        
        console.log('✅ [FORM-CONFIG] Configuración encontrada:', config);
        return config;
      } else {
        console.log('⚠️ [FORM-CONFIG] No se encontró configuración activa, usando configuración por defecto');
        console.log('🔍 [FORM-CONFIG] Buscando en organización:', organizationId);
        return DEFAULT_FORM_CONFIG;
      }
    } catch (error) {
      console.error('❌ [FORM-CONFIG] Error obteniendo configuración:', error);
      return DEFAULT_FORM_CONFIG;
    }
  }

  /**
   * Obtiene todos los formularios activos para una organización específica
   */
  static async getAllFormConfigs(organizationId: string): Promise<CommunityFormConfig[]> {
    try {
      console.log('🔍 [FORM-CONFIG] Obteniendo todos los formularios para organización:', organizationId);
      console.log('🔍 [FORM-CONFIG] Método getAllFormConfigs llamado con mapeo de tipos');
      
      // Buscar formularios activos para esta organización
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('organizationId', '==', organizationId),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      
      console.log('🔍 [FORM-CONFIG] Query ejecutada, resultados encontrados:', querySnapshot.size);
      
      const configs: CommunityFormConfig[] = [];
      
      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        
        console.log('🔍 [FORM-CONFIG] Formulario encontrado:', {
          id: doc.id,
          name: docData.name,
          organizationId: docData.organizationId,
          isActive: docData.isActive,
          sectionsCount: docData.sections?.length || 0
        });
        
        const config = {
          id: doc.id,
          ...docData,
          // Convertir fechas de Firebase si existen
          createdAt: docData.createdAt?.toDate ? docData.createdAt.toDate() : (docData.createdAt || new Date()),
          updatedAt: docData.updatedAt?.toDate ? docData.updatedAt.toDate() : (docData.updatedAt || new Date()),
          // Mapear tipos de campo para compatibilidad
          sections: docData.sections?.map((section: any) => ({
            ...section,
            fields: section.fields?.map((field: any) => {
              const originalType = field.type;
              const mappedType = field.type === 'file' || field.type === 'archivo' ? 'photo' : field.type;
              
              if (originalType !== mappedType) {
                console.log('🔄 [FORM-CONFIG] Mapeando tipo de campo:', {
                  fieldId: field.id,
                  fieldLabel: field.label,
                  originalType,
                  mappedType
                });
              }
              
              return {
                ...field,
                // Mapear tipos de archivo a photo
                type: mappedType
              };
            })
          }))
        } as CommunityFormConfig;
        
        configs.push(config);
      });
      
      console.log('✅ [FORM-CONFIG] Formularios encontrados:', configs.length);
      return configs;
    } catch (error) {
      console.error('❌ [FORM-CONFIG] Error obteniendo formularios:', error);
      return [];
    }
  }

  /**
   * Guarda o actualiza la configuración del formulario para una organización
   */
  static async saveFormConfig(config: CommunityFormConfig): Promise<void> {
    try {
      console.log('🔍 [FORM-CONFIG] Guardando configuración para organización:', config.organizationId);
      
      const docRef = doc(db, this.COLLECTION_NAME, config.organizationId);
      const configToSave = {
        ...config,
        updatedAt: serverTimestamp(),
      };

      await setDoc(docRef, configToSave, { merge: true });
      console.log('✅ [FORM-CONFIG] Configuración guardada exitosamente');
    } catch (error) {
      console.error('❌ [FORM-CONFIG] Error guardando configuración:', error);
      throw error;
    }
  }

  /**
   * Crea una nueva configuración basada en la configuración por defecto
   */
  static async createDefaultConfig(organizationId: string, organizationName: string): Promise<CommunityFormConfig> {
    try {
      console.log('🔍 [FORM-CONFIG] Creando configuración por defecto para:', organizationId);
      
      const defaultConfig: CommunityFormConfig = {
        ...DEFAULT_FORM_CONFIG,
        organizationId,
        organizationName,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.saveFormConfig(defaultConfig);
      console.log('✅ [FORM-CONFIG] Configuración por defecto creada');
      return defaultConfig;
    } catch (error) {
      console.error('❌ [FORM-CONFIG] Error creando configuración por defecto:', error);
      throw error;
    }
  }


  /**
   * Valida si una configuración es válida
   */
  static validateFormConfig(config: CommunityFormConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.organizationId) {
      errors.push('ID de organización es requerido');
    }

    if (!config.organizationName) {
      errors.push('Nombre de organización es requerido');
    }

    if (!config.sections || config.sections.length === 0) {
      errors.push('Debe tener al menos una sección');
    }

    // Validar que cada sección tenga al menos un campo
    config.sections?.forEach((section, sectionIndex) => {
      if (!section.fields || section.fields.length === 0) {
        errors.push(`La sección ${sectionIndex + 1} debe tener al menos un campo`);
      }

      // Validar campos requeridos
      section.fields?.forEach((field, fieldIndex) => {
        if (!field.id) {
          errors.push(`Campo ${fieldIndex + 1} en sección ${sectionIndex + 1} debe tener un ID`);
        }
        if (!field.label) {
          errors.push(`Campo ${fieldIndex + 1} en sección ${sectionIndex + 1} debe tener una etiqueta`);
        }
        if (!field.type) {
          errors.push(`Campo ${fieldIndex + 1} en sección ${sectionIndex + 1} debe tener un tipo`);
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Obtiene los campos disponibles para configuración
   */
  static getAvailableFields(): FormFieldConfig[] {
    return [
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
  }
}
