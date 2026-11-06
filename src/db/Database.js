const requestToPromise = (req) =>
    new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });

export class Database {
    #name;
    #version;
    #schema;
    #db = null;
    #openPromise = null;

    constructor({ name, schema }) {
        if (!name) throw new Error('Database name is required');
        if (!schema?.stores) throw new Error('Schema with stores is required');
        this.#name = name;
        this.#schema = schema;
        this.#version = schema.version ?? 1;
    }

    get isOpen() {
        return this.#db !== null;
    }

    async open() {
        if (this.#db) return this.#db;
        if (this.#openPromise) return this.#openPromise;

        this.#openPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(this.#name, this.#version);

            request.onupgradeneeded = (event) => {
                this.#applySchema(request.result, request.transaction, event.oldVersion);
            };

            request.onsuccess = () => {
                this.#db = request.result;
                this.#db.onversionchange = () => {
                    this.#db?.close();
                    this.#db = null;
                };
                resolve(this.#db);
            };

            request.onerror = () => reject(request.error);
            request.onblocked = () =>
                reject(new Error('Database upgrade blocked by another connection'));
        }).finally(() => {
            this.#openPromise = null;
        });

        return this.#openPromise;
    }

    close() {
        this.#db?.close();
        this.#db = null;
    }

    async transaction(storeNames, mode, executor) {
        const db = await this.open();
        const names = Array.isArray(storeNames) ? storeNames : [storeNames];

        return new Promise((resolve, reject) => {
            const tx = db.transaction(names, mode);
            let execResult;
            let execError;

            tx.oncomplete = () => (execError ? reject(execError) : resolve(execResult));
            tx.onerror = () => reject(tx.error);
            tx.onabort = () =>
                reject(execError ?? tx.error ?? new Error('Transaction aborted'));

            try {
                execResult = executor(tx);
                if (execResult && typeof execResult.then === 'function') {
                    execResult.catch((e) => {
                        execError = e;
                        try { tx.abort(); } catch { /* already aborted */ }
                    });
                }
            } catch (e) {
                execError = e;
                try { tx.abort(); } catch { /* already aborted */ }
            }
        });
    }

    #run(storeName, mode, fn) {
        return this.transaction(storeName, mode, (tx) =>
            fn(tx.objectStore(storeName)),
        );
    }

    get(storeName, key) { return this.#run(storeName, 'readonly', (s) => requestToPromise(s.get(key))); }
    getAll(storeName, q, n) { return this.#run(storeName, 'readonly', (s) => requestToPromise(s.getAll(q, n))); }
    getByIndex(storeName, i, v) { return this.#run(storeName, 'readonly', (s) => requestToPromise(s.index(i).get(v))); }
    getAllByIndex(storeName, i, v) { return this.#run(storeName, 'readonly', (s) => requestToPromise(s.index(i).getAll(v))); }
    add(storeName, v) { return this.#run(storeName, 'readwrite', (s) => requestToPromise(s.add(v))); }
    put(storeName, v) { return this.#run(storeName, 'readwrite', (s) => requestToPromise(s.put(v))); }
    delete(storeName, key) { return this.#run(storeName, 'readwrite', (s) => requestToPromise(s.delete(key))); }
    count(storeName, q) { return this.#run(storeName, 'readonly', (s) => requestToPromise(s.count(q))); }
    clear(storeName) { return this.#run(storeName, 'readwrite', (s) => requestToPromise(s.clear())); }

    #applySchema(db, tx, _oldVersion) {
        for (const [storeName, def] of Object.entries(this.#schema.stores)) {
            let store;
            if (!db.objectStoreNames.contains(storeName)) {
                store = db.createObjectStore(storeName, {
                    keyPath: def.keyPath,
                    autoIncrement: def.autoIncrement ?? false,
                });
            } else {
                store = tx.objectStore(storeName);
            }
            for (const [indexName, idxDef] of Object.entries(def.indexes ?? {})) {
                if (!store.indexNames.contains(indexName)) {
                    store.createIndex(indexName, idxDef.keyPath, {
                        unique: idxDef.unique ?? false,
                        multiEntry: idxDef.multiEntry ?? false,
                    });
                }
            }
        }
    }
}