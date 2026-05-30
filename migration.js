async function migrateFromCookies() {
    if (!storage.db) {
        await storage.init();
    }
    const migrated = await storage.getSetting('migrated');
    if (migrated) {
        console.log('Already migrated');
        return;
    }

    const cookies = document.cookie.split('; ');
    const cookieMap = {};
    cookies.forEach(c => {
        const parts = c.split('=');
        if (parts.length < 2) return;
        const key = parts[0].trim();
        const value = parts.slice(1).join('=');
        try {
            cookieMap[key] = decodeURIComponent(value);
        } catch(e) {
            cookieMap[key] = value;
        }
    });

    if (cookieMap['api_key']) {
        await storage.setSetting('api_key', cookieMap['api_key']);
    }
    if (cookieMap['model']) {
        await storage.setSetting('model', cookieMap['model']);
    }
    if (cookieMap['pitch']) {
        await storage.setSetting('pitch', cookieMap['pitch']);
    }
    if (cookieMap['rate']) {
        await storage.setSetting('rate', cookieMap['rate']);
    }
    if (cookieMap['temperature']) {
        await storage.setSetting('temperature', cookieMap['temperature']);
    }

    if (cookieMap['historyList']) {
        try {
            const history = JSON.parse(cookieMap['historyList']);
            if (Array.isArray(history) && history.length > 0) {
                // Create a default topic
                const transaction = storage.db.transaction(['topics'], 'readwrite');
                const store = transaction.objectStore('topics');
                const topicId = await new Promise((resolve, reject) => {
                    const req = store.add({ title: 'Default Conversation', createdAt: new Date() });
                    req.onsuccess = () => resolve(req.result);
                    req.onerror = () => reject(req.error);
                });

                for (const msg of history) {
                    await storage.addMessage({
                        topicId: topicId,
                        role: msg.role,
                        content: msg.content,
                        timestamp: new Date()
                    });
                }
            }
        } catch (e) {
            console.error('Failed to migrate historyList', e);
        }
    }
    await storage.setSetting('migrated', true);
    console.log('Migration complete');
}
