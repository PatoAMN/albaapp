import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configurar el comportamiento de las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
}

export class NotificationService {
  private static expoPushToken: string | null = null;

  /**
   * Solicitar permisos y registrar para notificaciones push
   */
  static async registerForPushNotifications(): Promise<string | null> {
    let token: string | null = null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('Permisos de notificación denegados');
        return null;
      }
      
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        if (!projectId) {
          throw new Error('Project ID no encontrado');
        }
        
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        this.expoPushToken = token;
        console.log('Expo Push Token:', token);
      } catch (error) {
        console.error('Error obteniendo token push:', error);
        return null;
      }
    } else {
      console.warn('Debe usar un dispositivo físico para notificaciones push');
    }

    return token;
  }

  /**
   * Enviar notificación local
   */
  static async sendLocalNotification(data: NotificationData): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: data.title,
        body: data.body,
        data: data.data || {},
      },
      trigger: null, // Enviar inmediatamente
    });
  }

  /**
   * Programar notificación local
   */
  static async scheduleLocalNotification(
    data: NotificationData,
    trigger: Notifications.NotificationTriggerInput
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: data.title,
        body: data.body,
        data: data.data || {},
      },
      trigger,
    });
  }

  /**
   * Cancelar todas las notificaciones programadas
   */
  static async cancelAllScheduledNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Obtener el token de push
   */
  static getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Configurar listener para notificaciones recibidas
   */
  static addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  /**
   * Configurar listener para interacciones con notificaciones
   */
  static addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  /**
   * Notificaciones específicas del sistema SafeGate
   */
  static async notifyAccessGranted(memberName: string, location: string): Promise<void> {
    await this.sendLocalNotification({
      title: '✅ Acceso Concedido',
      body: `${memberName} ha ingresado a ${location}`,
      data: { type: 'access_granted', memberName, location }
    });
  }

  static async notifyAccessDenied(memberName: string, reason: string): Promise<void> {
    await this.sendLocalNotification({
      title: '❌ Acceso Denegado',
      body: `${memberName} - ${reason}`,
      data: { type: 'access_denied', memberName, reason }
    });
  }

  static async notifyGuestRegistered(guestName: string, hostName: string): Promise<void> {
    await this.sendLocalNotification({
      title: '👥 Invitado Registrado',
      body: `${guestName} registrado por ${hostName}`,
      data: { type: 'guest_registered', guestName, hostName }
    });
  }

  static async notifySecurityAlert(message: string): Promise<void> {
    await this.sendLocalNotification({
      title: '🚨 Alerta de Seguridad',
      body: message,
      data: { type: 'security_alert', message }
    });
  }

  static async notifyShiftReminder(shiftStart: Date): Promise<void> {
    const trigger: Notifications.DateTriggerInput = {
      date: new Date(shiftStart.getTime() - 15 * 60 * 1000), // 15 minutos antes
    };

    await this.scheduleLocalNotification({
      title: '⏰ Recordatorio de Turno',
      body: 'Tu turno comienza en 15 minutos',
      data: { type: 'shift_reminder', shiftStart: shiftStart.toISOString() }
    }, trigger);
  }

  static async notifyQRCodeExpiry(memberName: string, expiryTime: Date): Promise<void> {
    const trigger: Notifications.DateTriggerInput = {
      date: expiryTime,
    };

    await this.scheduleLocalNotification({
      title: '⏰ Código QR Expirará',
      body: `El código QR de ${memberName} expirará pronto`,
      data: { type: 'qr_expiry', memberName, expiryTime: expiryTime.toISOString() }
    }, trigger);
  }
}

export default NotificationService;
