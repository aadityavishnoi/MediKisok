import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.medikiosk.patientapp',
  appName: 'MediKiosk Patient App',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_notification',
      iconColor: '#059669',
      sound: 'beep.wav',
    },
  },
};

export default config;
