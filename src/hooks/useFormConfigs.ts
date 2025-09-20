import { useState, useEffect } from 'react';
import { FormConfigService } from '../utils/formConfigService';
import { CommunityFormConfig } from '../types/formConfig';

export const useFormConfigs = (organizationId: string) => {
  const [formConfigs, setFormConfigs] = useState<CommunityFormConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFormConfigs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 [USE-FORM-CONFIGS] Cargando formularios para organización:', organizationId);
        
        const configs = await FormConfigService.getAllFormConfigs(organizationId);
        setFormConfigs(configs);
        
        console.log('✅ [USE-FORM-CONFIGS] Formularios cargados exitosamente:', {
          organizationId,
          count: configs.length,
          forms: configs.map(config => ({ id: config.id, name: config.name }))
        });
      } catch (err) {
        console.error('❌ [USE-FORM-CONFIGS] Error cargando formularios:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setFormConfigs([]);
      } finally {
        setLoading(false);
      }
    };

    if (organizationId) {
      loadFormConfigs();
    }
  }, [organizationId]);

  const refreshConfigs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const configs = await FormConfigService.getAllFormConfigs(organizationId);
      setFormConfigs(configs);
    } catch (err) {
      console.error('❌ [USE-FORM-CONFIGS] Error refrescando formularios:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return {
    formConfigs,
    loading,
    error,
    refreshConfigs,
  };
};
