(function () {
  "use strict";
  const { U, Store } = window.Mello;
  const originalReport = window.Mello.PDF.report;

  function deliveryDate(order) {
    return order.deliveryDeadline
      ? U.date(order.deliveryDeadline + "T12:00:00")
      : "Não informado";
  }

  function print(title, body) {
    const settings = Store.snapshot().settings;
    const popup = open("", "_blank");
    if (!popup) return U.toast("Permita pop-ups para gerar o documento.", "error");
    popup.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${U.esc(title)}</title><style>
      @page{size:A4;margin:8mm}*{box-sizing:border-box}body{font:10px/1.3 Arial,sans-serif;color:#17202a;margin:0;padding:12px}.docbar{position:sticky;top:0;z-index:5;display:flex;gap:8px;justify-content:flex-end;padding:10px;margin:-12px -12px 12px;background:#fff;border-bottom:1px solid #ddd}.docbar button{border:0;border-radius:8px;padding:10px 14px;background:#0b4164;color:#fff;font-weight:bold}.docbar .back{background:#333}header{display:flex;justify-content:space-between;gap:14px;border-bottom:2px solid #0b4164;padding-bottom:7px;margin-bottom:9px}.logo{width:155px;max-width:38%;max-height:46px;object-fit:contain}h1{font-size:16px;line-height:1.1;margin:0 0 5px}h2{font-size:11px;line-height:1.2;margin:9px 0 4px;background:#eef4f7;padding:5px 7px;border-left:3px solid #b47a10}p{line-height:1.35;margin:5px 0}.meta{text-align:right;font-size:9px;line-height:1.35}.identity{display:flex;gap:9px;align-items:flex-start}.identity-text{min-width:140px;font-size:9px}table{width:100%;border-collapse:collapse;margin:4px 0}th,td{border:1px solid #d9dee3;padding:4px 5px;text-align:left;vertical-align:top;line-height:1.25}th{background:#f4f6f8}.service-text{white-space:pre-wrap;line-height:1.35;min-height:38px}.total{text-align:right;font-size:12px;margin-top:7px}.deadline{display:inline-block;padding:4px 7px;border-radius:6px;background:#fff4dc;border:1px solid #e6c787}.sign{display:grid;grid-template-columns:1fr 1fr;gap:35px;margin-top:28px}.sign div{border-top:1px solid;text-align:center;padding-top:4px}.foot{margin-top:10px;color:#666;font-size:8px;line-height:1.25}@media(max-width:600px){header{display:block}.meta{text-align:left;margin-top:7px}.identity{display:flex}.logo{max-width:155px;width:38%}}@media print{body{padding:0;font-size:9px}.docbar{display:none}header{break-inside:avoid}h2{break-after:avoid}table,.deadline,.sign{break-inside:avoid}}
    </style></head><body><div class="docbar"><button class="back" onclick="if(window.opener&&!window.opener.closed){window.opener.focus();window.close()}else{location.replace('index.html')}">← Voltar ao sistema</button><button onclick="window.print()">Salvar / Imprimir PDF</button></div>
    <header><div class="identity"><img class="logo" src="${settings.logoBase64 || "logo_mello_informatica.jpg"}" alt="Mello Informática"><div class="identity-text"><b>${U.esc(settings.companyName || "Mello Informática")}</b><br>${U.esc(settings.cnpj || "")}</div></div><div class="meta">${U.esc(settings.phone || "")}<br>${U.esc(settings.whatsapp || "")}<br>${U.esc(settings.address || "")}</div></header>
    ${body}<div class="foot">${U.esc(settings.defaultNotes || "Documento gerado pelo Mello OS.")}</div></body></html>`);
    popup.document.close();
    setTimeout(() => popup.print(), 450);
  }

  function clientBlock(client) {
    return `<h2>Cliente</h2><table><tr><th>Nome / Razão social</th><td>${U.esc(client?.name || "—")}</td></tr><tr><th>CPF / CNPJ</th><td>${U.esc(client?.cpf || client?.cnpj || "—")}</td></tr><tr><th>Telefone / WhatsApp</th><td>${U.esc(client?.phone || "—")} · ${U.esc(client?.whatsapp || "—")}</td></tr><tr><th>E-mail</th><td>${U.esc(client?.email || "—")}</td></tr><tr><th>Endereço</th><td>${U.esc(client?.address || "—")}</td></tr></table>`;
  }

  function order(id) {
    const item = Store.get("orders", id);
    const client = Store.get("clients", item.clientId);
    print(`OS ${item.number}`, `<h1>ORDEM DE SERVIÇO ${item.number}</h1><p><b>Entrada:</b> ${U.dateTime(item.receivedAt)} &nbsp; <b>Status:</b> ${U.esc(item.status)}</p><p class="deadline"><b>Prazo de entrega:</b> ${deliveryDate(item)}</p>${clientBlock(client)}<h2>Equipamento</h2><table><tr><th>Marca</th><th>Modelo</th><th>Serial</th><th>Tinta</th></tr><tr><td>${U.esc(item.brand)}</td><td>${U.esc(item.model)}</td><td>${U.esc(item.serial || "—")}</td><td>${U.esc(item.inkType || "—")}</td></tr></table><table><tr><th>Quantidade de páginas</th><td>${U.esc(item.pageCount || "Não informado")}</td><th>Primeira impressão</th><td>${U.esc(item.firstPrintInfo || "Não informado")}</td></tr><tr><th>Garantia</th><td colspan="3">${U.esc(item.warrantyInfo || "Não informada")}</td></tr></table><p><b>Defeito apresentado:</b><br>${U.esc(item.reportedDefect)}</p><p><b>Acessórios:</b> ${U.esc(item.deliveredAccessories || "—")}</p><h2>Responsáveis e observações</h2><p>Recebido por: ${U.esc(item.receivedBy || "—")} · Técnico: ${U.esc(item.technician || "—")}<br>${U.esc(item.notes || "")}</p><div class="sign"><div>Responsável pela assistência</div><div>Cliente</div></div>`);
  }

  function budget(id) {
    const item = Store.get("budgets", id);
    if (!item) return U.toast("Este orçamento não foi encontrado.", "error");
    const orderItem = Store.get("orders", item.orderId);
    const client = orderItem && Store.get("clients", orderItem.clientId);
    if (!orderItem) return U.toast("A OS vinculada a este orçamento não foi encontrada.", "error");
    const serviceText = item.serviceText || [...(item.services || []), ...(item.parts || [])].map(row => row.description).filter(Boolean).join("\n");
    const baseValue = item.baseValue ?? U.num(item.total) + U.num(item.discount);
    print(`Orçamento ${item.number}`, `<h1>ORÇAMENTO ${item.number}</h1><p><b>OS vinculada:</b> ${orderItem.number} &nbsp; <b>Status:</b> ${U.esc(item.status)}</p>${clientBlock(client)}<h2>Dados completos do equipamento</h2><table><tr><th>Marca</th><th>Modelo</th><th>Serial</th><th>Tinta</th></tr><tr><td>${U.esc(orderItem.brand)}</td><td>${U.esc(orderItem.model)}</td><td>${U.esc(orderItem.serial || "—")}</td><td>${U.esc(orderItem.inkType || "—")}</td></tr><tr><th>Quantidade de páginas</th><td>${U.esc(orderItem.pageCount || "Não informado")}</td><th>Primeira impressão</th><td>${U.esc(orderItem.firstPrintInfo || "Não informado")}</td></tr><tr><th>Defeito informado</th><td colspan="3">${U.esc(orderItem.reportedDefect || "—")}</td></tr><tr><th>Acessórios entregues</th><td colspan="3">${U.esc(orderItem.deliveredAccessories || "—")}</td></tr><tr><th>Prazo informado</th><td>${deliveryDate(orderItem)}</td><th>Status da OS</th><td>${U.esc(orderItem.status)}</td></tr><tr><th>Observações da OS</th><td colspan="3">${U.esc(orderItem.notes || "—")}</td></tr></table><h2>Serviços propostos</h2><div class="service-text">${U.esc(serviceText || "Nenhum serviço informado.")}</div><p class="total">Valor: ${U.money(baseValue)}<br>Desconto: ${U.money(item.discount)}<br><b>Valor final: ${U.money(item.total)}</b></p><p><b>Garantia do orçamento:</b> ${U.esc(item.warranty || "Não informada")}</p>${item.notes?`<h2>Observações do orçamento</h2><div class="service-text">${U.esc(item.notes)}</div>`:""}<div class="sign"><div>Assistência técnica</div><div>Aprovação do cliente</div></div>`);
  }

  function delivery(id) {
    const item = Store.get("orders", id);
    const client = Store.get("clients", item.clientId);
    print(`Entrega ${item.number}`, `<h1>COMPROVANTE DE ENTREGA</h1><p>Confirmamos a entrega do equipamento referente à <b>${item.number}</b>.</p><p class="deadline"><b>Prazo de entrega informado:</b> ${deliveryDate(item)}</p>${clientBlock(client)}<h2>Equipamento</h2><table><tr><th>Equipamento</th><td>${U.esc(item.brand)} ${U.esc(item.model)}</td></tr><tr><th>Serial</th><td>${U.esc(item.serial || "—")}</td></tr><tr><th>Quantidade de páginas</th><td>${U.esc(item.pageCount || "Não informado")}</td></tr><tr><th>Primeira impressão</th><td>${U.esc(item.firstPrintInfo || "Não informado")}</td></tr><tr><th>Garantia</th><td>${U.esc(item.warrantyInfo || "Não informada")}</td></tr><tr><th>Status</th><td>${U.esc(item.status)}</td></tr></table><p>Comprovante emitido em ${new Date().toLocaleString("pt-BR")}.</p><div class="sign"><div>Assistência técnica</div><div>Cliente / responsável</div></div>`);
  }

  window.Mello.PDF = { order, budget, delivery, report: originalReport };
})();
