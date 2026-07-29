(function () {
  "use strict";
  const { U, Store } = window.Mello;
  const original = window.Mello.Budgets;

  function previousText(budget) {
    if (budget?.serviceText) return budget.serviceText;
    return [...(budget?.services || []), ...(budget?.parts || [])]
      .map(item => item.description).filter(Boolean).join("\n");
  }

  function form(budget, orderId) {
    const orders = Store.all("orders");
    const baseValue = budget?.baseValue ?? U.num(budget?.total) + U.num(budget?.discount);
    return `<form class="form-grid simple-budget-form">
      <div class="field full mobile-return-row"><button type="button" class="btn return-to-list" data-close>← Voltar para Orçamentos</button></div>
      <div class="field"><label>Ordem *</label><select name="orderId" required><option value="">Selecione</option>${orders.map(order => `<option value="${order.id}" ${(budget?.orderId || orderId) === order.id ? "selected" : ""}>${order.number} · ${U.esc(order.brand)} ${U.esc(order.model)}</option>`).join("")}</select></div>
      <div class="field"><label>Status</label><select name="status">${["Pendente", "Aprovado", "Recusado"].map(status => `<option ${budget?.status === status ? "selected" : ""}>${status}</option>`).join("")}</select></div>
      <div class="field full"><label>Serviços *</label><textarea class="services-free-text" name="serviceText" required placeholder="Digite cada serviço em uma linha. Use Enter, espaços e linhas em branco como preferir.">${U.esc(previousText(budget))}</textarea><small class="muted">Campo livre para personalizar sua lista usando o teclado.</small></div>
      <div class="field"><label>Valor</label><input name="baseValue" type="number" min="0" step=".01" value="${baseValue}"></div>
      <div class="field"><label>Desconto</label><input name="discount" type="number" min="0" step=".01" value="${budget?.discount || 0}"></div>
      <div class="field full"><label>Garantia do orçamento</label><input name="warranty" placeholder="Ex.: 30 dias somente para o serviço realizado" value="${U.esc(budget?.warranty || "")}"><small class="muted">Escreva a garantia exatamente como deseja que apareça no PDF.</small></div>
      <div class="field full"><label>Observações do orçamento</label><textarea name="notes" placeholder="Ex.: Orçamento válido por 10 dias. A demora na autorização pode causar novo entupimento do cabeçote.">${U.esc(budget?.notes || "")}</textarea><small class="muted">Este texto aparecerá no PDF exatamente como foi digitado.</small></div>
      <div class="field full"><div class="simple-budget-total"><span>Valor final</span><strong data-simple-total>${U.money(Math.max(0, baseValue - U.num(budget?.discount)))}</strong></div></div>
    </form>`;
  }

  function edit(id, orderId) {
    const budget = id ? Store.get("budgets", id) : null;
    U.modal({
      title: budget ? `Editar ${budget.number}` : "Novo orçamento",
      body: form(budget, orderId),
      wide: true,
      onOpen: root => {
        const calculate = () => {
          const value = U.num(root.querySelector("[name=baseValue]").value);
          const discount = U.num(root.querySelector("[name=discount]").value);
          root.querySelector("[data-simple-total]").textContent = U.money(Math.max(0, value - discount));
        };
        root.querySelector("[name=baseValue]").oninput = calculate;
        root.querySelector("[name=discount]").oninput = calculate;
      },
      onSave: root => {
        const formElement = root.querySelector("form");
        if (!formElement.reportValidity()) return false;
        const data = Object.fromEntries(new FormData(formElement).entries());
        const serviceText = data.serviceText.trim();
        const baseValue = Math.max(0, U.num(data.baseValue));
        const discount = Math.max(0, U.num(data.discount));
        const total = Math.max(0, baseValue - discount);
        const services = [{ id: U.uuid(), catalogId: "", description: serviceText, quantity: 1, unitPrice: baseValue, subtotal: baseValue }];
        const item = { ...budget, id: budget?.id || U.uuid(), number: budget?.number || "ORC-" + String(Date.now()).slice(-7), orderId: data.orderId, status: data.status, serviceText, baseValue, services, parts: [], discount, total, warranty: data.warranty.trim(), notes: data.notes.trim() };
        Store.save("budgets", item);
        const order = Store.get("orders", data.orderId);
        if (order) {
          order.timeline.push({ id: U.uuid(), type: "budget", title: `Orçamento ${data.status.toLowerCase()}`, description: `${item.number} · ${U.money(total)}`, createdAt: U.now() });
          if (data.status === "Pendente" && order.status === "Aguardando orçamento") order.status = "Aguardando aprovação";
          Store.save("orders", order);
        }
        Store.activity(`Orçamento salvo: ${item.number}`, "budget", item.id);
        Store.persist();
        U.toast("Orçamento salvo.");
        window.Mello.App.route("orcamentos");
        return true;
      }
    });
  }

  window.Mello.Budgets = { ...original, edit };
})();
