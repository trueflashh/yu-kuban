(function () {
  var navToggle = document.getElementById("nav-toggle");
  var header = document.querySelector(".header");
  var table = document.getElementById("price-table");
  var calcMaterial = document.getElementById("calc-material");
  var formMaterial = document.getElementById("form-material");
  var calcForm = document.getElementById("calc");
  var weightInput = document.getElementById("calc-weight");
  var sumEl = document.getElementById("calc-sum");
  var metaEl = document.getElementById("calc-meta");
  var noteEl = document.getElementById("calc-note");
  var orderLink = document.getElementById("calc-order");
  var leadForm = document.getElementById("lead-form");

  document.querySelectorAll(".nav a").forEach(function (link) {
    link.addEventListener("click", function () {
      if (navToggle) navToggle.checked = false;
    });
  });

  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-stuck", window.scrollY > 8);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  function rows() {
    return table ? Array.prototype.slice.call(table.querySelectorAll("tbody tr[data-key]")) : [];
  }

  function fillSelect(select, keepFirst) {
    if (!select) return;
    if (!keepFirst) select.innerHTML = "";
    rows().forEach(function (row) {
      var option = document.createElement("option");
      option.value = row.getAttribute("data-key");
      option.textContent = row.getAttribute("data-name");
      select.appendChild(option);
    });
  }

  fillSelect(calcMaterial, false);
  fillSelect(formMaterial, true);

  function currentMode() {
    var checked = document.querySelector('input[name="mode"]:checked');
    return checked ? checked.value : "self";
  }

  function parseKg(value) {
    var n = Number(String(value || "").replace(",", ".").replace(/\s/g, ""));
    return Number.isFinite(n) ? n : NaN;
  }

  function money(value) {
    return new Intl.NumberFormat("ru-RU").format(Math.round(value)) + " ₽";
  }

  function rowByKey(key) {
    return table ? table.querySelector('tbody tr[data-key="' + key + '"]') : null;
  }

  function rate(row, mode) {
    if (!row) return null;
    var raw = row.getAttribute(mode === "pickup" ? "data-pickup" : "data-self");
    if (raw == null || raw === "") return null;
    return Number(raw);
  }

  function calculate() {
    if (!calcMaterial || !sumEl) return;
    var row = rowByKey(calcMaterial.value);
    var mode = currentMode();
    var kg = parseKg(weightInput && weightInput.value);
    var price = rate(row, mode);
    var name = row ? row.getAttribute("data-name") : "";

    if (!row || price == null) {
      sumEl.textContent = "Только самопривоз";
      metaEl.textContent = name;
      noteEl.textContent = "Эту позицию не вывозим: привезите на пункт или выберите другой материал.";
      return;
    }

    if (!kg || kg <= 0) {
      sumEl.textContent = money(price).replace(" ₽", " ₽/кг");
      metaEl.textContent = name + (mode === "pickup" ? " · вывоз" : " · самопривоз");
      noteEl.textContent = "Введите вес — покажем сумму за партию. Это ориентир до осмотра сырья.";
      return;
    }

    if (kg > 80000) {
      sumEl.textContent = "Проверьте вес";
      metaEl.textContent = "";
      noteEl.textContent = "Похоже на опечатку. Если партия правда крупная — лучше сразу позвонить.";
      return;
    }

    sumEl.textContent = money(kg * price);
    metaEl.textContent = price + " ₽/кг × " + new Intl.NumberFormat("ru-RU").format(kg) + " кг · " + (mode === "pickup" ? "вывоз" : "самопривоз");

    if (mode === "pickup" && kg < 300) {
      noteEl.textContent = "Это оплата за сырьё. Бесплатный вывоз по Краснодару — от 300 кг. Меньшую партию либо привезите сами (ставка выше), либо согласуем рейс до выезда.";
    } else if (mode === "pickup") {
      noteEl.textContent = "Для такого объёма вывоз по Краснодару бесплатный. Итог подтвердим на весах: сухая и разобранная партия идёт по верхней ставке.";
    } else if (kg < 5) {
      noteEl.textContent = "На пункт принимаем от 5 кг. Наберите чуть больше или объедините с другой партией.";
    } else {
      noteEl.textContent = "Самопривоз дороже вывоза. Сумму фиксируем после взвешивания при вас.";
    }
  }

  if (calcForm) {
    calcForm.addEventListener("input", calculate);
    calcForm.addEventListener("change", calculate);
    calcForm.addEventListener("submit", function (event) {
      event.preventDefault();
      calculate();
    });
  }

  document.querySelectorAll("[data-kg]").forEach(function (button) {
    button.addEventListener("click", function () {
      if (!weightInput) return;
      weightInput.value = button.getAttribute("data-kg");
      calculate();
    });
  });

  if (orderLink) {
    orderLink.addEventListener("click", function () {
      var material = document.getElementById("form-material");
      var formWeight = document.getElementById("form-weight");
      var mode = currentMode();
      var method = document.querySelector('input[name="method"][value="' + mode + '"]');
      if (material && calcMaterial.value) material.value = calcMaterial.value;
      if (method) method.checked = true;
      if (formWeight && weightInput && weightInput.value) formWeight.value = weightInput.value;
    });
  }

  calculate();

  var mapBoard = document.querySelector(".map-board");
  if (mapBoard) {
    var zoneNodes = mapBoard.querySelectorAll("[data-zone]");
    function paintZone(name) {
      zoneNodes.forEach(function (node) {
        node.classList.toggle("is-active", node.getAttribute("data-zone") === name);
      });
    }
    zoneNodes.forEach(function (node) {
      node.addEventListener("mouseenter", function () { paintZone(node.getAttribute("data-zone")); });
      node.addEventListener("mouseleave", function () { paintZone(""); });
      node.addEventListener("focus", function () { paintZone(node.getAttribute("data-zone")); });
      node.addEventListener("blur", function () { paintZone(""); });
    });
  }

  if (!leadForm) return;

  var errorEl = document.getElementById("form-error");
  var okEl = document.getElementById("form-ok");
  var summaryEl = document.getElementById("form-summary");
  var hintEl = document.getElementById("form-max-hint");
  var copyBtn = document.getElementById("form-copy");
  var lastText = "";

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return false; });
    }
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
    document.body.removeChild(area);
    return Promise.resolve(ok);
  }

  function showReady(copied) {
    if (summaryEl) summaryEl.textContent = lastText;
    if (hintEl) {
      hintEl.textContent = copied
        ? "Текст скопирован. Позвоните и продиктуйте заявку или отправьте её, когда появится мессенджер."
        : "Позвоните и продиктуйте текст ниже.";
    }
    leadForm.hidden = true;
    if (okEl) okEl.hidden = false;
  }

  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      if (!lastText) return;
      copyText(lastText).then(showReady);
    });
  }

  leadForm.addEventListener("submit", function (event) {
    event.preventDefault();
    if (errorEl) errorEl.textContent = "";

    var honey = leadForm.querySelector('input[name="company"]');
    if (honey && honey.value) return;

    var data = new FormData(leadForm);
    var name = String(data.get("name") || "").trim();
    var phone = String(data.get("phone") || "").trim();
    var digits = phone.replace(/\D/g, "");

    if (name.length < 2) {
      if (errorEl) errorEl.textContent = "Напишите, как к вам обращаться.";
      return;
    }
    if (digits.length < 10) {
      if (errorEl) errorEl.textContent = "Проверьте телефон: нужно минимум 10 цифр.";
      return;
    }

    var materialSelect = document.getElementById("form-material");
    var materialText = materialSelect ? materialSelect.options[materialSelect.selectedIndex].text : "";
    var method = data.get("method") === "pickup" ? "вывоз" : "самопривоз";
    var lines = [
      "Здравствуйте! Заявка с сайта ООО «Ю-КУБАНЬ».",
      "Имя: " + name,
      "Телефон: " + phone,
      "Материал: " + materialText,
      "Способ: " + method
    ];
    var weight = String(data.get("weight") || "").trim();
    var place = String(data.get("place") || "").trim();
    var comment = String(data.get("comment") || "").trim();
    if (weight) lines.push("Примерный вес, кг: " + weight);
    if (place) lines.push("Адрес или район: " + place);
    if (comment) lines.push("Комментарий: " + comment);

    lastText = lines.join("\n");
    copyText(lastText).then(showReady);
  });
})();
