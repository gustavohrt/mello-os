(function () {
  "use strict";
  const U = {};
  U.uuid = () => crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 3 | 8)).toString(16); });
  U.now = () => new Date().toISOString();
  U.esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
  U.money = v => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  U.num = v => Number(String(v ?? 0).replace(",", ".")) || 0;
  U.date = v => v ? new Date(v).toLocaleDateString("pt-BR") : "—";
  U.dateTime = v => v ? new Date(v).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";
  U.normalize = v => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  U.debounce = (fn, ms = 180) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  U.download = (name, content, type) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([content], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
  U.statusClass = s => /Entregue|Pronta|Pago|Aprovado/.test(s) ? "good" : /Recusado/.test(s) ? "danger" : /Aguardando|Pendente|Parcial/.test(s) ? "warn" : "";
  U.toast = (message, type = "success") => {
    const el = document.createElement("div"); el.className = "toast " + (type === "error" ? "error" : ""); el.textContent = message;
    document.getElementById("toastRoot").append(el); setTimeout(() => el.remove(), 3400);
  };
  U.modal = ({ title, body, wide = false, saveText = "Salvar", onSave, onOpen }) => {
    const root = document.getElementById("modalRoot");
    root.innerHTML = `<div class="modal-backdrop"><section class="modal ${wide ? "wide" : ""}" role="dialog" aria-modal="true"><header class="modal-head"><h2>${U.esc(title)}</h2><button class="icon-btn" data-close aria-label="Fechar">×</button></header><div class="modal-body">${body}</div><footer class="modal-foot"><button class="btn" data-close>Cancelar</button>${onSave ? `<button class="btn primary" data-save>${U.esc(saveText)}</button>` : ""}</footer></section></div>`;
    const close = () => root.innerHTML = "";
    root.querySelectorAll("[data-close]").forEach(b => b.onclick = close);
    root.querySelector(".modal-backdrop").onclick = e => { if (e.target.classList.contains("modal-backdrop")) close(); };
    if (onSave) root.querySelector("[data-save]").onclick = async () => { try { const ok = await onSave(root); if (ok !== false) close(); } catch (e) { U.toast(e.message || "Não foi possível salvar.", "error"); } };
    document.onkeydown = e => { if (e.key === "Escape" && root.innerHTML) close(); };
    if (onOpen) onOpen(root);
    setTimeout(() => root.querySelector("input,select,textarea")?.focus(), 0);
  };
  U.confirm = (message, onConfirm) => U.modal({ title: "Confirmar ação", body: `<p>${U.esc(message)}</p>`, saveText: "Confirmar", onSave: () => onConfirm() });
  U.formData = root => Object.fromEntries(new FormData(root.querySelector("form")).entries());
  U.fileBase64 = (file, max = 1000000) => new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("Selecione apenas imagens."));
    if (file.size > max) return reject(new Error("A imagem deve ter no máximo 1 MB."));
    const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file);
  });
  U.pageHead = (title, text, actions = "") => `<header class="page-head"><div><h1>${U.esc(title)}</h1><p>${U.esc(text)}</p></div><div class="actions">${actions}</div></header>`;
  U.empty = (title, text) => `<div class="empty"><b>${U.esc(title)}</b>${U.esc(text)}</div>`;
  window.Mello = window.Mello || {}; window.Mello.U = U;
})();
