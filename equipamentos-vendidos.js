(function () {
  "use strict";
  const { U, Store } = window.Mello;
  const collection = "soldEquipment";

  function purchaseDate(value) {
    if (!value) return "—";
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }

  function form(item = {}) {
    return `<form id="soldEquipmentForm" class="form-grid">
      <div class="field"><label for="soldCustomer">Cliente *</label><input id="soldCustomer" name="customerName" required maxlength="120" autocomplete="name" value="${U.esc(item.customerName)}"></div>
      <div class="field"><label for="soldContact">Telefone / WhatsApp</label><input id="soldContact" name="customerContact" type="tel" maxlength="30" autocomplete="tel" value="${U.esc(item.customerContact)}"></div>
      <div class="field"><label for="soldDocument">CPF / CNPJ</label><input id="soldDocument" name="customerDocument" maxlength="20" value="${U.esc(item.customerDocument)}"></div>
      <div class="field"><label for="soldEquipment">Marca e modelo do equipamento *</label><input id="soldEquipment" name="equipment" required maxlength="160" value="${U.esc(item.equipment)}"></div>
      <div class="field"><label for="soldSerial">Número de série *</label><input id="soldSerial" name="serial" required maxlength="100" value="${U.esc(item.serial)}"></div>
      <div class="field"><label for="soldPurchaseDate">Data da compra</label><input id="soldPurchaseDate" name="purchaseDate" type="date" value="${U.esc(item.purchaseDate)}"></div>
      <div class="field full"><label for="soldInk">Tipo de tinta *</label><input id="soldInk" name="inkType" required maxlength="160" value="${U.esc(item.inkType)}"></div>
      <div class="field full"><label for="soldNotes">Observação</label><textarea id="soldNotes" name="notes" maxlength="5000">${U.esc(item.notes)}</textarea></div>
    </form>`;
  }

  function edit(id) {
    const item = id ? Store.get(collection, id) : null;
    if (id && !item) return U.toast("Registro não encontrado.", "error");
    U.modal({
      title: item ? "Editar equipamento vendido" : "Novo equipamento vendido",
      body: form(item || {}),
      onSave(root) {
        const fields = root.querySelector("form");
        if (!fields.reportValidity()) return false;
        const data = U.formData(root);
        for (const key of Object.keys(data)) data[key] = data[key].trim();
        if (!data.customerName || !data.equipment || !data.serial || !data.inkType) throw new Error("Preencha cliente, equipamento, série e tinta.");
        const saved = Store.save(collection, { ...item, ...data, id: item?.id || U.uuid() });
        Store.activity(`${item ? "Equipamento vendido atualizado" : "Equipamento vendido registrado"}: ${saved.equipment} · ${saved.serial}`, "soldEquipment", saved.id);
        Store.persist();
        U.toast(item ? "Registro atualizado." : "Equipamento vendido registrado.");
        window.Mello.App.render();
      }
    });
  }

  function remove(id) {
    const item = Store.get(collection, id);
    if (!item) return;
    U.confirm(`Excluir o registro de ${item.equipment}, série ${item.serial}?`, () => {
      Store.remove(collection, id);
      Store.activity(`Equipamento vendido excluído: ${item.equipment} · ${item.serial}`, "soldEquipment", id);
      Store.persist();
      U.toast("Registro excluído.");
      window.Mello.App.render();
    });
  }

  function render() {
    const rows = Store.all(collection);
    return U.pageHead("Equipamentos vendidos", "Consulte o tipo de tinta de cada equipamento vendido.", `<button class="btn primary" data-sold-new>＋ Adicionar equipamento</button>`) +
      `<div class="card"><div class="toolbar"><input class="field-search" data-sold-search type="search" aria-label="Pesquisar equipamentos vendidos" placeholder="Pesquisar cliente, modelo, série ou tinta…"><span class="badge" data-sold-count>${rows.length} registros</span></div>
      ${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Cliente</th><th>Equipamento</th><th>Nº de série</th><th>Tipo de tinta</th><th>Compra</th><th>Ações</th></tr></thead><tbody>${rows.map(item => `<tr data-sold-row data-search="${U.esc([item.customerName, item.customerContact, item.customerDocument, item.equipment, item.serial, item.inkType, item.notes].join(" ").toLocaleLowerCase("pt-BR"))}"><td><b>${U.esc(item.customerName)}</b><br><small class="muted">${U.esc(item.customerContact || item.customerDocument || "")}</small></td><td>${U.esc(item.equipment)}</td><td>${U.esc(item.serial)}</td><td><span class="badge">${U.esc(item.inkType)}</span></td><td>${purchaseDate(item.purchaseDate)}</td><td><button class="btn small" data-sold-view="${U.esc(item.id)}">Ver</button> <button class="btn small" data-sold-edit="${U.esc(item.id)}">Editar</button> <button class="btn small danger" data-sold-delete="${U.esc(item.id)}">Excluir</button></td></tr>`).join("")}</tbody></table></div><p class="muted" data-sold-empty hidden>Nenhum equipamento corresponde à pesquisa.</p>` : U.empty("Nenhum equipamento vendido", "Adicione o primeiro registro para consultar a tinta no futuro.")}</div>`;
  }

  function detail(id) {
    const item = Store.get(collection, id);
    if (!item) return;
    const line = (label, value) => `<p><b>${label}</b><br>${U.esc(value || "—")}</p>`;
    U.modal({ title: item.equipment, body: `<div class="sold-detail">${line("Cliente", item.customerName)}${line("Telefone / WhatsApp", item.customerContact)}${line("CPF / CNPJ", item.customerDocument)}${line("Número de série", item.serial)}${line("Data da compra", purchaseDate(item.purchaseDate))}${line("Tipo de tinta", item.inkType)}<p><b>Observação</b><br><span class="sold-notes">${U.esc(item.notes || "—")}</span></p></div>` });
  }

  // Delegação mantém os comandos funcionando após cada atualização da tela.
  document.addEventListener("click", event => {
    const button = event.target.closest("[data-sold-new], [data-sold-view], [data-sold-edit], [data-sold-delete]");
    if (!button) return;
    if (button.hasAttribute("data-sold-new")) edit();
    if (button.dataset.soldView) detail(button.dataset.soldView);
    if (button.dataset.soldEdit) edit(button.dataset.soldEdit);
    if (button.dataset.soldDelete) remove(button.dataset.soldDelete);
  });
  document.addEventListener("input", event => {
    if (!event.target.matches("[data-sold-search]")) return;
    const query = event.target.value.trim().toLocaleLowerCase("pt-BR");
    let visible = 0;
    document.querySelectorAll("[data-sold-row]").forEach(row => {
      row.hidden = !row.dataset.search.includes(query);
      if (!row.hidden) visible++;
    });
    document.querySelector("[data-sold-count]").textContent = `${visible} registros`;
    const empty = document.querySelector("[data-sold-empty]");
    if (empty) empty.hidden = visible !== 0;
  });

  window.Mello.SoldEquipment = { render, edit, detail, remove };
})();
