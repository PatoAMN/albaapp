import { useContext, useEffect, useRef } from 'react';
import { AuthContext } from './authContext';

export const useAuthDebug = () => {
  const auth = useContext(AuthContext);
  const prevAuth = useRef(auth);
  
  useEffect(() => {
    console.log('🔍 [useAuthDebug] Hook ejecutado');
    console.log('🔍 [useAuthDebug] Auth actual:', auth);
    console.log('🔍 [useAuthDebug] Auth anterior:', prevAuth.current);
    console.log('🔍 [useAuthDebug] ¿Cambió el usuario?', prevAuth.current?.user !== auth?.user);
    console.log('🔍 [useAuthDebug] ¿Cambió el loading?', prevAuth.current?.loading !== auth?.loading);
    console.log('🔍 [useAuthDebug] ¿Cambió el error?', prevAuth.current?.error !== auth?.error);
    
    if (auth?.user !== prevAuth.current?.user) {
      console.log('🔄 [useAuthDebug] Usuario cambió:');
      console.log('   - Anterior:', prevAuth.current?.user);
      console.log('   - Actual:', auth?.user);
    }
    
    prevAuth.current = auth;
  });
  
  return auth;
};
