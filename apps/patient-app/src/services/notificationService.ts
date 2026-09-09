import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export interface MobileNotificationItem {
  id: string;
  title: string;
  body: string;
  category: 'appointment' | 'prescription' | 'lab' | 'clinical' | 'billing' | 'queue';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

class NotificationService {
  private isCapacitor = false;
  private audioCtx: AudioContext | null = null;

  constructor() {
    this.isCapacitor = typeof (window as any)?.Capacitor !== 'undefined' && (window as any).Capacitor.isNativePlatform();
  }

  private initAudio() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  // Play synthesized crisp modern hospital alert chime
  playChime(type: 'info' | 'urgent' = 'info') {
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (type === 'urgent') {
        // High attention dual beep
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1174, now + 0.12);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else {
        // Gentle bell chime (E5 -> B5 harmonic)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.exponentialRampToValueAtTime(987.77, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      }
    } catch {
      // Audio playback fails gracefully if user hasn't interacted
    }
  }

  // Trigger mobile vibration
  async vibrate(pattern: 'light' | 'heavy' | 'double' = 'light') {
    try {
      if (this.isCapacitor) {
        if (pattern === 'heavy') {
          await Haptics.impact({ style: ImpactStyle.Heavy });
        } else {
          await Haptics.impact({ style: ImpactStyle.Medium });
        }
      } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        if (pattern === 'double') {
          navigator.vibrate([100, 50, 150]);
        } else if (pattern === 'heavy') {
          navigator.vibrate(200);
        } else {
          navigator.vibrate(80);
        }
      }
    } catch {
      // Ignore vibration errors
    }
  }

  // Request system notification permission
  async requestPermission(): Promise<boolean> {
    try {
      if (this.isCapacitor) {
        const perm = await LocalNotifications.requestPermissions();
        return perm.display === 'granted';
      }
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const result = await Notification.requestPermission();
        return result === 'granted';
      }
      return false;
    } catch {
      return false;
    }
  }

  // Check current permission status
  hasPermission(): boolean {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  }

  // Send native notification + chime + haptic
  async send(item: Omit<MobileNotificationItem, 'id' | 'timestamp' | 'read'>): Promise<MobileNotificationItem> {
    const fullItem: MobileNotificationItem = {
      ...item,
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };

    const isUrgent = item.priority === 'urgent' || item.category === 'clinical';
    this.playChime(isUrgent ? 'urgent' : 'info');
    this.vibrate(isUrgent ? 'double' : 'light');

    // Show native device notification if permitted
    try {
      if (this.isCapacitor) {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.floor(Math.random() * 100000),
              title: item.title,
              body: item.body,
              schedule: { at: new Date(Date.now() + 100) },
              smallIcon: 'ic_stat_notification',
            },
          ],
        });
      } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(item.title, {
          body: item.body,
          icon: './icon.svg',
          badge: './icon.svg',
          tag: fullItem.id,
        });
      }
    } catch (err) {
      console.warn('Native notification schedule error:', err);
    }

    return fullItem;
  }
}

export const notificationService = new NotificationService();
