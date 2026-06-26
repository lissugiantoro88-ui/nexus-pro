// NEXUS PRO — Service Worker for Push Notifications
const CACHE = 'nexus-pro-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

// ── REMINDER CHECK ────────────────────────────────────────────────────────────
// Called periodically via Background Sync or manual trigger
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'CHECK_REMINDERS') {
    checkAndFireReminders(e.data.reminders);
  }
});

// ── NOTIFICATION CLICK ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      if (clients.length > 0) {
        clients[0].focus();
        clients[0].postMessage({ type: 'NOTIFICATION_CLICK', data: e.notification.data });
      } else {
        self.clients.openWindow('/');
      }
    })
  );
});

// ── BACKGROUND SYNC ───────────────────────────────────────────────────────────
self.addEventListener('sync', e => {
  if (e.tag === 'check-reminders') {
    e.waitUntil(handleBackgroundCheck());
  }
});

// ── PERIODIC BACKGROUND SYNC (Chrome Android) ────────────────────────────────
self.addEventListener('periodicsync', e => {
  if (e.tag === 'nexus-reminder-check') {
    e.waitUntil(handleBackgroundCheck());
  }
});

async function handleBackgroundCheck() {
  // Get reminders from IndexedDB (set by main app)
  try {
    const db = await openReminderDB();
    const reminders = await getAllReminders(db);
    await checkAndFireReminders(reminders);
  } catch(e) {
    console.error('SW: reminder check failed', e);
  }
}

async function checkAndFireReminders(reminders) {
  if (!reminders || !reminders.length) return;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const todayStr = now.toISOString().split('T')[0];

  for (const r of reminders) {
    if (!r.enabled) continue;
    // Check if today matches reminder condition
    const shouldFire = shouldFireToday(r, todayStr, now);
    if (!shouldFire) continue;

    // Check if this reminder was already fired today
    const firedKey = `fired_${r.id}_${todayStr}`;
    const db = await openReminderDB();
    const alreadyFired = await getFromDB(db, 'fired', firedKey);
    if (alreadyFired) continue;

    // Check if current time matches reminder time (within 5 min window)
    const [rHour, rMin] = (r.time || '08:00').split(':').map(Number);
    const reminderMin = rHour * 60 + rMin;
    if (Math.abs(nowMin - reminderMin) > 5) continue;

    // Fire notification
    await self.registration.showNotification(`⏰ ${r.itemName}`, {
      body: buildBody(r),
      icon: '/icon-192.png',
      badge: '/icon-72.png',
      tag: r.id,
      data: { itemId: r.itemId, itemType: r.itemType },
      requireInteraction: true,
      actions: [
        { action: 'open', title: 'Buka App' },
        { action: 'dismiss', title: 'Tutup' }
      ]
    });

    // Mark as fired
    await saveToDB(db, 'fired', { id: firedKey, firedAt: now.toISOString() });
  }
}

function shouldFireToday(r, todayStr, now) {
  if (!r.dueDate && r.type === 'task') return false;
  if (r.type === 'habit') return true; // habits fire every day

  const due = new Date(r.dueDate + 'T00:00:00');
  const today = new Date(todayStr + 'T00:00:00');
  const diffDays = Math.round((due - today) / 86400000);

  // Fire on specified days before due
  if (r.daysBefore && r.daysBefore.includes(diffDays)) return true;
  if (diffDays === 0) return true; // always fire on due date itself
  if (diffDays < 0 && r.fireIfOverdue) return true; // overdue
  return false;
}

function buildBody(r) {
  if (r.type === 'habit') return `Jangan lupa habit harian: ${r.itemName}`;
  if (r.dueDate) {
    const due = new Date(r.dueDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0,0,0,0);
    const diff = Math.round((due - today) / 86400000);
    if (diff < 0) return `⚠️ Sudah melewati due date ${Math.abs(diff)} hari lalu`;
    if (diff === 0) return `Due date hari ini!`;
    return `Due date ${diff} hari lagi (${r.dueDate})`;
  }
  return r.category ? `Kategori: ${r.category}` : 'Segera diselesaikan';
}

// ── INDEXEDDB HELPERS ─────────────────────────────────────────────────────────
function openReminderDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open('nexus-reminders', 1);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('reminders')) db.createObjectStore('reminders', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('fired')) db.createObjectStore('fired', { keyPath: 'id' });
    };
    req.onsuccess = e => res(e.target.result);
    req.onerror = e => rej(e);
  });
}

function getAllReminders(db) {
  return new Promise((res, rej) => {
    const tx = db.transaction('reminders', 'readonly');
    const req = tx.objectStore('reminders').getAll();
    req.onsuccess = e => res(e.target.result || []);
    req.onerror = rej;
  });
}

function getFromDB(db, store, key) {
  return new Promise((res) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = e => res(e.target.result);
    req.onerror = () => res(null);
  });
}

function saveToDB(db, store, data) {
  return new Promise((res, rej) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(data);
    tx.oncomplete = res;
    tx.onerror = rej;
  });
}
