// اسم التخزين المؤقت
const CACHE_NAME = 'anatomy-v1';

// الملفات التي نخزنها (الصور + الصفحة الرئيسية)
const urlsToCache = [
    './',
    './index.html',
    './1.jpg',
    './2.jpg',
    './3.jpg',
    './4.jpg',
    './5.jpg',
    './6.jpg',
    './7.jpg',
    './8.jpg',
    './9.jpg'
];

// التثبيت الأول - تخزين كل الملفات
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('✓ تم فتح التخزين المؤقت');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('✓ جميع الموارد مخزنة محلياً');
                return self.skipWaiting();
            })
            .catch(error => {
                console.log('✗ فشل تخزين بعض الملفات:', error);
            })
    );
});

// تفعيل Service Worker وتنظيف التخزين القديم
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('✓ حذف التخزين القديم:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('✓ Service Worker نشط وجاهز');
            return self.clients.claim();
        })
    );
});

// استراتيجية التحميل: من التخزين أولاً، ثم من الشبكة
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // إذا وجدنا الملف في التخزين، نرجعه فوراً
                if (response) {
                    console.log('✓ من التخزين:', event.request.url);
                    return response;
                }

                // إذا لم نجده، نحمله من الإنترنت ونخزنه
                console.log('من الإنترنت:', event.request.url);
                return fetch(event.request).then(
                    networkResponse => {
                        // نتأكد أن الرد صحيح
                        if (!networkResponse || networkResponse.status !== 200) {
                            return networkResponse;
                        }

                        // نخزن الرد في التخزين للاستخدام المستقبلي
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                                console.log('✓ تم تخزين:', event.request.url);
                            });

                        return networkResponse;
                    }
                ).catch(error => {
                    console.log('✗ فشل تحميل:', event.request.url, error);
                    // ممكن نرجع صفحة خطأ هنا إذا حبينا
                });
            })
    );
});

// تحديث التخزين عند الاتصال بالإنترنت
self.addEventListener('online', () => {
    console.log('✓ الجهاز متصل بالإنترنت - تحديث التخزين');
    caches.open(CACHE_NAME).then(cache => {
        urlsToCache.forEach(url => {
            fetch(url)
                .then(response => {
                    if (response.status === 200) {
                        cache.put(url, response);
                        console.log('✓ تحديث:', url);
                    }
                })
                .catch(() => {});
        });
    });
});
