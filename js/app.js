(() => {
  "use strict";

  const { families, colors, outOfStock } = window.CATALOG;

  const thumbSrc = n => `images/thumbs/${n}.webp`; // 480x360, untuk grid
  const fullSrc = n => `images/${n}.jpg`;          // 1024px, untuk popup

  const $ = id => document.getElementById(id);
  const html = str => {
    const t = document.createElement("template");
    t.innerHTML = str.trim();
    return t.content.firstElementChild;
  };

  // Kecerahan HSL (0..1), untuk mengurutkan terang -> gelap dalam satu palet
  const lightness = hex => {
    const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
    return (Math.max(...rgb) + Math.min(...rgb)) / 510;
  };

  /* ---------- Data ---------- */
  const famOrder = new Map(families.map((f, i) => [f.id, i]));
  const soldOut = new Set(outOfStock);

  const items = colors
    .map(([n, name, hex, fam]) => ({ n, name, hex, fam, out: soldOut.has(n), light: lightness(hex) }))
    .sort((a, b) => famOrder.get(a.fam) - famOrder.get(b.fam) || b.light - a.light);

  const byNumber = [...items].sort((a, b) => a.n - b.n);
  const itemByN = new Map(items.map(it => [it.n, it]));

  const ui = {
    ribbon: $("ribbon"),
    toolbar: $("toolbar"),
    search: $("search"),
    sort: $("sort"),
    count: $("count"),
    chips: $("chips"),
    chipsPrev: $("chips-prev"),
    chipsNext: $("chips-next"),
    main: $("main"),
    empty: $("empty"),
    reset: $("reset"),
    modal: $("modal"),
    modalImg: $("modal-img"),
    modalFam: $("modal-fam"),
    modalName: $("modal-name"),
    modalNum: $("modal-num"),
    modalStock: $("modal-stock"),
    modalHex: $("modal-hex"),
    modalRelated: $("modal-related"),
    copy: $("copy"),
    close: $("modal-close"),
  };

  /* ---------- Template ---------- */
  const cardTpl = it => `
    <button type="button" data-n="${it.n}" style="--c:${it.hex}"
      class="group flex flex-col rounded-3xl bg-white p-2 text-left shadow-sm ring-1 ring-ink/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-ink/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
      <span class="relative block overflow-hidden rounded-2xl bg-(--c)/20">
        <img src="${thumbSrc(it.n)}" alt="${it.name}" width="480" height="360" loading="lazy" decoding="async"
          class="aspect-4/3 w-full object-cover transition duration-500 group-hover:scale-105 ${it.out ? "opacity-60 grayscale" : ""}">
        <span class="absolute top-2 right-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-ink tabular-nums shadow-sm backdrop-blur">No. ${it.n}</span>
        ${it.out ? '<span class="absolute top-2 left-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-red-700 shadow-sm backdrop-blur">Stok habis</span>' : ""}
      </span>
      <span class="flex items-center gap-2 px-2 pt-2.5 pb-1.5">
        <span class="size-4 shrink-0 rounded-full bg-(--c) shadow-inner ring-1 ring-black/10 ring-inset"></span>
        <span class="min-w-0 flex-1 truncate text-sm font-semibold capitalize">${it.name}</span>
      </span>
    </button>`;

  const sectionTpl = f => `
    <section class="pt-12">
      <div class="mb-5 flex items-end justify-between gap-4 border-b border-ink/10 pb-4">
        <div>
          <h2 class="font-serif text-2xl font-medium tracking-tight sm:text-3xl">${f.label}</h2>
          <p class="mt-1 text-sm text-ink-soft"><span data-count></span> warna</p>
        </div>
        <div data-strip class="flex h-2.5 w-28 overflow-hidden rounded-full sm:w-48"></div>
      </div>
      <div data-grid class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5"></div>
    </section>`;

  const chipTpl = (id, label, total, dots) => `
    <button type="button" data-fam="${id}" aria-pressed="${id === "all"}"
      class="flex shrink-0 items-center gap-1.5 rounded-full bg-white py-1 pr-2.5 pl-1 text-[13px] font-medium whitespace-nowrap shadow-sm ring-1 ring-ink/10 transition hover:ring-ink/25 aria-pressed:bg-ink aria-pressed:text-oat-50 aria-pressed:ring-ink">
      <span class="flex -space-x-1">${dots}</span>
      ${label}
      <span class="text-[11px] tabular-nums opacity-50">${total}</span>
    </button>`;

  const dot = bg => `<span class="size-4 rounded-full ring-[1.5px] ring-white" style="background:${bg}"></span>`;

  /* ---------- Bangun DOM sekali; setelah itu cukup show/hide & pindah node ---------- */
  for (const it of items) {
    it.card = html(cardTpl(it));
    it.swatch = html(`<span class="flex-1" style="background:${it.hex}"></span>`);
    ui.ribbon.append(html(`
      <button type="button" data-n="${it.n}" title="${it.n}. ${it.name}" aria-label="${it.n}. ${it.name}" style="--c:${it.hex}"
        class="h-3/5 min-w-0 flex-1 rounded-full bg-(--c) ring-1 ring-black/5 transition-all duration-300 ring-inset hover:h-full focus-visible:h-full focus-visible:outline-none"></button>`));
  }

  const groups = families.map(f => {
    const members = items.filter(it => it.fam === f.id);
    const section = html(sectionTpl(f));
    section.querySelector("[data-strip]").append(...members.map(it => it.swatch));
    ui.main.insertBefore(section, ui.empty);
    return {
      ...f,
      members,
      section,
      grid: section.querySelector("[data-grid]"),
      countEl: section.querySelector("[data-count]"),
    };
  });

  const numberSection = html(`<section class="pt-12"><div class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5"></div></section>`);
  const numberGrid = numberSection.firstElementChild;
  ui.main.insertBefore(numberSection, ui.empty);

  // Chip: "Semua" pakai lingkaran pelangi, tiap palet pakai 3 warna khasnya
  const pick = list => [0, list.length >> 1, list.length - 1].map(i => list[i].hex);
  ui.chips.append(
    html(chipTpl("all", "Semua", items.length, dot(`conic-gradient(${items.map(it => it.hex).join(",")})`))),
    ...groups.map(g => html(chipTpl(g.id, g.label, g.members.length, pick(g.members).map(dot).join("")))),
  );

  /* ---------- State & render ---------- */
  const state = { fam: "all", query: "", sort: "palette" };

  const matches = it =>
    (state.fam === "all" || it.fam === state.fam) &&
    (!state.query || it.name.includes(state.query) || String(it.n) === state.query);

  function layout() {
    const palette = state.sort === "palette";
    if (palette) groups.forEach(g => g.grid.append(...g.members.map(it => it.card)));
    else numberGrid.append(...byNumber.map(it => it.card));
    filter();
  }

  function filter() {
    const palette = state.sort === "palette";
    let total = 0;

    for (const g of groups) {
      let shown = 0;
      for (const it of g.members) {
        const ok = matches(it);
        it.card.hidden = it.swatch.hidden = !ok;
        shown += ok;
      }
      g.countEl.textContent = shown;
      g.section.hidden = !palette || !shown;
      total += shown;
    }

    numberSection.hidden = palette || !total;
    ui.empty.hidden = total > 0;
    ui.count.textContent = total === items.length ? total : `${total}/${items.length}`;
  }

  // Kalau sudah scroll melewati hero, kembali ke awal grid setelah filter berubah
  function scrollToGrid() {
    const top = ui.main.getBoundingClientRect().top + scrollY - ui.toolbar.offsetHeight;
    if (scrollY > top) scrollTo({ top, behavior: "smooth" });
  }

  function setFamily(fam) {
    state.fam = fam;
    for (const c of ui.chips.children) c.setAttribute("aria-pressed", c.dataset.fam === fam);
    filter();
  }

  /* ---------- Popup ---------- */
  let current = null;

  function openDetail(it) {
    current = it;
    ui.modal.style.setProperty("--c", it.hex);
    ui.modalFam.textContent = groups[famOrder.get(it.fam)].label;
    ui.modalName.textContent = it.name;
    ui.modalNum.textContent = `No. ${it.n}`;
    ui.modalStock.hidden = !it.out;
    ui.modalHex.textContent = it.hex;
    ui.copy.textContent = "Salin";

    // Thumbnail (sudah di cache) tampil duluan, lalu diganti foto resolusi penuh
    ui.modalImg.src = thumbSrc(it.n);
    ui.modalImg.alt = it.name;
    const hd = new Image();
    hd.onload = () => { if (current === it) ui.modalImg.src = hd.src; };
    hd.src = fullSrc(it.n);

    ui.modalRelated.replaceChildren(...groups[famOrder.get(it.fam)].members.map(m => html(`
      <button type="button" data-n="${m.n}" title="${m.n}. ${m.name}" aria-label="${m.n}. ${m.name}" ${m === it ? 'aria-current="true"' : ""}
        class="aspect-square rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-oat-50 transition hover:scale-110 aria-current:ring-ink"
        style="background:${m.hex}"></button>`)));

    if (!ui.modal.open) ui.modal.showModal();
  }

  /* ---------- Events ---------- */
  ui.search.addEventListener("input", () => {
    state.query = ui.search.value.trim().toLowerCase();
    filter();
  });

  ui.sort.addEventListener("click", e => {
    const b = e.target.closest("[data-sort]");
    if (!b || b.dataset.sort === state.sort) return;
    state.sort = b.dataset.sort;
    for (const r of ui.sort.children) r.setAttribute("aria-checked", r === b);
    layout();
  });

  ui.chips.addEventListener("click", e => {
    const b = e.target.closest("[data-fam]");
    if (!b) return;
    setFamily(b.dataset.fam);
    revealChip(b);
    scrollToGrid();
  });

  /* ---------- Geser chip palet ---------- */
  const EDGE = 56; // lebar area tombol panah

  // Panah hanya muncul kalau masih ada chip tersembunyi di sisi itu
  function updateChipArrows() {
    const c = ui.chips;
    ui.chipsPrev.hidden = c.scrollLeft <= 1;
    ui.chipsNext.hidden = c.scrollLeft >= c.scrollWidth - c.clientWidth - 1;
  }

  // Geser supaya chip yang dipilih tidak tertutup panah
  function revealChip(b) {
    const c = ui.chips.getBoundingClientRect();
    const r = b.getBoundingClientRect();
    if (r.left < c.left + EDGE) ui.chips.scrollBy({ left: r.left - c.left - EDGE, behavior: "smooth" });
    else if (r.right > c.right - EDGE) ui.chips.scrollBy({ left: r.right - c.right + EDGE, behavior: "smooth" });
  }

  const pageBy = dir => ui.chips.scrollBy({ left: dir * ui.chips.clientWidth * 0.7, behavior: "smooth" });
  ui.chipsPrev.addEventListener("click", () => pageBy(-1));
  ui.chipsNext.addEventListener("click", () => pageBy(1));

  // Roda mouse vertikal -> geser horizontal
  ui.chips.addEventListener("wheel", e => {
    const c = ui.chips;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || c.scrollWidth <= c.clientWidth) return;
    e.preventDefault();
    c.scrollBy({ left: e.deltaY * (e.deltaMode === 1 ? 16 : 1), behavior: "instant" });
  }, { passive: false });

  ui.chips.addEventListener("scroll", updateChipArrows, { passive: true });
  new ResizeObserver(updateChipArrows).observe(ui.chips);
  document.fonts?.ready.then(updateChipArrows);

  ui.reset.addEventListener("click", () => {
    ui.search.value = state.query = "";
    setFamily("all");
  });

  // Kartu, pita warna & warna senada semuanya membuka detail
  for (const area of [ui.main, ui.ribbon, ui.modalRelated]) {
    area.addEventListener("click", e => {
      const b = e.target.closest("[data-n]");
      if (b) openDetail(itemByN.get(+b.dataset.n));
    });
  }

  ui.copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(current.hex.toUpperCase());
      ui.copy.textContent = "Tersalin ✓";
    } catch {
      ui.copy.textContent = "Gagal";
    }
  });

  ui.close.addEventListener("click", () => ui.modal.close());
  // Klik di luar kotak popup (backdrop) menutup; Esc sudah ditangani <dialog>
  ui.modal.addEventListener("click", e => { if (e.target === ui.modal) ui.modal.close(); });

  layout();
})();
