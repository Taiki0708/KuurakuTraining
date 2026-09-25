const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const version = 'task2-org-20260925';
const affectedHtml = [
  'index.html',
  'auth.html',
  'admin.html',
  'my-training.html',
  'v1.html',
  'v1-admin.html',
  'v1-certificate.html',
  'certificate.html',
  'customer-service.html',
  'food-safety.html',
  'japanese-hospitality.html',
  'restaurant-basics.html',
  'platform-admin.html'
];
const swSource = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const pwaSource = fs.readFileSync(path.join(root, 'pwa.js'), 'utf8');
const v1StoreSource = fs.readFileSync(path.join(root, 'v1-store.js'), 'utf8');
const clientSource = fs.readFileSync(path.join(root, 'supabase-client.js'), 'utf8');

const localVersionedAssets = source => [...source.matchAll(/(?:src|href)=["']([^"']+\?v=([^"']+))["']/g)]
  .filter(([, url]) => !/^https?:/i.test(url));

test('all affected HTML uses one Task 2 asset version', () => {
  for (const file of affectedHtml) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    const supabase = [...source.matchAll(/supabase-client\.js\?v=([^"']+)/g)];
    assert.equal(supabase.length, 1, `${file} must load one versioned supabase-client.js`);
    assert.equal(supabase[0][1], version, `${file} supabase-client.js version`);

    if (['my-training.html', 'v1.html', 'v1-admin.html', 'v1-certificate.html'].includes(file)) {
      const store = [...source.matchAll(/v1-store\.js\?v=([^"']+)/g)];
      assert.equal(store.length, 1, `${file} must load one versioned v1-store.js`);
      assert.equal(store[0][1], version, `${file} v1-store.js version`);
    }

    for (const [, url, assetVersion] of localVersionedAssets(source)) {
      assert.equal(assetVersion, version, `${file} has inconsistent asset URL ${url}`);
    }
  }
});

test('service worker cache and shell assets use the Task 2 version only', () => {
  assert.match(swSource, new RegExp(`const ASSET_VERSION = '${version}'`));
  assert.match(swSource, /const VERSION = `serveup-training-\$\{ASSET_VERSION\}`/);
  assert.match(swSource, /supabase-client\.js\?v=\$\{ASSET_VERSION\}/);
  assert.match(swSource, /v1-store\.js\?v=\$\{ASSET_VERSION\}/);
  assert.doesNotMatch(swSource, /1\.0\.0-8|1\.0\.0-5|training-unified-1|profile-name-1|4ede70035|894eda39/);
  assert.doesNotMatch(swSource, /['"](?:v1|v1-admin|v1-certificate|my-training)\.html['"]/);
});

function createWorkerHarness(initialCaches = []) {
  const listeners = new Map();
  const cacheData = new Map(initialCaches.map(name => [name, new Map()]));
  const navigations = [];
  const fetches = [];
  let claims = 0;
  let skipWaitingCalls = 0;

  const response = url => ({ ok: true, url, clone() { return response(url); } });
  const cacheApi = name => ({
    async addAll(urls) {
      const entries = cacheData.get(name);
      for (const url of urls) entries.set(String(url), response(String(url)));
    },
    async match(request) {
      return cacheData.get(name).get(String(request));
    },
    async put(request, value) {
      cacheData.get(name).set(String(request.url || request), value);
    }
  });
  const caches = {
    async open(name) {
      if (!cacheData.has(name)) cacheData.set(name, new Map());
      return cacheApi(name);
    },
    async keys() { return [...cacheData.keys()]; },
    async delete(name) { return cacheData.delete(name); },
    async match(request) {
      for (const entries of cacheData.values()) {
        const hit = entries.get(String(request));
        if (hit) return hit;
      }
      return undefined;
    }
  };
  const client = {
    url: 'https://serveup.test/app/v1.html',
    async navigate(url) { navigations.push(url); return this; }
  };
  const self = {
    registration: { scope: 'https://serveup.test/app/' },
    location: { origin: 'https://serveup.test' },
    clients: {
      async claim() { claims += 1; },
      async matchAll() { return [client]; }
    },
    async skipWaiting() { skipWaitingCalls += 1; },
    addEventListener(type, listener) { listeners.set(type, listener); }
  };
  const fetch = async (request, options) => {
    const url = String(request.url || request);
    fetches.push({ url, options });
    if (url.includes('network-failure')) throw new Error('offline');
    return response(url);
  };
  vm.runInNewContext(swSource, { self, caches, fetch, URL, Promise, console });

  const dispatch = async (type, extra = {}) => {
    let pending;
    let responsePromise;
    listeners.get(type)({
      ...extra,
      waitUntil(value) { pending = Promise.resolve(value); },
      respondWith(value) { responsePromise = Promise.resolve(value); }
    });
    if (pending) await pending;
    return responsePromise ? responsePromise : undefined;
  };

  return {
    cacheData,
    dispatch,
    fetches,
    navigations,
    get claims() { return claims; },
    get skipWaitingCalls() { return skipWaitingCalls; }
  };
}

test('fresh install caches current assets, claims safely, and does not reload', async () => {
  const worker = createWorkerHarness();
  await worker.dispatch('install');
  await worker.dispatch('activate');

  assert.equal(worker.skipWaitingCalls, 1);
  assert.equal(worker.claims, 1);
  assert.deepEqual(worker.navigations, []);
  assert.ok(worker.cacheData.has(`serveup-training-${version}-shell`));
  const shell = worker.cacheData.get(`serveup-training-${version}-shell`);
  assert.ok(shell.has(`https://serveup.test/app/supabase-client.js?v=${version}`));
  assert.ok(shell.has(`https://serveup.test/app/v1-store.js?v=${version}`));
});

test('production cache upgrade removes old ServeUp caches and reloads once', async () => {
  const worker = createWorkerHarness([
    'serveup-training-1.0.0-8-shell',
    'serveup-training-1.0.0-8-content',
    'serveup-v1-1.0.0-5-shell',
    'unrelated-application-cache'
  ]);
  await worker.dispatch('install');
  await worker.dispatch('activate');

  assert.deepEqual([...worker.cacheData.keys()].sort(), [
    `serveup-training-${version}-shell`,
    'unrelated-application-cache'
  ].sort());
  assert.deepEqual(worker.navigations, ['https://serveup.test/app/v1.html']);

  const sameVersion = createWorkerHarness([
    `serveup-training-${version}-shell`,
    `serveup-training-${version}-content`
  ]);
  await sameVersion.dispatch('install');
  await sameVersion.dispatch('activate');
  assert.deepEqual(sameVersion.navigations, [], 'same version must not create a reload loop');
});

test('old HTML requests receive network HTML and canonical Task 2 JavaScript', async () => {
  const worker = createWorkerHarness(['serveup-training-1.0.0-8-shell']);
  await worker.dispatch('install');
  await worker.dispatch('activate');

  const html = await worker.dispatch('fetch', {
    request: { method: 'GET', mode: 'navigate', url: 'https://serveup.test/app/v1.html' }
  });
  assert.equal(html.url, 'https://serveup.test/app/v1.html');

  const client = await worker.dispatch('fetch', {
    request: { method: 'GET', mode: 'no-cors', url: 'https://serveup.test/app/supabase-client.js?v=profile-name-1' }
  });
  const store = await worker.dispatch('fetch', {
    request: { method: 'GET', mode: 'no-cors', url: 'https://serveup.test/app/v1-store.js?v=1.0.0-5' }
  });
  assert.equal(client.url, `https://serveup.test/app/supabase-client.js?v=${version}`);
  assert.equal(store.url, `https://serveup.test/app/v1-store.js?v=${version}`);
});

test('cache upgrade cannot erase local training data, IndexedDB, or auth state', async () => {
  const persistentState = {
    localStorage: new Map([['serveup-v1:session:user:course', '{"question":2}']]),
    indexedDB: new Map([['offline-progress', 'present']]),
    auth: { accessToken: 'preserved' }
  };
  const worker = createWorkerHarness(['serveup-training-1.0.0-8-shell']);
  await worker.dispatch('install');
  await worker.dispatch('activate');

  assert.equal(persistentState.localStorage.size, 1);
  assert.equal(persistentState.indexedDB.size, 1);
  assert.equal(persistentState.auth.accessToken, 'preserved');
  assert.doesNotMatch(swSource, /localStorage|indexedDB|signOut|removeItem|clear\s*\(/);
});

test('Task 2 organization-aware storage and database contract remain intact', () => {
  assert.match(v1StoreSource, /serveup-v1:\$\{kind\}:\$\{organizationId\}:\$\{userId\}:\$\{courseId\}/);
  assert.match(v1StoreSource, /organizations\.length !== 1/);
  assert.match(v1StoreSource, /eq\('organization_id', organizationId\)/);
  assert.match(clientSource, /rpc\("get_my_organization_context"\)/);
  assert.match(clientSource, /rpc\("record_training_attempt"/);
  assert.match(clientSource, /rpc\("save_training_completion"/);
});

function createV1StoreHarness(organizations) {
  const values = new Map();
  const localStorage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
  const query = {
    select() { return this; },
    eq() { return this; },
    order() { return this; },
    async maybeSingle() { return { data: null, error: { code: 'OFFLINE' } }; }
  };
  const window = {
    ServeUpProgress: {
      client: { from() { return query; }, async rpc() { return { data: null, error: null }; } },
      async getCurrentOrganizationId() { return organizations[0]?.organization_id; },
      async getOrganizationContext() { return organizations; },
      async getCurrentUser() { return { id: 'user-a' }; }
    }
  };
  vm.runInNewContext(v1StoreSource, { window, localStorage, console: { warn() {} }, JSON, Date, crypto });
  return { store: window.ServeUpV1Store, values };
}

test('organization-unaware localStorage migrates only for an unambiguous single organization', async () => {
  const legacyKey = 'serveup-v1:session:user-a:restaurant-orientation';
  const scopedKey = 'serveup-v1:session:org-a:user-a:restaurant-orientation';
  const single = createV1StoreHarness([{ organization_id: 'org-a', selected: true }]);
  single.values.set(legacyKey, JSON.stringify({ questionIndex: 3 }));

  const recovered = await single.store.session('user-a', 'restaurant-orientation');
  assert.equal(recovered.questionIndex, 3);
  assert.equal(JSON.parse(single.values.get(scopedKey)).questionIndex, 3);
  assert.ok(single.values.has(legacyKey), 'legacy training data must not be erased');

  const multiple = createV1StoreHarness([
    { organization_id: 'org-a', selected: true },
    { organization_id: 'org-b', selected: false }
  ]);
  multiple.values.set(legacyKey, JSON.stringify({ questionIndex: 4 }));
  const ambiguous = await multiple.store.session('user-a', 'restaurant-orientation');
  assert.equal(ambiguous, null);
  assert.equal(multiple.values.has(scopedKey), false, 'ambiguous legacy data must not be assigned to an organization');
  assert.ok(multiple.values.has(legacyKey), 'ambiguous legacy data must remain available for later review');
});

test('client registration bypasses HTTP cache and delegates one-time reload to activation', () => {
  assert.match(pwaSource, new RegExp(`const ASSET_VERSION = '${version}'`));
  assert.match(pwaSource, /register\(`sw\.js\?v=\$\{ASSET_VERSION\}`[^\n]+updateViaCache: 'none'/);
  assert.doesNotMatch(pwaSource, /controllerchange|location\.reload\(\)/);
});
