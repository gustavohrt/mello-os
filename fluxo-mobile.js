(function () {
  "use strict";

  function enhanceOrderDetails() {
    const modal = document.querySelector("#modalRoot .modal");
    const actions = modal?.querySelector("[data-new-budget]")?.closest(".actions");
    if (!actions || actions.querySelector("[data-os-back]")) return;
    actions.classList.add("order-detail-actions");
    const back = document.createElement("button");
    back.type = "button";
    back.className = "btn return-to-list os-detail-back";
    back.dataset.osBack = "";
    back.textContent = "← Voltar para Ordens";
    actions.prepend(back);
    const budget = actions.querySelector("[data-new-budget]");
    if (budget) {
      budget.classList.add("primary");
      budget.textContent = "＋ Criar orçamento desta OS";
    }
  }

  function enhanceOrderRows() {
    document.querySelectorAll("tr").forEach(row => {
      const open = row.querySelector("[data-order-view]");
      const cell = open?.closest("td");
      if (!open || !cell || cell.querySelector("[data-row-budget]")) return;
      const budget = document.createElement("button");
      budget.type = "button";
      budget.className = "btn small";
      budget.dataset.rowBudget = open.dataset.orderView;
      budget.textContent = "Orçamento";
      cell.insertBefore(budget, cell.querySelector("[data-order-delete]"));
      cell.insertBefore(document.createTextNode(" "), budget.nextSibling);
    });
  }

  function enhanceBudgets() {
    document.querySelectorAll("[data-budget-edit]").forEach(button => {
      if (button.dataset.openEnhanced === "true") return;
      button.dataset.openEnhanced = "true";
      button.textContent = "Abrir";
      button.setAttribute("aria-label", "Abrir orçamento");
    });
  }

  function syncBottomNavigation() {
    const current = location.hash.replace("#", "") || "dashboard";
    document.querySelectorAll(".mobile-bottom-nav [data-route]").forEach(button => {
      button.classList.toggle("active", button.dataset.route === current);
      if (button.dataset.route === current) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
  }

  function enhance() {
    enhanceOrderDetails();
    enhanceOrderRows();
    enhanceBudgets();
    syncBottomNavigation();
  }

  document.addEventListener("click", event => {
    const back = event.target.closest("[data-os-back]");
    if (back) {
      document.getElementById("modalRoot").innerHTML = "";
      window.Mello.App.route("ordens");
      return;
    }
    const budget = event.target.closest("[data-row-budget]");
    if (budget) window.Mello.Budgets.edit(null, budget.dataset.rowBudget);
    if (event.target.closest(".mobile-bottom-nav [data-route]")) setTimeout(syncBottomNavigation, 0);
  });

  new MutationObserver(enhance).observe(document.body, { childList: true, subtree: true });
  window.addEventListener("hashchange", syncBottomNavigation);
  enhance();
})();
