// The admin panel's service worker. It does one thing: shows a new-order alert pushed by the
// Edge Function `order-push` (migration 0013), even with the panel closed, and opens that order
// when the alert is tapped. It caches nothing, so a deploy is never held back by an old copy.

// Paths are taken from the worker's own scope, so the panel works at the domain root or under
// the old github.io path alike.
const at = (p) => new URL(p, self.registration.scope).href

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('push', (e) => {
  let d = {}
  try { d = e.data ? e.data.json() : {} } catch { d = { title: 'Mextra Mart', body: e.data && e.data.text() } }
  e.waitUntil(self.registration.showNotification(d.title || 'New order', {
    body: d.body || '',
    icon: at('icon-192.png'),
    badge: at('icon-192.png'),
    tag: d.tag || 'order',
    renotify: true,
    requireInteraction: true,       // stays until someone looks at it
    vibrate: [200, 100, 200, 100, 400],
    data: { url: at((d.url || 'orders').replace(/^\//, '')) },
  }))
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = (e.notification.data && e.notification.data.url) || at('orders')
  e.waitUntil((async () => {
    const tabs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const t of tabs) {
      if (new URL(t.url).origin === self.location.origin) { await t.focus(); return t.navigate(url) }
    }
    return self.clients.openWindow(url)
  })())
})
