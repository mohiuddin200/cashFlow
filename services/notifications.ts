import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

class NotificationService {
  private vapidKey = import.meta.env.VITE_VAPID_KEY || null; // This needs to be generated from Firebase Console
  private messaging: any = null;

  private async getMessaging() {
    if (!this.messaging) {
      try {
        const { getMessaging } = await import('firebase/messaging');
        // Your Firebase credentials - you should move this to a shared config
        const firebaseConfig = {
          apiKey: "AIzaSyBpmartgW9gogPjz60wIVdTRlFNEec0QJo",
          authDomain: "cashflow-d07b5.firebaseapp.com",
          projectId: "cashflow-d07b5",
          storageBucket: "cashflow-d07b5.firebasestorage.app",
          messagingSenderId: "491355699088",
          appId: "1:491355699088:web:bcc04ef2120fa5b2186515"
        };
        const app = initializeApp(firebaseConfig);
        this.messaging = getMessaging(app);
      } catch (error) {
        console.error('Error initializing Firebase Messaging:', error);
      }
    }
    return this.messaging;
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  async initializePushNotifications() {
    try {
      // Request permission first
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('Notification permission denied');
        return null;
      }

      // Get FCM token
      const { getToken } = await import('firebase/messaging');
      const messaging = await this.getMessaging();

      if (!messaging) {
        console.log('Firebase Messaging not available');
        return null;
      }

      if (!this.vapidKey) {
        console.error('VAPID key is not configured. Please add VITE_VAPID_KEY to your environment variables.');
        return null;
      }

      const token = await getToken(messaging, { vapidKey: this.vapidKey });

      if (token) {
        console.log('FCM token:', token);
        // Here you would typically save this token to your user's document in Firestore
        await this.saveTokenToUserDocument(token);
        return token;
      } else {
        console.log('No registration token available');
        return null;
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return null;
    }
  }

  async saveTokenToUserDocument(token: string) {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      // Import dynamically to avoid circular dependency
      const { doc, updateDoc, getFirestore } = await import('firebase/firestore');
      const db = getFirestore();
      const userDoc = doc(db, 'users', user.uid);

      try {
        await updateDoc(userDoc, {
          fcmToken: token,
          tokenUpdatedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error saving FCM token to user document:', error);
      }
    }
  }

  async removeToken() {
    try {
      const { deleteToken } = await import('firebase/messaging');
      const messaging = await this.getMessaging();

      if (messaging) {
        await deleteToken(messaging);
      }

      // Remove token from user document
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        const { doc, updateDoc, getFirestore } = await import('firebase/firestore');
        const db = getFirestore();
        const userDoc = doc(db, 'users', user.uid);

        await updateDoc(userDoc, {
          fcmToken: null,
          tokenUpdatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error removing FCM token:', error);
    }
  }

  // Listen for foreground messages
  async onForegroundMessage(callback: (payload: any) => void) {
    try {
      const { onMessage } = await import('firebase/messaging');
      const messaging = await this.getMessaging();

      if (!messaging) {
        return () => {}; // Return empty unsubscribe function
      }

      return onMessage(messaging, (payload) => {
        console.log('Received foreground message:', payload);

        // Show notification in foreground
        if (payload.notification) {
          this.showLocalNotification(payload.notification);
        }

        callback(payload);
      });
    } catch (error) {
      console.error('Error setting up foreground message listener:', error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  // Show local notification for foreground messages
  private showLocalNotification(notification: any) {
    const notificationTitle = notification.title || 'CashFlow Notification';
    const notificationOptions = {
      body: notification.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-72x72.png',
      tag: 'cashflow-notification',
      requireInteraction: false,
      ...notification
    };

    if ('serviceWorker' in navigator && 'showNotification' in ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(notificationTitle, notificationOptions);
      });
    } else {
      // Fallback for browsers without service worker support
      new Notification(notificationTitle, notificationOptions);
    }
  }

  // Schedule local notifications (budget warnings, etc.)
  async scheduleLocalNotification(title: string, body: string, delay: number = 0) {
    // Note: This is a simplified version. In a production app, you might want
    // to use a more sophisticated scheduling system or background sync

    if (delay > 0) {
      setTimeout(() => {
        this.showNotification(title, body);
      }, delay);
    } else {
      this.showNotification(title, body);
    }
  }

  // Helper to show notification directly
  private showNotification(title: string, body: string) {
    const hasPermission = Notification.permission === 'granted';

    if (hasPermission) {
      const options = {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-72x72.png',
        tag: 'cashflow-local',
        requireInteraction: false
      };

      if ('serviceWorker' in navigator && 'showNotification' in ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, options);
        });
      } else {
        new Notification(title, options);
      }
    }
  }

  // Financial alert types
  async sendBudgetWarning(spent: number, budget: number, currency: string = 'USD') {
    const percentage = Math.round((spent / budget) * 100);
    await this.showNotification(
      'Budget Alert',
      `You've spent ${percentage}% of your ${currency} ${budget.toLocaleString()} budget`
    );
  }

  async sendTransactionReminder(category?: string) {
    const title = 'Time to log your expenses';
    const body = category
      ? `Don't forget to log your ${category} expenses`
      : 'Keep track of your spending by logging your transactions';

    await this.showNotification(title, body);
  }

  async sendMonthlySummary(month: string, totalIncome: number, totalExpenses: number, currency: string = 'USD') {
    const netAmount = totalIncome - totalExpenses;
    const netText = netAmount >= 0 ? 'saved' : 'overspent';

    await this.showNotification(
      `${month} Financial Summary`,
      `Income: ${currency} ${totalIncome.toLocaleString()}, Expenses: ${currency} ${totalExpenses.toLocaleString()}, You ${netText}: ${currency} ${Math.abs(netAmount).toLocaleString()}`
    );
  }
}

export const notificationService = new NotificationService();

// Hook for React components to use notifications
export const useNotifications = () => {
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  const requestNotificationPermission = async () => {
    return await notificationService.requestPermission();
  };

  const initializeNotifications = async () => {
    const token = await notificationService.initializePushNotifications();

    // Set up foreground message listener
    if (token) {
      const unsub = await notificationService.onForegroundMessage((payload) => {
        // Handle foreground messages here
        console.log('Notification received in foreground:', payload);
      });
      setUnsubscribe(() => unsub);
    }

    return token;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [unsubscribe]);

  return {
    requestPermission: requestNotificationPermission,
    initializeNotifications,
    sendBudgetWarning: notificationService.sendBudgetWarning.bind(notificationService),
    sendTransactionReminder: notificationService.sendTransactionReminder.bind(notificationService),
    sendMonthlySummary: notificationService.sendMonthlySummary.bind(notificationService),
    cleanup: unsubscribe
  };
};