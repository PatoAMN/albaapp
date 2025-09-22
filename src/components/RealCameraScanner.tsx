import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, SafeAreaView } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';

interface RealCameraScannerProps {
  isScanning: boolean;
  onBarCodeScanned: (data: { type: string; data: string }) => void;
  onManualInput: () => void;
  onResumeScanning: () => void;
}

export const RealCameraScanner: React.FC<RealCameraScannerProps> = ({
  isScanning,
  onBarCodeScanned,
  onManualInput,
  onResumeScanning,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isHandlingScan, setIsHandlingScan] = useState<boolean>(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    const ensurePermission = async () => {
      if (!permission) return;
      if (!permission.granted) {
        const res = await requestPermission();
        setHasPermission(res?.granted ?? false);
      } else {
        setHasPermission(true);
      }
    };
    ensurePermission();
  }, [permission, requestPermission]);

  const handleScan = useCallback(
    (result: BarcodeScanningResult) => {
      if (!isScanning || isHandlingScan) return;
      setIsHandlingScan(true);
      try {
        onBarCodeScanned({ type: result.type, data: result.data });
      } finally {
        // Pequeño cooldown para evitar disparos múltiples
        setTimeout(() => setIsHandlingScan(false), 750);
      }
    },
    [isScanning, isHandlingScan, onBarCodeScanned]
  );

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <View style={styles.statusContainer}>
            <Text style={styles.statusIcon}>📷</Text>
            <Text style={styles.statusText}>Solicitando permisos de cámara…</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <View style={styles.statusContainer}>
            <Text style={styles.statusIcon}>🔒</Text>
            <Text style={styles.statusText}>Sin acceso a la cámara</Text>
            <Text style={styles.statusSubtext}>Se requieren permisos para escanear códigos QR</Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
              <Text style={styles.primaryButtonText}>Conceder Permisos</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={onManualInput}>
              <Text style={styles.secondaryButtonText}>Usar Entrada Manual</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.cameraWrapper}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={handleScan}
            facing="back"
          >
            <View style={styles.overlay}>
              {/* Header Status */}
              <View style={styles.header}>
                <View style={styles.statusIndicator}>
                  <View style={[styles.statusDot, { backgroundColor: isScanning ? '#10b981' : '#f59e0b' }]} />
                  <Text style={styles.statusText}>
                    {isScanning ? 'Escaneando' : 'Pausado'}
                  </Text>
                </View>
              </View>

              {/* Center Scan Frame */}
              <View style={styles.scanFrameContainer}>
                <View style={styles.scanFrame}>
                  {/* Marco redondeado de fondo */}
                  <View style={styles.scanFrameBorder} />
                  
                  {/* Esquinas L verdes */}
                  <View style={styles.cornerTL} />
                  <View style={styles.cornerTR} />
                  <View style={styles.cornerBL} />
                  <View style={styles.cornerBR} />
                  
                  <Text style={styles.scanInstructions}>
                    {isScanning ? 'Apunta la cámara al código QR' : 'Cámara lista'}
                  </Text>
                </View>
              </View>

              {/* Bottom Controls */}
              <View style={styles.controlsContainer}>
                {!isScanning && (
                  <TouchableOpacity style={styles.primaryButton} onPress={onResumeScanning}>
                    <Text style={styles.primaryButtonText}>Reanudar Escaneo</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity style={styles.secondaryButton} onPress={onManualInput}>
                  <Text style={styles.secondaryButtonText}>Entrada Manual</Text>
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        </View>
      </View>
    </SafeAreaView>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
  },
  cameraWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 24,
  },
  statusContainer: {
    alignItems: 'center',
    maxWidth: 300,
  },
  statusIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  statusSubtext: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 280,
    marginTop: 32,
  },
  camera: {
    width: width,
    height: height,
    alignSelf: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  scanFrameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: Math.min(width * 0.6, 240),
    height: Math.min(width * 0.6, 240),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  scanFrameBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#10b981',
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#10b981',
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#10b981',
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#10b981',
  },
  scanInstructions: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  controlsContainer: {
    alignItems: 'center',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    minWidth: 200,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});
