/*
 * DGM TRAINING HUB — MASTER DATA CONNECTOR  (hub-master.js)
 * ------------------------------------------------------------
 * Lấy danh mục sản phẩm, thành phần, dị ứng, dinh dưỡng, claim và chứng chỉ
 * từ Google Sheet DGM_Hub_Master. Master data là nguồn duy nhất: dữ liệu cũ
 * gõ cứng trong index.html sẽ KHÔNG hiển thị nữa.
 *
 * Cài: thêm 1 dòng vào index.html, ngay TRƯỚC dòng nạp quiz/quiz.js:
 *      <script src="hub-master.js"> + thẻ đóng script
 * rồi dán Web app URL của HubMaster.gs vào MASTER_API bên dưới.
 *
 * Áp dụng cho: SKU Directory · Thành phần & Claim · Chứng nhận (tab Thương hiệu)
 *              · ô thống kê "SKU tại Việt Nam".
 * Ô nào master còn trống → hub hiện "Chưa cập nhật" + chừa vị trí ảnh/logo.
 */
(function () {
  'use strict';

  const MASTER_API = 'https://script.google.com/macros/s/AKfycbxoXc3brFRGVACj8yH9oTDxzp8UtIx1Ly82eEQTU2QaU5XHoUMUqddg9r-Mf-u-fxku/exec';
  const LS_KEY = 'dgm_hub_master_v1';

  let M = null;             // dữ liệu master
  let state = 'loading';    // loading | live | cached | error | noapi
  let stateNote = '';

  /* ───────── helpers ───────── */
  const lang = () => (typeof currentLang !== 'undefined' ? currentLang : 'vi');
  const t = (vi, en) => (lang() === 'en' ? en : vi);
  const E = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const PH = () => `<span class="hm-ph">${t('Chưa cập nhật', 'Not yet updated')}</span>`;
  const val = (vi, en) => {
    const v = lang() === 'en' ? (en || vi) : (vi || en);
    return v ? E(v) : PH();
  };
  const GROUP = {
    dau: { vi: '🫘 Đậu & Rau quả', en: '🫘 Beans & Veg', ic: '🫘' },
    ca: { vi: '🐟 Cá', en: '🐟 Fish', ic: '🐟' },
    dua: { vi: '🥥 Dừa', en: '🥥 Coconut', ic: '🥥' },
    sot: { vi: '🌶️ Sốt', en: '🌶️ Sauce', ic: '🌶️' },
    huuco: { vi: '🌿 Hữu cơ', en: '🌿 Organic', ic: '🌿' }
  };
  const ORIGIN = {
    'viet nam': ['o-vn', '🇻🇳'], 'vietnam': ['o-vn', '🇻🇳'], 'malaysia': ['o-my', '🇲🇾'],
    'thailand': ['o-th', '🇹🇭'], 'indonesia': ['o-id', '🇮🇩'], 'italy': ['o-it', '🇮🇹']
  };
  const certById = id => (M && M.certs || []).find(c => c.cert_id === id);

  // Link chia sẻ Google Drive → link ảnh hiển thị được
  function fixUrl(u) {
    u = String(u || '').trim();
    const m = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{20,})/);
    return m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w600` : u;
  }
  function imgSlot(url, icon, cls) {
    url = fixUrl(url);
    return url
      ? `<img class="${cls}" src="${E(url)}" alt="" loading="lazy" onerror="this.outerHTML='<div class=&quot;${cls} hm-slot&quot;>${icon}</div>'"/>`
      : `<div class="${cls} hm-slot" title="${t('Chưa có ảnh', 'No image yet')}">${icon}</div>`;
  }
  function originBadge(p) {
    const o = ORIGIN[String(p.origin_key || '').toLowerCase()] || ['', '🌍'];
    const name = t(p.origin_vi, p.origin_en) || p.origin_key;
    return name ? `<span class="origin-badge ${o[0]}">${o[1]} ${E(name)}</span>` : PH();
  }
  function packText(p) {
    const parts = [];
    if (p.net_content) parts.push(`${E(p.net_content)}${E(p.unit)}`);
    if (p.case_qty) parts.push(`${E(p.case_qty)}/${t('thùng', 'case')}`);
    if (p.drained_g) parts.push(`${t('cái', 'drained')} ${E(p.drained_g)}g`);
    return parts.length ? parts.join(' · ') : PH();
  }

  /* ───────── CSS ───────── */
  const css = document.createElement('style');
  css.textContent = `
  .hm-ph{color:#b0b0b0;font-style:italic;font-size:11.5px;}
  .hm-slot{display:flex;align-items:center;justify-content:center;border:1.5px dashed #cfd6de;background:#f7f9fb;color:#b8c1cc;}
  .hm-thumb{width:40px;height:40px;border-radius:8px;object-fit:contain;font-size:18px;background:#fff;}
  .hm-pimg{width:72px;height:72px;border-radius:10px;object-fit:contain;flex-shrink:0;font-size:30px;background:#fff;}
  .hm-logo{width:36px;height:36px;border-radius:50%;object-fit:contain;flex-shrink:0;font-size:16px;background:#fff;}
  .hm-logo-sm{width:22px;height:22px;border-radius:50%;object-fit:contain;flex-shrink:0;font-size:11px;background:#fff;}
  .hm-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 12px;font-size:12px;color:var(--teal);}
  .hm-bar button{background:var(--teal);color:#fff;border:none;border-radius:8px;padding:5px 12px;font-size:12px;font-weight:700;cursor:pointer;}
  .hm-bar button:hover{background:var(--navy);}
  .hm-bar .err{color:var(--orange);}
  .hm-sub{font-size:11px;color:#999;}
  .hm-head{display:flex;gap:12px;align-items:flex-start;}
  .hm-meta{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px;}
  .hm-meta span{font-size:10.5px;background:#f1f4f7;color:var(--gray);padding:2px 8px;border-radius:10px;}
  .hm-nip{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:4px;}
  .hm-nip div{background:#f8fafc;border-radius:8px;padding:6px 4px;text-align:center;}
  .hm-nip b{display:block;font-size:13px;color:var(--navy);}
  .hm-nip small{font-size:10px;color:#888;}
  .hm-chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:4px;align-items:center;}
  .hm-chip{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;padding:3px 9px;border-radius:20px;}
  .hm-chip.claim{background:#e8f5e9;color:#1B5E20;}
  .hm-chip.alg{background:#fff3e0;color:#E65100;}
  .hm-chip.alg.may{background:#fffde7;color:#8d6e00;}
  .hm-chip.cert{background:#e8eaf6;color:#283593;padding:3px 9px 3px 3px;}
  .hm-chip.pend{background:#f3f3f3;color:#888;}
  .hm-certs{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;margin-top:10px;}
  .hm-cert{display:flex;gap:10px;align-items:flex-start;background:var(--cream);border:1.5px solid #ddd;border-radius:10px;padding:12px;}
  .hm-cert strong{display:block;color:var(--navy);font-size:13px;}
  .hm-cert .no{font-size:11px;color:var(--teal);font-weight:700;margin-top:3px;}
  .hm-cert .vd{font-size:11px;color:var(--green);font-weight:600;}
  .hm-cert .sc{font-size:10.5px;color:#888;margin-top:2px;}
  .hm-empty{text-align:center;padding:26px;color:#999;font-size:13px;}
  table.sku td .hm-sub{display:block;}
  `;
  document.head.appendChild(css);

  /* ───────── status bar ───────── */
  function barHTML() {
    let msg = '';
    if (state === 'loading') msg = `<span class="spinner" style="border-color:rgba(47,120,152,.3);border-top-color:var(--teal)"></span>${t('Đang tải master data…', 'Loading master data…')}`;
    else if (state === 'live') msg = `✅ ${t('Master data', 'Master data')} · ${M.count} SKU · ${new Date(M.updated).toLocaleString('vi-VN')}`;
    else if (state === 'cached') msg = `<span class="err">⚠️ ${t('Không kết nối được master — đang hiện bản lưu lúc', 'Cannot reach master — showing copy saved at')} ${new Date(M.updated).toLocaleString('vi-VN')}</span>`;
    else if (state === 'noapi') msg = `<span class="err">⚠️ ${t('Chưa cấu hình MASTER_API trong hub-master.js', 'MASTER_API not configured in hub-master.js')}</span>`;
    else msg = `<span class="err">⚠️ ${t('Lỗi tải master data', 'Master data error')}: ${E(stateNote)}</span>`;
    return `<button onclick="HubMaster.reload()">🔄 ${t('Cập nhật', 'Refresh')}</button><span>${msg}</span>`;
  }
  function ensureBar(moduleId, beforeSel) {
    const mod = document.getElementById(moduleId);
    if (!mod) return;
    let bar = mod.querySelector('.hm-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'hm-bar';
      const anchor = mod.querySelector(beforeSel);
      anchor.parentNode.insertBefore(bar, anchor);
    }
    bar.innerHTML = barHTML();
  }
  function emptyState() {
    if (state === 'loading') return t('Đang tải dữ liệu…', 'Loading…');
    return t('Chưa có dữ liệu master.', 'No master data available.');
  }

  /* ───────── SKU DIRECTORY ───────── */
  function renderSKU() {
    ensureBar('m-sku', '#skuSearch');
    const thead = document.querySelector('#skuTable thead');
    thead.innerHTML = `<tr><th>#</th><th>${t('Ảnh', 'Image')}</th><th>${t('Tên sản phẩm', 'Product')}</th>
      <th>${t('Nhóm', 'Category')}</th><th>${t('Quy cách', 'Pack')}</th><th>${t('Xuất xứ', 'Origin')}</th>
      <th>${t('HSD', 'Shelf life')}</th><th>${t('Bao bì', 'Packaging')}</th><th>${t('Số tự công bố', 'Declaration no.')}</th></tr>`;
    const body = document.getElementById('skuBody');
    if (!M) { body.innerHTML = `<tr><td colspan="9" class="hm-empty">${emptyState()}</td></tr>`; return; }
    const q = (document.getElementById('skuSearch').value || '').toLowerCase();
    const f = typeof skuFilter !== 'undefined' ? skuFilter : 'all';
    const rows = M.products.filter(p => (f === 'all' || p.group === f) &&
      (!q || [p.sku_id, p.brand, p.name_vi, p.name_en, p.category_vi, p.category_en, p.origin_vi, p.declaration_no]
        .join(' ').toLowerCase().includes(q)));
    if (!rows.length) { body.innerHTML = `<tr><td colspan="9" class="hm-empty">${t('Không tìm thấy sản phẩm.', 'No matching product.')}</td></tr>`; return; }
    body.innerHTML = rows.map((p, i) => `<tr>
      <td>${i + 1}</td>
      <td>${imgSlot(p.image_url, (GROUP[p.group] || {}).ic || '📦', 'hm-thumb')}</td>
      <td><b>${val(p.name_vi, p.name_en)}</b><span class="hm-sub">${E(p.brand)} · ${E(p.sku_id)}</span></td>
      <td>${val(p.category_vi, p.category_en)}</td>
      <td>${packText(p)}</td>
      <td>${originBadge(p)}</td>
      <td>${p.shelf_life_months ? E(p.shelf_life_months) + t(' tháng', ' mo') : PH()}</td>
      <td>${val(p.packaging_vi, p.packaging_en)}</td>
      <td style="font-size:11px">${p.declaration_no ? E(p.declaration_no) : PH()}</td>
    </tr>`).join('');
  }

  /* ───────── THÀNH PHẦN & CLAIM ───────── */
  function ingText(p) {
    if (!p.ingredients.length) return PH();
    return p.ingredients.map(i => {
      const n = lang() === 'en' ? (i.en || i.vi) : (i.vi || i.en);
      return E(n) + (i.pct ? ` (${E(i.pct)})` : '');
    }).join(', ');
  }
  function allergenHTML(p) {
    const chips = p.allergens.map(a => {
      const may = /may/i.test(a.type || '');
      const lbl = may ? t('Có thể chứa', 'May contain') : t('Chứa', 'Contains');
      return `<span class="hm-chip alg${may ? ' may' : ''}">⚠️ ${lbl}: ${E(t(a.vi, a.en) || a.code)}</span>`;
    });
    if (p.allergens_pending) chips.push(`<span class="hm-chip pend">⏳ ${t('Đang xác minh', 'Under verification')} (${p.allergens_pending})</span>`);
    if (!chips.length) return `<span class="hm-chip claim">✅ ${t('Không phát hiện chất gây dị ứng trong thành phần', 'No allergens found in ingredients')}</span>`;
    return chips.join('');
  }
  function nipHTML(p) {
    const n = p.nip;
    if (!n) return PH();
    const unit = String(n.form).toUpperCase() === 'L' ? 'ml' : 'g';
    const basis = `${t('Trên', 'Per')} ${n.serving || 100}${unit}` +
      (String(n.basis).toLowerCase() === 'drained' ? ` ${t('(cái ráo nước)', '(drained)')}` : '');
    const cell = (v, u, l) => `<div><b>${v ? E(v) + u : '—'}</b><small>${l}</small></div>`;
    return `<div class="hm-sub" style="margin-bottom:3px">${basis}${n.source ? ' · ' + E(n.source) : ''}</div>
      <div class="hm-nip">${cell(n.kcal, '', 'kcal')}${cell(n.protein, 'g', t('Đạm', 'Protein'))}${cell(n.fat, 'g', t('Béo', 'Fat'))}${cell(n.sodium, 'mg', t('Natri', 'Sodium'))}</div>`;
  }
  function claimsHTML(p) {
    const list = lang() === 'en' && p.claims_en.length ? p.claims_en : p.claims_vi;
    return list.length ? list.map(c => `<span class="hm-chip claim">✅ ${E(c)}</span>`).join('') : PH();
  }
  function logosHTML(p) {
    if (!p.label_logos.length) return `${imgSlot('', '🏷️', 'hm-logo')} ${PH()}`;
    return p.label_logos.map(l => /^https?:\/\//i.test(l)
      ? imgSlot(l, '🏷️', 'hm-logo')
      : `<span class="hm-chip cert">${imgSlot('', '🏷️', 'hm-logo-sm')}${E(l)}</span>`).join('');
  }
  function certChips(p) {
    const cs = p.certs.map(certById).filter(Boolean);
    if (!cs.length) return `${imgSlot('', '🏅', 'hm-logo')} ${PH()}`;
    return cs.map(c => `<span class="hm-chip cert">${imgSlot(c.logo_url, '🏅', 'hm-logo-sm')}${E(t(c.name_vi, c.name_en) || c.cert_id)}</span>`).join('');
  }
  const sec = (vi, en, html) => `<div class="il-sec"><span class="il-lbl">${t(vi, en)}</span><div class="il-txt">${html}</div></div>`;

  function renderIL() {
    ensureBar('m-il', '#ilSearch');
    const legend = document.querySelector('#m-il .il-legend');
    if (legend) legend.style.display = 'none';
    const grid = document.getElementById('ilGrid');
    const cnt = document.getElementById('ilCount');
    if (!M) { cnt.textContent = ''; grid.innerHTML = `<div class="il-no-result">${emptyState()}</div>`; return; }
    const q = (document.getElementById('ilSearch').value || '').toLowerCase();
    const f = typeof ilFilter !== 'undefined' ? ilFilter : 'all';
    const rows = M.products.filter(p => {
      if (f !== 'all' && p.group !== f) return false;
      if (!q) return true;
      return [p.sku_id, p.brand, p.name_vi, p.name_en, p.usp_vi, p.usp_en,
        p.ingredients.map(i => i.vi + ' ' + i.en).join(' '),
        p.allergens.map(a => a.vi + ' ' + a.en).join(' '),
        p.claims_vi.join(' '), p.claims_en.join(' ')].join(' ').toLowerCase().includes(q);
    });
    cnt.textContent = t('Đang hiển thị ', 'Showing ') + rows.length + t(' sản phẩm', ' products');
    if (!rows.length) { grid.innerHTML = `<div class="il-no-result">${t('Không tìm thấy sản phẩm phù hợp.', 'No matching product.')}</div>`; return; }
    grid.innerHTML = rows.map(p => {
      const g = GROUP[p.group] || { vi: '', en: '', ic: '📦' };
      return `<div class="il-card g-${p.group}">
        <div class="hm-head">
          ${imgSlot(p.image_url, g.ic, 'hm-pimg')}
          <div style="flex:1;min-width:0">
            <div class="il-head" style="margin-bottom:0">
              <div class="il-name">${val(p.name_vi, p.name_en)}</div>
              <span class="il-grp g-${p.group}">${t(g.vi, g.en)}</span>
            </div>
            <div class="hm-sub">${E(p.brand)} · ${E(p.sku_id)}</div>
            <div class="hm-meta">
              <span>📦 ${packText(p)}</span>
              <span>${t('Xuất xứ', 'Origin')}: ${E(t(p.origin_vi, p.origin_en) || '—')}</span>
              <span>${t('HSD', 'Shelf life')}: ${p.shelf_life_months ? E(p.shelf_life_months) + t(' tháng', ' mo') : '—'}</span>
              <span>${E(t(p.packaging_vi, p.packaging_en) || '—')}</span>
            </div>
          </div>
        </div>
        ${sec('Điểm bán hàng (USP)', 'Selling points (USP)', val(p.usp_vi, p.usp_en))}
        ${sec('Thành phần', 'Ingredients', ingText(p))}
        ${sec('Chất gây dị ứng', 'Allergens', `<div class="hm-chips">${allergenHTML(p)}</div>`)}
        ${sec('Dinh dưỡng', 'Nutrition', nipHTML(p))}
        ${sec('Claim đã duyệt', 'Approved claims', `<div class="hm-chips">${claimsHTML(p)}</div>`)}
        ${sec('Logo trên nhãn', 'Label logos', `<div class="hm-chips">${logosHTML(p)}</div>`)}
        ${sec('Chứng nhận', 'Certifications', `<div class="hm-chips">${certChips(p)}</div>`)}
        ${sec('Cách dùng', 'How to use', val(p.usage_vi, p.usage_en))}
        ${sec('Bảo quản', 'Storage', val(p.storage_vi, p.storage_en))}
        <div class="hm-sub" style="margin-top:8px">${t('Số tự công bố', 'Declaration no.')}: ${p.declaration_no ? E(p.declaration_no) : '—'}</div>
      </div>`;
    }).join('');
  }

  /* ───────── CHỨNG NHẬN (tab Thương hiệu) ───────── */
  function scopeText(c) {
    if (c.scope === 'ALL') return t('Toàn bộ sản phẩm', 'All products');
    if (c.scope === 'BRAND') return E(c.scope_value);
    if (c.scope === 'SKU') {
      const n = String(c.scope_value || '').split(/[;,]/).filter(s => s.trim()).length;
      return `${n} SKU`;
    }
    return '';
  }
  function renderCerts() {
    const grid = document.querySelector('#m-brand .cert-grid');
    if (!grid) return;
    const card = grid.closest('.card');
    const h2 = card.querySelector('h2');
    h2.innerHTML = `🏅 ${t('Chứng nhận', 'Certifications')}`;
    card.querySelectorAll(':scope > p').forEach(p => p.remove());
    grid.className = 'hm-certs cert-grid';
    if (!M) { grid.innerHTML = `<div class="hm-empty">${emptyState()}</div>`; return; }
    if (!M.certs.length) {
      grid.innerHTML = `<div class="hm-cert">${imgSlot('', '🏅', 'hm-logo')}<div><strong>${PH()}</strong>
        <div class="sc">${t('Thêm chứng chỉ vào tab HUB_CERTS (show = Y)', 'Add certificates in the HUB_CERTS tab (show = Y)')}</div></div></div>`;
      return;
    }
    grid.innerHTML = M.certs.map(c => `<div class="hm-cert">
      ${imgSlot(c.logo_url, '🏅', 'hm-logo')}
      <div><strong>${val(c.name_vi, c.name_en)}</strong>
        <div class="sc">${c.issuer ? E(c.issuer) : PH()}</div>
        <div class="no">${c.cert_no ? E(c.cert_no) : ''}</div>
        <div class="vd">${c.valid_to ? '✅ ' + t('Hiệu lực đến ', 'Valid until ') + E(c.valid_to) : ''}</div>
        <div class="sc">${scopeText(c)}</div>
      </div></div>`).join('');
  }

  /* ───────── stat "SKU tại VN" ───────── */
  function renderStat() {
    const el = document.querySelector('#statRow .num[data-target="30"], #statRow .num[data-hm="sku"]');
    if (!el || !M) return;
    el.dataset.hm = 'sku';
    el.dataset.target = M.count;
    setTimeout(() => { el.textContent = M.count; }, 1600); // sau khi animation cũ chạy xong
  }

  function renderAll() { renderSKU(); renderIL(); renderCerts(); renderStat(); }

  /* ───────── load ───────── */
  async function load(force) {
    if (!MASTER_API || MASTER_API.indexOf('PASTE') === 0) { state = M ? 'cached' : 'noapi'; renderAll(); return; }
    state = 'loading'; // nếu đã có bản lưu, dữ liệu vẫn hiển thị trong lúc tải
    renderAll();
    try {
      const res = await fetch(MASTER_API + (force ? (MASTER_API.indexOf('?') > -1 ? '&' : '?') + 'nocache=1' : ''));
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || 'unknown');
      M = j; state = 'live';
      try { localStorage.setItem(LS_KEY, JSON.stringify(j)); } catch (_) {}
    } catch (e) {
      stateNote = e.message;
      state = M ? 'cached' : 'error';
    }
    renderAll();
  }

  /* ───────── hook vào hub hiện có ───────── */
  // ghi đè hàm render cũ (dữ liệu gõ cứng không còn dùng)
  window.renderSKU = renderSKU;
  window.filterSKU = renderSKU;
  window.renderIL = renderIL;
  const _setLang = window.setLang;
  window.setLang = function (l) { _setLang(l); renderSKU(); renderCerts(); };

  // thêm nút lọc Hữu cơ cho SKU Directory
  const sf = document.getElementById('skuFilters');
  if (sf && !sf.querySelector('[data-filter="huuco"]')) {
    const b = document.createElement('button');
    b.className = 'sku-filter'; b.dataset.filter = 'huuco'; b.textContent = '🌿 Hữu cơ';
    b.onclick = function () { setSKUFilter(this, 'huuco'); };
    sf.appendChild(b);
  }

  // khởi động: hiện bản lưu (nếu có) ngay, rồi tải bản mới
  try { const c = localStorage.getItem(LS_KEY); if (c) { M = JSON.parse(c); state = 'cached'; } } catch (_) {}
  window.HubMaster = { reload: () => load(true), data: () => M };
  load(false);
})();
