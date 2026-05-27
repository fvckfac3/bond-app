import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class PushNotificationService {
  async registerForPushNotifications() {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#C2607A',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permissions not granted');
        return null;
      }

      // Get the push token
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Push token:', token);

      // Save token to user profile in Supabase
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('users')
            .update({ push_token: token, push_token_updated_at: new Date().toISOString() })
            .eq('id', user.id);
          console.log('Push token saved to database');
        }
      } catch (error) {
        console.error('Error saving push token:', error);
      }

      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  async scheduleDailyCheckInReminder() {
    try {
      // Schedule daily reminder at 9 AM
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '❤️ Daily Check-In',
          body: 'Take a moment to reflect on your connection today',
          data: { type: 'daily_checkin' },
        },
        trigger: {
          hour: 9,
          minute: 0,
          repeats: true,
        },
      });

      console.log('Daily check-in reminder scheduled');
    } catch (error) {
      console.error('Error scheduling daily reminder:', error);
    }
  }

  async sendLocalNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: null, // Immediate
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Listen for notification responses (when user taps notification)
  addNotificationResponseListener(callback) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Listen for notifications received while app is foregrounded
  addNotificationReceivedListener(callback) {
    return Notifications.addNotificationReceivedListener(callback);
  }
}

export const pushNotificationService = new PushNotificationService();
