import { useState, useEffect } from 'react';
import { FormConfigService } from '../utils/formConfigService';
import { CommunityFormConfig, DEFAULT_FORM_CONFIG } from '../types/formConfig';

export const useFormConfig = (organizationId: string) => {
  const [formConfig, setFormConfig] = useState<CommunityFormConfig>(DEFAULT_FORM_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFormConfig = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 [USE-FORM-CONFIG] Cargando configuración para organización:', organizationId);
        
        const config = await FormConfigService.getFormConfig(organizationId);
        setFormConfig(config);
        
        console.log('✅ [USE-FORM-CONFIG] Configuración cargada exitosamente:', {
          organizationId,
          configId: config.id,
          sectionsCount: config.sections?.length || 0,
          totalFields: config.sections?.reduce((total, section) => total + (section.fields?.length || 0), 0) || 0,
          isDefault: config.id === 'default'
        });
      } catch (err) {
        console.error('❌ [USE-FORM-CONFIG] Error cargando configuración:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setFormConfig(DEFAULT_FORM_CONFIG);
      } finally {
        setLoading(false);
      }
    };

    if (organizationId) {
      loadFormConfig();
    }
  }, [organizationId]);

  const refreshConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const config = await FormConfigService.getFormConfig(organizationId);
      setFormConfig(config);
    } catch (err) {
      console.error('❌ [USE-FORM-CONFIG] Error refrescando configuración:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return {
    formConfig,
    loading,
    error,
    refreshConfig,
  };
};
