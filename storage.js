(function () {
  "use strict";
  const { U } = window.Mello, KEY = "mello_os_database", PREV = KEY + "_previous";
  const defaults = () => ({
    schemaVersion: 1,
    meta: { createdAt: U.now(), updatedAt: U.now(), nextOrderNumber: 1, lastBackupAt: null },
    settings: { companyName: "Mello Assistência Técnica", logoBase64: "", phone: "", whatsapp: "", instagram: "", address: "", cnpj: "", defaultWarranty: "90 dias", defaultNotes: "", theme: "light", sidebarCollapsed: false },
    clients: [], orders: [], budgets: [], services: [], parts: [], activities: []
  });
  let db;
  function valid(x) { return x && x.schemaVersion === 1 && x.meta && x.settings && ["clients", "orders", "budgets", "services", "parts", "activities"].every(k => Array.isArray(x[k])); }
  function load() {
    try { const x = JSON.parse(localStorage.getItem(KEY)); db = valid(x) ? x : defaults(); }
    catch (_) { db = defaults(); }
    persist(false); return db;
  }
  function persist(emit = true) {
    db.meta.updatedAt = U.now();
    try { localStorage.setItem(KEY, JSON.stringify(db)); }
    catch (_) { throw new Error("O armazenamento local está cheio. Exporte um backup e remova fotos grandes."); }
    if (emit) window.dispatchEvent(new CustomEvent("mello:changed"));
  }
  function all(k) { return db[k]; }
  function get(k, id) { return db[k].find(x => x.id === id); }
  function save(k, item) {
    const i = db[k].findIndex(x => x.id === item.id), value = { ...item, updatedAt: U.now() };
    if (i < 0) db[k].unshift({ ...value, createdAt: value.createdAt || U.now() }); else db[k][i] = value;
    persist(); return value;
  }
  function remove(k, id) { db[k] = db[k].filter(x => x.id !== id); persist(); }
  function activity(label, entityType, entityId) { db.activities.unshift({ id: U.uuid(), label, entityType, entityId, createdAt: U.now() }); db.activities = db.activities.slice(0, 300); }
  function nextOrderNumber() { const n = db.meta.nextOrderNumber++; persist(false); return "OS" + String(n).padStart(6, "0"); }
  function restore(x, emit = true) {
    if (!valid(x)) throw new Error("Este arquivo não é um backup válido do Mello OS.");
    localStorage.setItem(PREV, JSON.stringify(db)); db = JSON.parse(JSON.stringify(x)); persist(emit); return db;
  }
  window.addEventListener("storage", e => { if (e.key === KEY) { load(); U.toast("Dados atualizados por outra aba."); } });
  window.Mello.Store = { load, persist, all, get, save, remove, activity, nextOrderNumber, restore, snapshot: () => JSON.parse(JSON.stringify(db)), defaults };
})();
