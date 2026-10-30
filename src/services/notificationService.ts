import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { RecurringItem } from '../types/finance';

export const ANDROID_CHANNEL_ID = 'recordatorios-recurrentes';

// Configuración para que las notificaciones aparezcan con banner y sonido incluso con la app abierta
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch {
  // En entornos donde no esté disponible el módulo nativo aún
}

export async function requestAndroidNotificationPermissions(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: 'Recordatorios de Pagos e Ingresos Recurrentes',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#38BDF8',
        sound: 'default',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch {
    return false;
  }
}

/**
 * Envía una notificación local en Android en 2 segundos para probar que las alertas funcionan
 */
export async function sendTestNotificationNow(): Promise<boolean> {
  const granted = await requestAndroidNotificationPermissions();
  if (!granted) return false;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 Finanzas USA • Recordatorios Activos',
        body: '¡Tus notificaciones en Android funcionan! Te avisaremos 1 o 2 días antes de cada pago recurrente.',
        sound: 'default',
        color: '#38BDF8',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
        channelId: ANDROID_CHANNEL_ID,
      },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Sincroniza todos los recordatorios en Android para los gastos e ingresos recurrentes activos
 * Programa aviso 1 o 2 días antes (según reminderDaysBefore) + aviso el mismo día de vencimiento a las 9:00 AM.
 */
export async function syncRecurringNotifications(items: RecurringItem[]): Promise<number> {
  try {
    const granted = await requestAndroidNotificationPermissions();
    if (!granted) return 0;

    await Notifications.cancelAllScheduledNotificationsAsync();

    const now = new Date();
    let scheduledCount = 0;

    for (const item of items) {
      if (!item.active) continue;

      const effectiveDateStr = item.postponedUntil || item.nextDueDate;
      const parts = effectiveDateStr.split('-').map(Number);
      if (parts.length !== 3) continue;

      const [year, month, day] = parts;
      const daysBefore = item.reminderDaysBefore ?? 1;

      // 1. Notificación N días antes (1 o 2 días antes a las 09:00 AM)
      if (daysBefore > 0) {
        const advanceDate = new Date(year, month - 1, day - daysBefore, 9, 0, 0);
        if (advanceDate.getTime() > now.getTime()) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `⏰ Recordatorio (${daysBefore} ${daysBefore === 1 ? 'día' : 'días'} antes): ${item.title}`,
              body: `${
                item.type === 'expense' ? 'Pago programado' : 'Ingreso esperado'
              } de $${item.amount.toFixed(2)} para el ${effectiveDateStr}. Recuerda confirmarlo o posponerlo.`,
              sound: 'default',
              color: '#38BDF8',
              data: { recurringId: item.id, type: 'advance_reminder' },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: advanceDate,
              channelId: ANDROID_CHANNEL_ID,
            },
          });
          scheduledCount++;
        }
      }

      // 2. Notificación el mismo día del vencimiento a las 09:00 AM
      const dueDateMorning = new Date(year, month - 1, day, 9, 0, 0);
      if (dueDateMorning.getTime() > now.getTime()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `📅 Hoy vence: ${item.title} ($${item.amount.toFixed(2)})`,
            body: `No se descontará solo. Entra a Finanzas USA para confirmar o posponer este movimiento.`,
            sound: 'default',
            color: '#F59E0B',
            data: { recurringId: item.id, type: 'due_day' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: dueDateMorning,
            channelId: ANDROID_CHANNEL_ID,
          },
        });
        scheduledCount++;
      }
    }

    return scheduledCount;
  } catch {
    return 0;
  }
}
