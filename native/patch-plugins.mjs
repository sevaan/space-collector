// Small fixes to native plugins after npm install (run by `npm run android` / `npm run ios`; safe to run twice).
// Local notifications (Android playtest 2026-10-20): without exact alarms the plugin used setAndAllowWhileIdle, which
// Android may hold for up to an hour, so "Catch of the day in 5 min" could arrive after the pass. setWindow keeps it
// inexact (no Play-restricted permission) but inside a 10-minute window from 6 minutes before the time.
import { readFileSync, writeFileSync } from 'node:fs';
const f = 'node_modules/@capacitor/local-notifications/android/src/main/kotlin/com/capacitorjs/plugins/localnotifications/LocalNotificationManager.kt';
let s = readFileSync(f, 'utf8');
const from = 'alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, pendingIntent)';
const to = 'alarmManager.setWindow(AlarmManager.RTC_WAKEUP, trigger - 6 * 60_000L, 10 * 60_000L, pendingIntent) /* sc: patched */';
if (s.includes(from)) { writeFileSync(f, s.replace(from, to)); console.log('patched local-notifications (setWindow)'); }
else if (!s.includes('sc: patched')) { console.error('local-notifications: patch target not found'); process.exit(1); }
