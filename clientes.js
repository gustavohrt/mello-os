(function () {
  "use strict";
  const { U, Store } = window.Mello;
  const form = c => `<form class="form-grid">
    <input type="hidden" name="id" value="${U.esc(c?.id || "")}">
    <div class="field"><label>Nome *</label><input name="name" required value="${U.esc(c?.name || "")}"></div>
    <div class="field"><label>CPF</label><input name="cpf" value="${U.esc(c?.cpf || "")}"></div>
    <div class="field"><label>Telefone</label><input name="phone" value="${U.esc(c?.phone || "")}"></div>
    <div class="field"><label>WhatsApp</label><input name="whatsapp" value="${U.esc(c?.whatsapp || "")}"></div>
    <div class="field"><label>E-mail</label><input name="email" type="email" value="${U.esc(c?.email || "")}"></div>
    <div class="field"><label>Endereço</label><input name="address" value="${U.esc(c?.address || "")}"></div>
    <div class="field full"><label>Observações</label><textarea name="notes">${U.esc(c?.notes || "")}</textarea></div>
  </form>`;
  function edit(id) {
    const c = id ? Store.get("clients", id) : null;
    U.modal({ title: c ? "Editar cliente" : "Novo cliente", body: form(c), onSave: root => {
      const d = U.formData(root); if (!d.name.trim()) throw new Error("Informe o nome do cliente.");
      const item = Store.save("clients", { ...c, ...d, id: c?.id || U.uuid() });
      Store.activity(`${c ? "Cliente atualizado" : "Cliente cadastrado"}: ${item.name}`, "client", item.id); Store.persist();
      U.toast("Cliente salvo com sucesso."); window.Mello.App.render();
    } });
  }
  function detail(id) {
    const c = Store.get("clients", id), orders = Store.all("orders").filter(o => o.clientId === id);
    if (!c) return;
    U.modal({ title: c.name, wide: true, body: `<div class="grid"><div class="card span-4"><p><b>Telefone</b><br>${U.esc(c.phone || "—")}</p><p><b>WhatsApp</b><br>${U.esc(c.whatsapp || "—")}</p><p><b>CPF</b><br>${U.esc(c.cpf || "—")}</p><p><b>E-mail</b><br>${U.esc(c.email || "—")}</p><p><b>Endereço</b><br>${U.esc(c.address || "—")}</p><p><b>Observações</b><br>${U.esc(c.notes || "—")}</p></div><div class="card span-8"><div class="card-head"><h2>Histórico de ordens</h2><span class="badge">${orders.length}</span></div>${orders.length ? `<div class="table-wrap"><table><thead><tr><th>OS</th><th>Equipamento</th><th>Status</th><th>Data</th></tr></thead><tbody>${orders.map(o => `<tr data-open-order="${o.id}"><td><b>${o.number}</b></td><td>${U.esc(o.brand)} ${U.esc(o.model)}</td><td><span class="badge ${U.statusClass(o.status)}">${o.status}</span></td><td>${U.date(o.receivedAt)}</td></tr>`).join("")}</tbody></table></div>` : U.empty("Nenhuma ordem", "Este cliente ainda não possui atendimentos.")}</div></div>`, onOpen: root => root.querySelectorAll("[data-open-order]").forEach(x => x.onclick = () => window.Mello.Orders.detail(x.dataset.openOrder)) });
  }
  function remove(id) {
    const c = Store.get("clients", id);
    if (Store.all("orders").some(o => o.clientId === id)) return U.toast("Este cliente possui ordens e não pode ser excluído.", "error");
    U.confirm(`Excluir definitivamente ${c.name}?`, () => { Store.remove("clients", id); Store.activity(`Cliente excluído: ${c.name}`, "client", id); Store.persist(); U.toast("Cliente excluído."); window.Mello.App.render(); });
  }
  function render() {
    const q = (window.Mello.App.state.query || "").toLowerCase();
    const list = Store.all("clients").filter(c => [c.name,c.phone,c.whatsapp,c.cpf,c.email].join(" ").toLowerCase().includes(q));
    return U.pageHead("Clientes", "Cadastros, contatos e histórico completo de atendimento.", `<button class="btn primary" data-action="new-client">＋ Novo cliente</button>`) +
      `<div class="card"><div class="toolbar"><input class="field-search" data-local-search placeholder="Pesquisar clientes…" value="${U.esc(window.Mello.App.state.query || "")}"><span class="badge">${list.length} registros</span></div>${list.length ? `<div class="table-wrap"><table><thead><tr><th>Nome</th><th>Contato</th><th>CPF</th><th>E-mail</th><th>Ações</th></tr></thead><tbody>${list.map(c => `<tr><td><b>${U.esc(c.name)}</b></td><td>${U.esc(c.phone || c.whatsapp || "—")}</td><td>${U.esc(c.cpf || "—")}</td><td>${U.esc(c.email || "—")}</td><td><button class="btn small" data-client-view="${c.id}">Ver</button> <button class="btn small" data-client-edit="${c.id}">Editar</button> <button class="btn small danger" data-client-delete="${c.id}">Excluir</button></td></tr>`).join("")}</tbody></table></div>` : U.empty("Nenhum cliente encontrado", "Cadastre o primeiro cliente para abrir uma ordem.")}</div>`;
  }
  window.Mello.Clients = { render, edit, detail, remove };
})();
