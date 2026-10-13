/*!
 * DGM Sales Quiz — tab "Kiểm tra" cho Sales Training Hub
 * Gắn vào Hub: thêm 1 dòng trước </body>:
 *   <script src="quiz/quiz.js"></script>
 * Script tự thêm nút "📝 Kiểm tra" vào thanh menu, sub-menu và nội dung.
 * Mở trang không có Hub (quiz.html) thì chạy độc lập.
 */
(function () {
  'use strict';

  // ════════ CẤU HÌNH ════════
  // Dán URL Web App của Apps Script (Deploy → Web app → URL kết thúc bằng /exec)
  var QUIZ_API = window.DGM_QUIZ_API || 'https://script.google.com/macros/s/AKfycbwhcJp90kcx5yIcF1m6bpzVWsiXBLT7nGZoB4dpmq7ZWb26vrYIxZXaUIkoCrzjU1LcXw/exec';
  var PING_MS = 20000, LIVE_MS = 5000;

  // ════════ TIỆN ÍCH ════════
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function store(k, v) { try { if (v === undefined) { var x = localStorage.getItem(k); return x ? JSON.parse(x) : null; } if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function sstore(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function mmss(sec) { sec = Math.max(0, Math.round(sec)); var m = Math.floor(sec / 60), s = sec % 60; return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; }
  function pctClass(p) { return p == null ? '' : p >= 80 ? 'good' : p >= 65 ? 'mid' : 'bad'; }
  var REGION_VI = { North: 'Miền Bắc', Central: 'Miền Trung', South: 'Miền Nam', Nationwide: 'Toàn quốc', All: 'Toàn quốc' };
  var CH_VI = { GT: 'GT', MT: 'MT', HRC: 'B2B/HoReCa', BO: 'Back Office', ALL: 'Quản lý' };
  var TOPIC_VI = { CTY: 'Công ty & Thương hiệu', SP: 'Sản phẩm & Điểm mạnh', DT: 'Đối thủ & Định vị', KN: 'Kỹ năng bán hàng', QT: 'Quy trình & Checklist', APP: 'Ứng dụng & Công cụ số', SAM: 'Sampling', NCD: 'Nước cốt dừa 65ml' };
  var TRACK_VI = { ALL: 'Chung', GT: 'Kênh GT', MT: 'Kênh MT', HRC: 'B2B / HoReCa', BO: 'Back Office', AUTO: 'Theo kênh nhân viên' };
  var LEVEL_VI = { AUTO: 'Theo chức danh', CO_BAN: 'Cơ bản', NANG_CAO: 'Nâng cao' };
  var LVL_VI = { 1: 'Cơ bản', 2: 'Trung bình', 3: 'Nâng cao' };
  var TYPE_VI = { PROBATION: 'Trả bài thử việc', DINHKY: 'Kiểm tra định kỳ', LUYENTAP: 'Luyện tập' };

  function api(action, data) {
    var body = Object.assign({ action: action }, data || {});
    if (typeof window.DGM_QUIZ_MOCK === 'function') {
      return new Promise(function (res) { setTimeout(function () { res(window.DGM_QUIZ_MOCK(body)); }, 120); });
    }
    if (!/^https:\/\/script\.google\.com\//.test(QUIZ_API)) {
      return Promise.resolve({ ok: false, error: 'Chưa cấu hình URL Apps Script (QUIZ_API trong quiz.js).' });
    }
    return fetch(QUIZ_API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .catch(function (e) { return { ok: false, error: 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.', net: true }; });
  }

  // ════════ CSS ════════
  var CSS = [
    '.qz{--qz-red:var(--red,#C8102E);--qz-navy:var(--navy,#1B3A57);--qz-yellow:var(--yellow,#FFE140);--qz-y2:var(--yellow2,#FFBC18);--qz-green:var(--green,#0E7544);--qz-teal:var(--teal,#2F7898);--qz-gray:var(--gray,#3E4A59);--qz-cream:var(--cream,#F8F6F0);--qz-line:#E6E2D8;--qz-muted:#7A8494;--qz-good:#0E7544;--qz-mid:#B7791F;--qz-bad:#C8102E;color:var(--qz-gray);font-family:var(--font,"Segoe UI",Arial,sans-serif);font-size:14px;line-height:1.5}',
    '.qz *{box-sizing:border-box}',
    '.qz .card{background:#fff;border-radius:14px;padding:20px 22px;margin-bottom:16px;box-shadow:0 4px 18px rgba(0,0,0,.08)}',
    '.qz h2{font-size:17px;color:var(--qz-red);margin:0 0 10px;font-weight:700;display:flex;gap:8px;align-items:center}',
    '.qz h3{font-size:14.5px;color:var(--qz-navy);margin:14px 0 8px;font-weight:700}',
    '.qz .muted{color:var(--qz-muted);font-size:12.5px}',
    '.qz label.f{display:block;font-size:12px;font-weight:700;color:var(--qz-navy);margin:10px 0 4px;text-transform:uppercase;letter-spacing:.03em}',
    '.qz input[type=text],.qz input[type=password],.qz input[type=number],.qz input[type=date],.qz select,.qz textarea{width:100%;padding:11px 12px;border:1.5px solid var(--qz-line);border-radius:10px;font:inherit;font-size:15px;background:#fff;color:var(--qz-gray)}',
    '.qz textarea{min-height:76px;resize:vertical}',
    '.qz input:focus,.qz select:focus,.qz textarea:focus{outline:none;border-color:var(--qz-navy);box-shadow:0 0 0 3px rgba(27,58,87,.12)}',
    '.qz .btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:none;border-radius:10px;padding:11px 18px;font:inherit;font-weight:700;font-size:14px;cursor:pointer;transition:.15s;background:var(--qz-navy);color:#fff;min-height:44px}',
    '.qz .btn:hover{filter:brightness(1.1)}.qz .btn:disabled{opacity:.5;cursor:not-allowed}',
    '.qz .btn.red{background:var(--qz-red)}.qz .btn.ghost{background:#fff;color:var(--qz-navy);border:1.5px solid var(--qz-line)}.qz .btn.yellow{background:var(--qz-yellow);color:var(--qz-navy)}',
    '.qz .btn.sm{padding:6px 12px;min-height:34px;font-size:12.5px}.qz .btn.block{width:100%}',
    '.qz .row{display:flex;gap:12px;flex-wrap:wrap}.qz .row>*{flex:1 1 180px}',
    '.qz .err{background:#FDECEE;color:#9B0D22;border-radius:10px;padding:10px 12px;margin-top:10px;font-size:13.5px}',
    '.qz .ok-msg{background:#E7F4EC;color:#0B5A35;border-radius:10px;padding:10px 12px;margin-top:10px;font-size:13.5px}',
    '.qz .rules{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin:12px 0}',
    '.qz .rule{background:var(--qz-cream);border-radius:10px;padding:10px 12px;font-size:12.5px}.qz .rule b{display:block;font-size:20px;color:var(--qz-navy)}',
    // quiz screen
    '.qz .qbar{position:sticky;top:var(--qz-sticky,0);z-index:120;background:var(--qz-navy);color:#fff;border-radius:12px;padding:10px 14px;display:flex;align-items:center;gap:12px;margin-bottom:12px;box-shadow:0 4px 14px rgba(0,0,0,.18)}',
    '.qz .qbar .t{font-variant-numeric:tabular-nums;font-weight:800;font-size:20px;background:rgba(255,255,255,.12);padding:3px 10px;border-radius:8px}',
    '.qz .qbar .t.warn{background:var(--qz-red)}',
    '.qz .qbar .p{flex:1;min-width:0}.qz .qbar .p small{display:block;font-size:11px;opacity:.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.qz .pbar{height:6px;background:rgba(255,255,255,.2);border-radius:4px;overflow:hidden;margin-top:4px}.qz .pbar i{display:block;height:100%;background:var(--qz-yellow);transition:width .3s}',
    '.qz .qcard{user-select:none;-webkit-user-select:none}',
    '.qz .qnum{font-size:12px;font-weight:700;color:var(--qz-muted);text-transform:uppercase;letter-spacing:.04em}',
    '.qz .qtext{font-size:17px;font-weight:600;color:var(--qz-navy);margin:6px 0 14px;line-height:1.45}',
    '.qz .opt{display:flex;gap:10px;align-items:flex-start;width:100%;text-align:left;background:#fff;border:2px solid var(--qz-line);border-radius:12px;padding:12px 14px;margin-bottom:9px;font:inherit;font-size:15px;color:var(--qz-gray);cursor:pointer;transition:.12s;min-height:48px}',
    '.qz .opt:hover{border-color:#B9C3CF}.qz .opt .k{flex:0 0 26px;height:26px;border-radius:50%;background:var(--qz-cream);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:var(--qz-navy)}',
    '.qz .opt.sel{border-color:var(--qz-navy);background:#EEF3F8}.qz .opt.sel .k{background:var(--qz-navy);color:#fff}',
    '.qz .qnav{display:flex;justify-content:space-between;gap:10px;margin-top:6px}',
    '.qz .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(38px,1fr));gap:6px;margin-top:8px}',
    '.qz .grid button{height:36px;border-radius:8px;border:1.5px solid var(--qz-line);background:#fff;font:inherit;font-weight:700;font-size:12.5px;color:var(--qz-muted);cursor:pointer}',
    '.qz .grid button.done{background:var(--qz-navy);color:#fff;border-color:var(--qz-navy)}.qz .grid button.cur{outline:3px solid var(--qz-yellow);outline-offset:1px}',
    '.qz .tabwarn{background:#FFF6DB;border:1px solid #F3D27A;color:#7A5300;border-radius:10px;padding:8px 12px;font-size:13px;margin-bottom:10px}',
    // result
    '.qz .score{display:flex;align-items:center;gap:20px;flex-wrap:wrap}',
    '.qz .ring{width:120px;height:120px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-direction:column;font-weight:800;color:var(--qz-navy);background:conic-gradient(var(--c) calc(var(--v)*1%),#EEE 0)}',
    '.qz .ring>div{width:96px;height:96px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;flex-direction:column}',
    '.qz .ring b{font-size:26px;line-height:1}.qz .ring small{font-size:11px;color:var(--qz-muted);font-weight:600}',
    '.qz .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:800}',
    '.qz .badge.pass{background:#E7F4EC;color:var(--qz-good)}.qz .badge.fail{background:#FDECEE;color:var(--qz-bad)}.qz .badge.prog{background:#EEF3F8;color:var(--qz-navy)}.qz .badge.late{background:#FFF6DB;color:#7A5300}.qz .badge.none{background:#F1F1F1;color:#888}',
    '.qz .tbar{display:flex;align-items:center;gap:10px;margin:6px 0;font-size:13px}.qz .tbar .l{flex:0 0 46%;min-width:0}.qz .tbar .b{flex:1;height:10px;background:#EEE;border-radius:6px;overflow:hidden}.qz .tbar .b i{display:block;height:100%;border-radius:6px}.qz .tbar .v{flex:0 0 64px;text-align:right;font-variant-numeric:tabular-nums;font-weight:700}',
    '.qz .good{color:var(--qz-good)}.qz .mid{color:var(--qz-mid)}.qz .bad{color:var(--qz-bad)}',
    '.qz i.good{background:var(--qz-good)}.qz i.mid{background:var(--qz-y2)}.qz i.bad{background:var(--qz-red)}',
    '.qz .rv{border-left:4px solid var(--qz-red);background:#FFFBFB;border-radius:0 10px 10px 0;padding:10px 14px;margin:10px 0}',
    '.qz .rv .a{margin-top:6px;font-size:13.5px}.qz .rv .x{margin-top:6px;font-size:13px;color:var(--qz-gray);background:var(--qz-cream);border-radius:8px;padding:8px 10px}',
    // leader
    '.qz .ltabs{display:flex;gap:6px;overflow-x:auto;margin-bottom:14px;padding-bottom:2px}',
    '.qz .ltabs button{flex:0 0 auto;border:1.5px solid var(--qz-line);background:#fff;border-radius:20px;padding:8px 14px;font:inherit;font-weight:700;font-size:13px;color:var(--qz-gray);cursor:pointer;min-height:38px}',
    '.qz .ltabs button.on{background:var(--qz-navy);color:#fff;border-color:var(--qz-navy)}',
    '.qz .tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin:10px 0}',
    '.qz .tile{background:var(--qz-cream);border-radius:12px;padding:12px}.qz .tile b{display:block;font-size:24px;color:var(--qz-navy);font-variant-numeric:tabular-nums;line-height:1.2}.qz .tile span{font-size:12px;color:var(--qz-muted)}',
    '.qz .bigcode{display:flex;align-items:center;gap:16px;flex-wrap:wrap;background:var(--qz-navy);color:#fff;border-radius:14px;padding:14px 18px;margin-bottom:12px}',
    '.qz .bigcode b{font-size:34px;letter-spacing:.08em;word-break:break-all;color:var(--qz-yellow);font-variant-numeric:tabular-nums;line-height:1}',
    '.qz .tbl{width:100%;border-collapse:collapse;font-size:13px}.qz .tblwrap{overflow-x:auto;-webkit-overflow-scrolling:touch}',
    '.qz .tbl th{background:var(--qz-cream);color:var(--qz-navy);text-align:left;padding:8px 10px;font-size:11.5px;text-transform:uppercase;letter-spacing:.03em;white-space:nowrap;position:sticky;top:0}',
    '.qz .tbl td{padding:8px 10px;border-bottom:1px solid var(--qz-line);vertical-align:middle}',
    '.qz .tbl tr.click{cursor:pointer}.qz .tbl tr.click:hover td{background:#FAFAF7}',
    '.qz .mini{height:8px;background:#EEE;border-radius:5px;overflow:hidden;min-width:70px}.qz .mini i{display:block;height:100%;background:var(--qz-teal)}',
    '.qz .chip{display:inline-block;background:var(--qz-cream);border-radius:6px;padding:1px 7px;font-size:11.5px;font-weight:700;color:var(--qz-navy);margin-right:4px}',
    '.qz .qs{border:1.5px solid var(--qz-line);border-radius:12px;padding:12px 14px;margin-bottom:10px;background:#fff}',
    '.qz .qs .hd{display:flex;gap:10px;align-items:flex-start}.qz .qs .hd .pc{flex:0 0 58px;text-align:center;font-weight:800;font-size:18px;font-variant-numeric:tabular-nums}',
    '.qz .qs .op{display:flex;gap:8px;align-items:center;font-size:13px;margin:4px 0}.qz .qs .op .bar{flex:0 0 90px;height:8px;background:#EEE;border-radius:4px;overflow:hidden}.qz .qs .op .bar i{display:block;height:100%;background:#B9C3CF}',
    '.qz .qs .op.right{font-weight:700;color:var(--qz-good)}.qz .qs .op.right .bar i{background:var(--qz-good)}',
    '.qz .qs .ex{margin-top:8px;font-size:13px;background:var(--qz-cream);border-radius:8px;padding:8px 10px}',
    '.qz .drawer{position:fixed;inset:0;background:rgba(10,20,35,.5);z-index:500;display:flex;justify-content:flex-end}',
    '.qz .drawer>div{background:var(--qz-cream);width:min(720px,100%);height:100%;overflow-y:auto;padding:18px}',
    '.qz .modal{position:fixed;inset:0;background:rgba(10,20,35,.55);z-index:600;display:flex;align-items:center;justify-content:center;padding:16px}',
    '.qz .modal>div{background:#fff;border-radius:16px;padding:22px;max-width:420px;width:100%}',
    '.qz .chk{display:flex;align-items:center;gap:8px;font-size:14px;margin:8px 0}.qz .chk input{width:18px;height:18px}',
    '.qz .pill-sel{display:flex;flex-wrap:wrap;gap:6px}.qz .pill-sel label{display:inline-flex;align-items:center;gap:6px;border:1.5px solid var(--qz-line);border-radius:20px;padding:5px 11px;font-size:13px;cursor:pointer;background:#fff}',
    '.qz .pill-sel input{margin:0}',
    '.qz .empty{text-align:center;color:var(--qz-muted);padding:24px 10px}',
    '.qz .spin{display:inline-block;width:16px;height:16px;border:2.5px solid rgba(0,0,0,.15);border-top-color:var(--qz-navy);border-radius:50%;animation:qzs .8s linear infinite;vertical-align:middle}',
    '@keyframes qzs{to{transform:rotate(360deg)}}',
    '@media(max-width:640px){.qz .card{padding:16px 14px}.qz .qtext{font-size:16px}.qz .bigcode b{font-size:32px}.qz .tbar .l{flex-basis:52%}}',
    '@media print{.qz .noprint,.topbar,.nav-wrap,.subnav-wrap{display:none!important}.qz .qs{break-inside:avoid}}'
  ].join('\n');

  // ════════ MOUNT ════════
  var ROOT_TAKE, ROOT_LEAD, HUB = false;

  function mount() {
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    var nav = document.getElementById('mainNav');
    var content = document.querySelector('.content');
    var subWrap = document.getElementById('subNavWrap');
    if (nav && content && subWrap && typeof window.showGroup === 'function') {
      HUB = true;
      try { GROUP_FIRST['g-quiz'] = 'm-quiz-take'; } catch (e) { /* hub cũ */ }
      var b = document.createElement('button');
      b.innerHTML = '📝 <span class="vi-only">Kiểm tra</span><span class="en-only hide">Quiz</span><span class="badge-new">NEW</span>';
      b.onclick = function () { window.showGroup('g-quiz', b); };
      nav.appendChild(b);
      var sub = document.createElement('div');
      sub.className = 'subnav hide'; sub.id = 'sub-g-quiz';
      sub.innerHTML = '<button class="active" onclick="subShow(\'m-quiz-take\',this)">✍️ <span class="vi-only">Làm bài kiểm tra</span><span class="en-only hide">Take the quiz</span></button>' +
        '<button onclick="subShow(\'m-quiz-leader\',this)">🧑‍🏫 <span class="vi-only">Leader</span><span class="en-only hide">Leader</span></button>';
      subWrap.appendChild(sub);
      ROOT_TAKE = document.createElement('div'); ROOT_TAKE.id = 'm-quiz-take'; ROOT_TAKE.className = 'module qz';
      ROOT_LEAD = document.createElement('div'); ROOT_LEAD.id = 'm-quiz-leader'; ROOT_LEAD.className = 'module qz';
      content.appendChild(ROOT_TAKE); content.appendChild(ROOT_LEAD);
      if (typeof window.setLang === 'function' && window.currentLang === 'en') { /* giữ trạng thái ngôn ngữ */ }
      // sticky timer dưới thanh menu của Hub
      var h = 0; ['.topbar', '.nav-wrap', '.subnav-wrap'].forEach(function (s) { var el = $(s); if (el) h += el.offsetHeight; });
      ROOT_TAKE.style.setProperty('--qz-sticky', (h + 6) + 'px');
      if (/[#&]quiz/.test(location.hash)) setTimeout(function () { b.click(); }, 50);
    } else {
      var host = document.getElementById('qz-standalone') || document.body;
      var wrap = document.createElement('div'); wrap.className = 'qz';
      wrap.innerHTML = '<div class="ltabs noprint" style="justify-content:center"><button class="on" data-v="take">✍️ Làm bài kiểm tra</button><button data-v="lead">🧑‍🏫 Leader</button></div>';
      host.appendChild(wrap);
      ROOT_TAKE = document.createElement('div'); ROOT_TAKE.className = 'qz';
      ROOT_LEAD = document.createElement('div'); ROOT_LEAD.className = 'qz'; ROOT_LEAD.style.display = 'none';
      host.appendChild(ROOT_TAKE); host.appendChild(ROOT_LEAD);
      var topEl = $('.top'); if (topEl) ROOT_TAKE.style.setProperty('--qz-sticky', (topEl.offsetHeight + 6) + 'px');
      $$('button', wrap).forEach(function (bt) {
        bt.onclick = function () {
          $$('button', wrap).forEach(function (x) { x.classList.toggle('on', x === bt); });
          ROOT_TAKE.style.display = bt.dataset.v === 'take' ? '' : 'none';
          ROOT_LEAD.style.display = bt.dataset.v === 'lead' ? '' : 'none';
          if (bt.dataset.v === 'lead') Leader.render();
        };
      });
      if (/lead/.test(location.hash)) setTimeout(function () { $$('button', wrap)[1].click(); }, 30);
    }
    Take.render();
    // Leader render khi mở tab lần đầu (Hub)
    if (HUB) {
      var obs = new MutationObserver(function () { if (ROOT_LEAD.classList.contains('active') && !Leader.mounted) Leader.render(); });
      obs.observe(ROOT_LEAD, { attributes: true, attributeFilter: ['class'] });
    }
  }

  function modal(html, buttons) {
    return new Promise(function (resolve) {
      var m = document.createElement('div'); m.className = 'qz modal';
      m.innerHTML = '<div>' + html + '<div class="row" style="margin-top:16px">' + buttons.map(function (b, i) { return '<button class="btn ' + (b.cls || '') + '" data-i="' + i + '">' + esc(b.label) + '</button>'; }).join('') + '</div></div>';
      document.body.appendChild(m);
      $$('button[data-i]', m).forEach(function (bt) { bt.onclick = function () { m.remove(); resolve(Number(bt.dataset.i)); }; });
    });
  }

  // ════════════════════════════════════════════════════════
  //  NHÂN VIÊN LÀM BÀI
  // ════════════════════════════════════════════════════════
  var Take = {
    st: { staff: null, att: null, answers: {}, cur: 0, tabs: 0, offset: 0, timer: null, ping: null, submitting: false },
    user: null,

    render: function () { if (this.user) this.home(); else this.loginView(); },
    msg: function (t, err) { var m = $('#qz-msg'); if (m) m.innerHTML = t ? '<div class="' + (err ? 'err' : 'ok-msg') + '">' + esc(t) + '</div>' : ''; },

    // ── B1: chọn tên + mật khẩu ──
    loginView: function () {
      var self = this, saved = store('dgmquiz_user') || {};
      ROOT_TAKE.innerHTML =
        '<div class="card" style="max-width:520px;margin:0 auto"><h2>📝 Kiểm tra kiến thức Sales</h2>' +
        '<div class="muted">Đăng nhập bằng tên và mật khẩu cá nhân để tự luyện tập hoặc làm test định kỳ.</div>' +
        '<label class="f" for="qz-name">Họ tên</label><select id="qz-name"><option value="">Đang tải danh sách…</option></select>' +
        '<label class="f" for="qz-pin">Mật khẩu cá nhân</label><input id="qz-pin" type="password" inputmode="numeric" maxlength="12" autocomplete="off" placeholder="Mật khẩu do Leader cấp">' +
        '<div style="margin-top:16px"><button class="btn red block" id="qz-login">Đăng nhập</button></div><div id="qz-msg"></div></div>';
      api('init').then(function (r) {
        var sel = $('#qz-name'); if (!sel) return;
        if (!r.ok) { sel.innerHTML = '<option value="">—</option>'; self.msg(r.error, true); return; }
        self.st.config = r.config;
        var groups = {};
        r.staff.forEach(function (s) { var g = (CH_VI[s.channel] || s.channel) + (s.region && s.channel === 'GT' ? ' – ' + (REGION_VI[s.region] || s.region) : ''); (groups[g] = groups[g] || []).push(s); });
        sel.innerHTML = '<option value="">— Chọn tên của bạn —</option>' + Object.keys(groups).sort().map(function (g) {
          return '<optgroup label="' + esc(g) + '">' + groups[g].map(function (s) { return '<option value="' + esc(s.name) + '">' + esc(s.name) + ' · ' + esc(s.title) + '</option>'; }).join('') + '</optgroup>';
        }).join('');
        if (saved.name) sel.value = saved.name;
      });
      var go = function () { self.login(); };
      $('#qz-login').onclick = go;
      $('#qz-pin').onkeydown = function (e) { if (e.key === 'Enter') go(); };
    },
    login: function () {
      var self = this, name = $('#qz-name').value, pin = $('#qz-pin').value.trim();
      if (!name) return self.msg('Chọn tên của bạn trong danh sách.', true);
      var b = $('#qz-login'); b.disabled = true; b.innerHTML = '<span class="spin"></span> Đang kiểm tra…';
      api('login', { name: name, staffPin: pin }).then(function (r) {
        b.disabled = false; b.textContent = 'Đăng nhập';
        if (!r.ok) return self.msg(r.error, true);
        self.user = Object.assign({ pin: pin }, r);
        store('dgmquiz_user', { name: r.name });
        self.home();
      });
    },
    logout: function () { this.user = null; this.loginView(); },

    // ── B2: chọn loại thực hiện ──
    home: function () {
      var self = this, u = self.user, cfg = self.st.config || { size: 40, duration: 30, pass: 80 };
      var pending = store('dgmquiz_att');
      if (pending && pending.name !== u.name) pending = null;
      ROOT_TAKE.innerHTML =
        '<div class="card"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap"><div>' +
        '<h2 style="margin-bottom:4px">👋 Chào ' + esc(u.name) + '</h2><div class="muted">' + esc(u.title) + ' · ' + esc(CH_VI[u.channel] || u.channel) + (u.region ? ' · ' + esc(REGION_VI[u.region] || u.region) : '') + ' · Đề <b>' + esc(u.trackLabel) + ' – ' + esc(u.levelLabel) + '</b></div></div>' +
        '<button class="btn sm ghost" id="qz-out">Đăng xuất</button></div>' +
        '<div class="rules"><div class="rule"><b>' + cfg.size + '</b>câu trắc nghiệm</div><div class="rule"><b>' + cfg.duration + '′</b>thời gian làm bài</div><div class="rule"><b>≥' + cfg.pass + '%</b>điểm đạt</div></div>' +
        (pending && pending.attemptId ? '<div class="tabwarn">Bạn có bài <b>' + esc(pending.label || '') + '</b> đang làm dở. <button class="btn sm" id="qz-resume" style="margin-left:6px">Tiếp tục làm</button></div>' : '') +
        '</div>' +
        '<div class="row">' +
        '<div class="card" style="margin-bottom:16px"><h2>📘 Tự luyện tập</h2><div class="muted" style="min-height:58px">Đề ngẫu nhiên theo vị trí của bạn. Làm bao nhiêu lần cũng được, xem đáp án và giải thích ngay sau khi nộp. Không tính vào xếp hạng.</div>' +
        '<button class="btn block" id="qz-practice" style="margin-top:12px">Bắt đầu luyện tập</button></div>' +
        '<div class="card" style="margin-bottom:16px"><h2>📝 Test định kỳ</h2><div class="muted">Nhập mật khẩu kỳ test do Leader cung cấp (VD: Test tháng 10/2026). Mỗi kỳ chỉ làm 1 lần, có xếp hạng.</div>' +
        '<input id="qz-code" type="text" autocomplete="off" placeholder="Mật khẩu kỳ test" maxlength="30" style="margin-top:10px;text-transform:uppercase">' +
        '<button class="btn red block" id="qz-periodic" style="margin-top:10px">Vào làm test</button></div>' +
        '</div>' +
        '<div class="card"><h2>📊 Kết quả của tôi</h2><div class="muted">Điểm, thứ hạng và nhận xét các lần đã làm.</div><button class="btn ghost" id="qz-mine" style="margin-top:10px">Xem kết quả</button><div id="qz-msg"></div></div>';
      $('#qz-out').onclick = function () { self.logout(); };
      $('#qz-practice').onclick = function () { self.start('PRACTICE', '', this); };
      $('#qz-periodic').onclick = function () { var c = $('#qz-code').value.trim(); if (!c) return self.msg('Nhập mật khẩu kỳ test do Leader cung cấp.', true); self.start('PERIODIC', c, this); };
      $('#qz-code').onkeydown = function (e) { if (e.key === 'Enter') $('#qz-periodic').click(); };
      $('#qz-mine').onclick = function () { self.myResults(); };
      var rs = $('#qz-resume'); if (rs) rs.onclick = function () { self.start(pending.mode, pending.code, this); };
    },

    // ── B3: làm bài ──
    start: function (mode, code, btn) {
      var self = this, u = self.user;
      var old = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Đang tạo đề…'; }
      api('start', { name: u.name, staffPin: u.pin, mode: mode, code: code }).then(function (r) {
        if (btn) { btn.disabled = false; btn.innerHTML = old; }
        if (!r.ok) { if (r.needPin) return self.logout(); return self.msg(r.error, true); }
        store('dgmquiz_att', { name: u.name, mode: mode, code: code, attemptId: r.attemptId, label: r.session.name });
        var local = store('dgmquiz_ans_' + r.attemptId) || {};
        var answers = Object.assign({}, r.draft || {}, local);
        self.st.att = r; self.st.answers = answers; self.st.cur = 0; self.st.tabs = Number(store('dgmquiz_tabs_' + r.attemptId)) || 0;
        self.st.offset = r.serverNow - Date.now(); self.st.name = u.name; self.st.submitting = false;
        for (var i = 0; i < r.questions.length; i++) { if (answers[r.questions[i].id] === undefined) { self.st.cur = i; break; } }
        self.quizView();
      });
    },

    // ── Kết quả của tôi ──
    myResults: function () {
      var self = this, u = self.user;
      ROOT_TAKE.innerHTML = '<div class="card"><span class="spin"></span> Đang tải kết quả…</div>';
      api('myResults', { name: u.name, staffPin: u.pin }).then(function (r) {
        if (!r.ok) { if (r.needPin) return self.logout(); ROOT_TAKE.innerHTML = '<div class="card"><div class="err">' + esc(r.error) + '</div></div>'; return; }
        var tests = r.list.filter(function (x) { return !x.practice; }), prac = r.list.filter(function (x) { return x.practice; });
        var card = function (x) {
          return '<div class="qs"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center"><div><b style="color:var(--qz-navy)">' + esc(x.sessionName) + '</b><div class="muted">' + esc(x.date) + (x.level ? ' · ' + esc(x.level) : '') + '</div></div>' +
            '<div style="text-align:right"><b class="' + pctClass(x.pct) + '" style="font-size:20px">' + x.pct + '%</b> <span class="muted">' + x.correct + '/' + x.total + '</span><br><span class="badge ' + (x.result === 'ĐẠT' ? 'pass' : 'fail') + '">' + esc(x.result) + '</span>' + (x.rank ? ' <span class="badge prog">Hạng ' + x.rank.rank + '/' + x.rank.of + '</span>' : '') + '</div></div>' +
            (x.comment ? '<div class="ex">💬 ' + esc(x.comment) + '</div>' : '') +
            (x.leaderComment ? '<div class="ex" style="background:#EEF3F8">🧑‍🏫 <b>Leader:</b> ' + esc(x.leaderComment) + '</div>' : '') +
            (x.topics.length ? '<details style="margin-top:6px"><summary class="muted" style="cursor:pointer">Điểm theo chủ đề</summary>' + x.topics.map(function (t) { var p = Math.round(t.correct * 100 / t.total); return '<div class="tbar"><div class="l">' + esc(TOPIC_VI[t.topic] || t.label) + '</div><div class="b"><i class="' + pctClass(p) + '" style="width:' + p + '%"></i></div><div class="v">' + t.correct + '/' + t.total + '</div></div>'; }).join('') + '</details>' : '') +
            '</div>';
        };
        var best = prac.length ? Math.max.apply(null, prac.map(function (x) { return x.pct; })) : null;
        ROOT_TAKE.innerHTML = '<div class="card"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><h2 style="margin:0">📊 Kết quả của ' + esc(u.name) + '</h2><button class="btn sm ghost" id="qz-back">← Quay lại</button></div></div>' +
          '<div class="card"><h2>📝 Test định kỳ (' + tests.length + ')</h2>' + (tests.length ? tests.map(card).join('') : '<div class="empty">Chưa làm kỳ test nào.</div>') + '</div>' +
          '<div class="card"><h2>📘 Tự luyện tập (' + prac.length + ' lần' + (best != null ? ' · cao nhất ' + best + '%' : '') + ')</h2>' + (prac.length ? prac.slice(0, 10).map(card).join('') : '<div class="empty">Chưa luyện tập lần nào.</div>') + '</div>';
        $('#qz-back').onclick = function () { self.home(); };
        window.scrollTo({ top: ROOT_TAKE.offsetTop - 120, behavior: 'smooth' });
      });
    },

    remain: function () { return (this.st.att.deadline - (Date.now() + this.st.offset)) / 1000; },
    answeredCount: function () { var a = this.st.answers; return this.st.att.questions.filter(function (q) { return a[q.id] !== undefined; }).length; },

    quizView: function () {
      var self = this, A = self.st.att;
      ROOT_TAKE.innerHTML =
        '<div class="qbar"><div class="t" id="qz-timer">--:--</div><div class="p"><b id="qz-prog">0/' + A.questions.length + '</b> câu đã trả lời<small>' + esc(self.st.name) + ' · ' + esc(A.session.name) + ' · Đề ' + esc(A.trackLabel) + (A.levelLabel ? ' · ' + esc(A.levelLabel) : '') + '</small><div class="pbar"><i id="qz-pbar" style="width:0"></i></div></div></div>' +
        '<div id="qz-tabwarn"></div>' +
        '<div class="card qcard" id="qz-q"></div>' +
        '<div class="card"><div class="muted">Bấm số câu để chuyển nhanh · ô xanh đậm = đã trả lời</div><div class="grid" id="qz-grid"></div>' +
        '<div style="margin-top:14px"><button class="btn red block" id="qz-submit">Nộp bài</button></div></div>';
      self.drawQ(); self.drawGrid(); self.tick();
      clearInterval(self.st.timer); self.st.timer = setInterval(function () { self.tick(); }, 1000);
      clearInterval(self.st.ping); self.st.ping = setInterval(function () { self.sendPing(); }, PING_MS);
      self.sendPing();
      $('#qz-submit').onclick = function () { self.confirmSubmit(); };
      if (!self._vis) {
        self._vis = function () {
          if (document.visibilityState === 'hidden' && self.st.att && !self.st.submitting && $('#qz-timer')) {
            self.st.tabs++; store('dgmquiz_tabs_' + self.st.att.attemptId, self.st.tabs); self.sendPing();
          }
          if (document.visibilityState === 'visible') self.showTabWarn();
        };
        document.addEventListener('visibilitychange', self._vis);
      }
      self.showTabWarn();
      window.scrollTo({ top: ROOT_TAKE.offsetTop - 120, behavior: 'smooth' });
    },
    showTabWarn: function () {
      var w = $('#qz-tabwarn'); if (!w) return;
      w.innerHTML = this.st.tabs > 0 ? '<div class="tabwarn">⚠️ Bạn đã rời màn hình bài làm <b>' + this.st.tabs + '</b> lần. Số lần này được ghi nhận gửi Leader.</div>' : '';
    },
    drawQ: function () {
      var self = this, A = self.st.att, i = self.st.cur, q = A.questions[i], sel = self.st.answers[q.id];
      var keys = ['A', 'B', 'C', 'D'];
      $('#qz-q').innerHTML =
        '<div class="qnum">Câu ' + (i + 1) + ' / ' + A.questions.length + ' · ' + esc(TOPIC_VI[q.topic] || '') + '</div>' +
        '<div class="qtext">' + esc(q.q) + '</div>' +
        q.opts.map(function (o, k) { return '<button class="opt' + (sel === k ? ' sel' : '') + '" data-k="' + k + '"><span class="k">' + keys[k] + '</span><span>' + esc(o) + '</span></button>'; }).join('') +
        '<div class="qnav"><button class="btn ghost" id="qz-prev"' + (i === 0 ? ' disabled' : '') + '>← Câu trước</button>' +
        (i < A.questions.length - 1 ? '<button class="btn" id="qz-next">Câu tiếp →</button>' : '<button class="btn red" id="qz-last">Xem lại & nộp</button>') + '</div>';
      $$('.opt', $('#qz-q')).forEach(function (b) {
        b.onclick = function () {
          self.st.answers[q.id] = Number(b.dataset.k);
          store('dgmquiz_ans_' + A.attemptId, self.st.answers);
          self.drawQ(); self.drawGrid(); self.updProg(); self.debouncePing();
          if (self.st.cur < A.questions.length - 1) setTimeout(function () { if (self.st.cur === i) { self.st.cur++; self.drawQ(); self.drawGrid(); } }, 280);
        };
      });
      var pv = $('#qz-prev'), nx = $('#qz-next'), ls = $('#qz-last');
      if (pv) pv.onclick = function () { self.st.cur--; self.drawQ(); self.drawGrid(); };
      if (nx) nx.onclick = function () { self.st.cur++; self.drawQ(); self.drawGrid(); };
      if (ls) ls.onclick = function () { self.confirmSubmit(); };
      self.updProg();
    },
    drawGrid: function () {
      var self = this, A = self.st.att;
      $('#qz-grid').innerHTML = A.questions.map(function (q, i) { return '<button class="' + (self.st.answers[q.id] !== undefined ? 'done' : '') + (i === self.st.cur ? ' cur' : '') + '" data-i="' + i + '">' + (i + 1) + '</button>'; }).join('');
      $$('#qz-grid button').forEach(function (b) { b.onclick = function () { self.st.cur = Number(b.dataset.i); self.drawQ(); self.drawGrid(); window.scrollTo({ top: ROOT_TAKE.offsetTop - 120, behavior: 'smooth' }); }; });
    },
    updProg: function () {
      var n = this.answeredCount(), t = this.st.att.questions.length;
      var p = $('#qz-prog'); if (p) p.textContent = n + '/' + t;
      var b = $('#qz-pbar'); if (b) b.style.width = (n * 100 / t) + '%';
    },
    tick: function () {
      var r = this.remain(), el = $('#qz-timer');
      if (!el) { clearInterval(this.st.timer); return; }
      el.textContent = mmss(r); el.classList.toggle('warn', r <= 120);
      if (r <= 0 && !this.st.submitting) this.submit(true);
    },
    sendPing: function () {
      var A = this.st.att; if (!A || this.st.submitting) return;
      api('ping', { attemptId: A.attemptId, answered: this.answeredCount(), tabs: this.st.tabs, answers: this.st.answers });
    },
    debouncePing: function () { var self = this; clearTimeout(self._pd); self._pd = setTimeout(function () { self.sendPing(); }, 4000); },

    confirmSubmit: function () {
      var self = this, n = self.answeredCount(), t = self.st.att.questions.length;
      var html = '<h2 style="color:var(--qz-navy)">Nộp bài?</h2><p>Bạn đã trả lời <b>' + n + '/' + t + '</b> câu.' + (n < t ? ' <span class="bad"><b>' + (t - n) + ' câu còn bỏ trống</b> sẽ tính là sai.</span>' : '') + '</p><p class="muted">Sau khi nộp không sửa được nữa.</p>';
      modal(html, [{ label: 'Làm tiếp', cls: 'ghost' }, { label: 'Nộp bài', cls: 'red' }]).then(function (i) { if (i === 1) self.submit(false); });
    },
    submit: function (auto) {
      var self = this, A = self.st.att;
      if (self.st.submitting) return;
      self.st.submitting = true;
      clearInterval(self.st.timer); clearInterval(self.st.ping); clearTimeout(self._pd);
      ROOT_TAKE.innerHTML = '<div class="card" style="text-align:center"><span class="spin"></span> ' + (auto ? 'Hết giờ — đang nộp bài…' : 'Đang nộp bài và chấm điểm…') + '</div>';
      var send = function (tries) {
        api('submit', { attemptId: A.attemptId, answers: self.st.answers, tabs: self.st.tabs }).then(function (r) {
          if (!r.ok && r.net && tries < 5) { setTimeout(function () { send(tries + 1); }, 3000); ROOT_TAKE.querySelector('.card').innerHTML = '<span class="spin"></span> Mạng chập chờn — đang thử nộp lại (' + (tries + 1) + ')…'; return; }
          if (!r.ok) {
            ROOT_TAKE.innerHTML = '<div class="card"><div class="err">' + esc(r.error) + '</div>' + (r.already ? '' : '<p class="muted">Bài làm đã được lưu trên máy. Bấm "Thử nộp lại" khi có mạng.</p><button class="btn red" id="qz-retry">Thử nộp lại</button>') + '</div>';
            var rt = $('#qz-retry'); if (rt) rt.onclick = function () { self.st.submitting = false; self.submit(false); };
            return;
          }
          store('dgmquiz_ans_' + A.attemptId, null); store('dgmquiz_tabs_' + A.attemptId, null);
          store('dgmquiz_att', null);
          self.resultView(r);
        });
      };
      send(0);
    },
    resultView: function (r) {
      var self = this, c = r.pass ? 'var(--qz-good)' : 'var(--qz-red)';
      ROOT_TAKE.innerHTML =
        '<div class="card"><h2>' + (r.pass ? '🎉 Chúc mừng!' : '📘 Cần ôn thêm') + '</h2>' +
        '<div class="score"><div class="ring" style="--v:' + r.pct + ';--c:' + c + '"><div><b>' + r.pct + '%</b><small>' + r.correct + '/' + r.total + ' câu</small></div></div>' +
        '<div><span class="badge ' + (r.pass ? 'pass' : 'fail') + '">' + (r.pass ? 'ĐẠT' : 'CHƯA ĐẠT') + '</span>' + (r.late ? ' <span class="badge late">NỘP TRỄ</span>' : '') +
        '<p style="margin-top:8px">Ngưỡng đạt: <b>' + r.passMark + '%</b>. ' + (r.pass ? 'Bạn nắm vững kiến thức nền tảng — tiếp tục giữ phong độ!' : 'Leader sẽ cùng bạn ôn lại các chủ đề còn yếu bên dưới.') + '</p></div></div>' +
        (r.comment ? '<div class="ex" style="font-size:14px;margin-top:12px">💬 ' + esc(r.comment) + '</div>' : '') +
        (r.rank ? '<div style="margin-top:8px"><span class="badge prog">Hạng tạm thời ' + r.rank.rank + '/' + r.rank.of + ' trong kỳ ' + esc(r.sessionName || '') + '</span> <span class="muted">(thứ hạng cập nhật khi cả team nộp xong)</span></div>' : '') +
        '<h3>Kết quả theo chủ đề</h3>' +
        r.topics.sort(function (a, b) { return a.correct / a.total - b.correct / b.total; }).map(function (t) {
          var p = Math.round(t.correct * 100 / t.total);
          return '<div class="tbar"><div class="l">' + esc(t.label) + '</div><div class="b"><i class="' + pctClass(p) + '" style="width:' + p + '%"></i></div><div class="v">' + t.correct + '/' + t.total + '</div></div>';
        }).join('') + '</div>' +
        (r.review ? '<div class="card"><h2>🔎 Xem lại ' + r.review.length + ' câu chưa đúng</h2>' + (r.review.length ? r.review.map(function (x) {
          return '<div class="rv"><div><span class="chip">' + esc(TOPIC_VI[x.topic] || x.topic) + '</span></div><div style="font-weight:600;margin-top:4px">' + esc(x.q) + '</div>' +
            '<div class="a bad">✗ Bạn chọn: ' + esc(x.chosen) + '</div><div class="a good">✓ Đáp án đúng: ' + esc(x.correct) + '</div>' +
            '<div class="x">💡 ' + esc(x.exp) + (x.src ? '<br><span class="muted">Nguồn: ' + esc(x.src) + '</span>' : '') + '</div></div>';
        }).join('') : '<div class="empty">Không sai câu nào. Xuất sắc! 🏆</div>') + '</div>'
          : '<div class="card"><div class="muted">Bạn sai ' + r.wrongCount + ' câu. Đáp án và giải thích chi tiết sẽ được Leader trao đổi trong buổi training sau.</div></div>') +
        '<div class="card"><div class="row"><button class="btn ghost" id="qz-back">← Về trang chính</button>' + (r.practice ? '<button class="btn" id="qz-again">Luyện tập thêm một đề</button>' : '<button class="btn" id="qz-mine2">Xem kết quả của tôi</button>') + '</div></div>';
      $('#qz-back').onclick = function () { self.st.att = null; self.render(); };
      var ag = $('#qz-again'); if (ag) ag.onclick = function () { self.start('PRACTICE', '', this); };
      var mn = $('#qz-mine2'); if (mn) mn.onclick = function () { self.myResults(); };
      window.scrollTo({ top: ROOT_TAKE.offsetTop - 120, behavior: 'smooth' });
    }
  };

  // ════════════════════════════════════════════════════════
  //  LEADER
  // ════════════════════════════════════════════════════════
  var Leader = {
    mounted: false, pin: null, me: null, view: 'live', liveCode: null, liveT: null, sessions: [], bank: null, picked: {},

    render: function () {
      this.mounted = true;
      this.pin = sstore('dgmquiz_lpin');
      if (!this.pin) return this.loginView();
      var self = this;
      api('leaderLogin', { pin: self.pin }).then(function (r) {
        if (!r.ok) { sstore('dgmquiz_lpin', null); self.pin = null; return self.loginView(r.error); }
        self.me = r; self.shell();
      });
      ROOT_LEAD.innerHTML = '<div class="card"><span class="spin"></span> Đang tải…</div>';
    },
    loginView: function (err) {
      var self = this;
      ROOT_LEAD.innerHTML = '<div class="card" style="max-width:420px;margin:0 auto"><h2>🧑‍🏫 Khu vực Leader</h2><div class="muted">Tạo kỳ test, theo dõi realtime, xem đáp án &amp; giải thích, ghi nhận training.</div>' +
        '<label class="f" for="qz-lpin">Mã PIN Leader</label><input id="qz-lpin" type="password" inputmode="numeric" autocomplete="off">' +
        '<div style="margin-top:14px"><button class="btn block" id="qz-lgo">Đăng nhập</button></div><div id="qz-lmsg">' + (err ? '<div class="err">' + esc(err) + '</div>' : '') + '</div></div>';
      var go = function () {
        var p = $('#qz-lpin').value.trim(); if (!p) return;
        $('#qz-lgo').disabled = true;
        api('leaderLogin', { pin: p }).then(function (r) {
          $('#qz-lgo').disabled = false;
          if (!r.ok) { $('#qz-lmsg').innerHTML = '<div class="err">' + esc(r.error) + '</div>'; return; }
          sstore('dgmquiz_lpin', p); self.pin = p; self.me = r; self.shell();
        });
      };
      $('#qz-lgo').onclick = go; $('#qz-lpin').onkeydown = function (e) { if (e.key === 'Enter') go(); };
    },
    call: function (action, data) {
      var self = this;
      return api(action, Object.assign({ pin: self.pin }, data || {})).then(function (r) {
        if (r && r.auth === false) { sstore('dgmquiz_lpin', null); self.loginView(r.error); }
        return r;
      });
    },
    shell: function () {
      var self = this;
      var tabs = [['live', '📡 Kỳ test & Live'], ['rank', '🏆 Xếp hạng & nhận xét'], ['stats', '📉 Câu sai nhiều'], ['monthly', '📅 Kết quả theo tháng'], ['training', '🗒️ Ghi nhận training'], ['bank', '📚 Đáp án & giải thích']];
      ROOT_LEAD.innerHTML = '<div class="ltabs noprint">' + tabs.map(function (t) { return '<button data-v="' + t[0] + '" class="' + (self.view === t[0] ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') +
        '<button data-v="logout" style="margin-left:auto">👤 ' + esc(self.me.leader) + ' · Thoát</button></div><div id="qz-lv"></div>';
      $$('.ltabs button', ROOT_LEAD).forEach(function (b) {
        b.onclick = function () {
          if (b.dataset.v === 'logout') { sstore('dgmquiz_lpin', null); clearInterval(self.liveT); self.pin = null; return self.loginView(); }
          self.view = b.dataset.v; self.shell();
        };
      });
      clearInterval(self.liveT);
      self['v_' + self.view]();
    },
    el: function () { return $('#qz-lv'); },

    // ── PHIÊN & LIVE ──
    v_live: function () {
      var self = this;
      self.el().innerHTML =
        '<div class="card noprint"><h2>➕ Tạo kỳ test mới</h2><div class="row">' +
        '<div><label class="f">Loại</label><select id="ns-type"><option value="DINHKY">Test định kỳ (cả team)</option><option value="PROBATION">Trả bài thử việc</option></select></div>' +
        '<div><label class="f">Cấp độ đề</label><select id="ns-level"><option value="AUTO">Tự động theo chức danh</option><option value="CO_BAN">Cơ bản (Salesman, Admin, Digital)</option><option value="NANG_CAO">Nâng cao (Sales Rep, Trade Mkt)</option></select></div>' +
        '<div><label class="f">Đề theo kênh</label><select id="ns-track"><option value="AUTO">Tự động theo kênh của từng nhân viên</option><option value="ALL">Chỉ phần chung (40 câu)</option><option value="GT">Kênh GT</option><option value="MT">Kênh MT</option><option value="HRC">B2B / HoReCa</option><option value="BO">Back Office</option></select></div></div>' +
        '<div class="row"><div><label class="f">Tên kỳ test</label><input id="ns-name" type="text" placeholder="VD: Test tháng 10/2026"></div>' +
        '<div><label class="f">Mật khẩu kỳ test (nhân viên nhập để vào làm)</label><input id="ns-code" type="text" maxlength="30" placeholder="VD: T10-2026 · để trống = tạo ngẫu nhiên" style="text-transform:uppercase"></div></div>' +
        '<div class="row"><div><label class="f">Thời gian (phút)</label><input id="ns-dur" type="number" min="5" max="120" value="' + (self.me.config.DURATION_MIN || 30) + '"></div><div><label class="f">Ngưỡng đạt (%)</label><input id="ns-pass" type="number" min="10" max="100" value="' + (self.me.config.PASS_PCT || 80) + '"></div></div>' +
        '<label class="chk"><input type="checkbox" id="ns-reveal"> Cho nhân viên xem đáp án &amp; giải thích ngay sau khi nộp</label>' +
        '<label class="chk"><input type="checkbox" id="ns-retake"> Cho phép làm lại nhiều lần trong phiên (phù hợp Luyện tập)</label>' +
        '<button class="btn red" id="ns-go">Tạo kỳ test</button><div id="ns-msg"></div></div>' +
        '<div id="qz-live"></div>' +
        '<div class="card"><h2>🗂️ Các kỳ test</h2><div id="qz-sess"><span class="spin"></span></div></div>';
      (function () { var d = new Date(), mm = ('0' + (d.getMonth() + 1)).slice(-2); $('#ns-name').value = 'Test tháng ' + mm + '/' + d.getFullYear(); $('#ns-code').placeholder = 'VD: T' + mm + '-' + d.getFullYear() + ' · để trống = tạo ngẫu nhiên'; })();
      $('#ns-type').onchange = function () { var t = this.value; $('#ns-reveal').checked = t !== 'PROBATION'; $('#ns-retake').checked = false; };
      $('#ns-type').onchange.call($('#ns-type'));
      $('#ns-go').onclick = function () {
        var b = this; b.disabled = true;
        self.call('createSession', { type: $('#ns-type').value, track: $('#ns-track').value, level: $('#ns-level').value, name: $('#ns-name').value, code: $('#ns-code').value, duration: $('#ns-dur').value, pass: $('#ns-pass').value, reveal: $('#ns-reveal').checked, retake: $('#ns-retake').checked }).then(function (r) {
          b.disabled = false;
          if (!r.ok) { $('#ns-msg').innerHTML = '<div class="err">' + esc(r.error) + '</div>'; return; }
          self.liveCode = r.code; self.loadSessions(); self.openLive(r.code);
        });
      };
      self.loadSessions();
      if (self.liveCode) self.openLive(self.liveCode);
    },
    loadSessions: function () {
      var self = this;
      self.call('sessions').then(function (r) {
        var box = $('#qz-sess'); if (!box || !r.ok) return;
        self.sessions = r.sessions;
        if (!r.sessions.length) { box.innerHTML = '<div class="empty">Chưa có phiên nào. Tạo kỳ test đầu tiên ở trên.</div>'; return; }
        box.innerHTML = '<div class="tblwrap"><table class="tbl"><thead><tr><th>Mật khẩu</th><th>Tên kỳ</th><th>Loại</th><th>Đề</th><th>Trạng thái</th><th>Đã nộp</th><th>Đạt</th><th>Điểm TB</th><th></th></tr></thead><tbody>' +
          r.sessions.map(function (s) {
            return '<tr class="click" data-c="' + esc(s.code) + '"><td><b>' + esc(s.code) + '</b></td><td>' + esc(s.name) + '<div class="muted">' + esc(s.created) + ' · ' + esc(s.by) + '</div></td><td>' + esc(s.typeLabel) + '</td><td>' + esc(s.trackLabel) + '<div class="muted">' + esc(s.levelLabel || '') + '</div></td>' +
              '<td><span class="badge ' + (s.status === 'OPEN' ? 'pass' : 'none') + '">' + (s.status === 'OPEN' ? 'Đang mở' : 'Đã đóng') + '</span></td><td>' + s.done + '/' + s.count + '</td><td>' + s.passCount + '</td><td class="' + pctClass(s.avg) + '"><b>' + (s.avg == null ? '—' : s.avg + '%') + '</b></td><td><button class="btn sm ghost">Xem</button></td></tr>';
          }).join('') + '</tbody></table></div>';
        $$('tr[data-c]', box).forEach(function (tr) { tr.onclick = function () { self.openLive(tr.dataset.c); }; });
      });
    },
    openLive: function (code) {
      var self = this;
      self.liveCode = code;
      clearInterval(self.liveT);
      var draw = function () {
        self.call('live', { code: code }).then(function (r) {
          var box = $('#qz-live'); if (!box) { clearInterval(self.liveT); return; }
          if (!r.ok) { box.innerHTML = '<div class="card"><div class="err">' + esc(r.error) + '</div></div>'; return; }
          var S = r.session, L = r.list;
          var done = L.filter(function (x) { return x.status === 'SUBMITTED' || x.status === 'LATE'; });
          var prog = L.filter(function (x) { return x.status === 'IN_PROGRESS'; });
          var pass = done.filter(function (x) { return x.result === 'ĐẠT'; }).length;
          var avg = done.length ? Math.round(done.reduce(function (a, x) { return a + x.pct; }, 0) / done.length * 10) / 10 : null;
          var order = { IN_PROGRESS: 0, EXPIRED: 1, LATE: 2, SUBMITTED: 2 };
          L.sort(function (a, b) { return (order[a.status] - order[b.status]) || ((b.pct || 0) - (a.pct || 0)) || ((b.answered || 0) - (a.answered || 0)); });
          box.innerHTML = '<div class="card">' +
            '<div class="bigcode"><div><div style="font-size:12px;opacity:.8;text-transform:uppercase;letter-spacing:.08em">Mật khẩu kỳ test</div><b>' + esc(S.code) + '</b></div>' +
            '<div style="flex:1;min-width:180px"><div style="font-weight:700">' + esc(S.name) + '</div><div style="font-size:12.5px;opacity:.85">' + esc(TYPE_VI[S.type] || S.type) + ' · Đề: ' + esc(TRACK_VI[S.track] || S.track) + ' · Cấp độ: ' + esc(LEVEL_VI[S.level] || 'Theo chức danh') + ' · ' + S.duration + ' phút · Đạt ≥' + S.pass + '%</div>' +
            '<div style="font-size:12px;opacity:.7;margin-top:3px">Nhân viên: Training Hub → 📝 Kiểm tra → đăng nhập → Test định kỳ → nhập mật khẩu này</div></div>' +
            '<div class="noprint" style="display:flex;gap:6px;flex-wrap:wrap">' + (S.status === 'OPEN' ? '<button class="btn sm yellow" id="lv-close">Đóng kỳ test</button>' : '<button class="btn sm yellow" id="lv-open">Mở lại phiên</button>') +
            '<button class="btn sm ghost" id="lv-stats" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.4)">Phân tích câu sai →</button></div></div>' +
            '<div class="tiles"><div class="tile"><b>' + L.length + '</b><span>Đã vào làm</span></div><div class="tile"><b>' + prog.length + '</b><span>Đang làm</span></div><div class="tile"><b>' + done.length + '</b><span>Đã nộp</span></div>' +
            '<div class="tile"><b class="good">' + pass + '</b><span>Đạt</span></div><div class="tile"><b class="' + pctClass(avg) + '">' + (avg == null ? '—' : avg + '%') + '</b><span>Điểm trung bình</span></div><div class="tile"><b>' + r.notStarted.length + '</b><span>Chưa vào</span></div></div>' +
            '<div class="muted">Tự cập nhật mỗi 5 giây · ' + new Date().toLocaleTimeString('vi-VN') + '</div>' +
            '<div class="tblwrap" style="margin-top:8px"><table class="tbl"><thead><tr><th>Nhân viên</th><th>Kênh</th><th>Trạng thái</th><th>Tiến độ</th><th>Điểm</th><th>Kết quả</th><th>Rời MH</th><th>Thời gian</th></tr></thead><tbody>' +
            (L.length ? L.map(function (x) {
              var stt = x.status === 'IN_PROGRESS' ? '<span class="badge prog">Đang làm · còn ' + mmss(x.remainSec) + '</span>' + (x.lastSeenSec != null && x.lastSeenSec > 60 ? ' <span class="muted">(mất tín hiệu ' + Math.round(x.lastSeenSec / 60) + '′)</span>' : '')
                : x.status === 'EXPIRED' ? '<span class="badge late">Hết giờ, chưa nộp</span>' : x.status === 'LATE' ? '<span class="badge late">Nộp trễ</span>' : '<span class="badge none">Đã nộp</span>';
              var pp = x.total ? Math.round(x.answered * 100 / x.total) : 0;
              return '<tr' + (x.status === 'SUBMITTED' || x.status === 'LATE' ? ' class="click" data-a="' + esc(x.attemptId) + '"' : '') + '><td><b>' + esc(x.name) + '</b><div class="muted">' + esc(x.title) + '</div></td><td>' + esc(CH_VI[x.channel] || x.channel) + (x.region ? '<div class="muted">' + esc(REGION_VI[x.region] || x.region) + '</div>' : '') + (x.level ? '<div class="muted">' + esc(x.level) + '</div>' : '') + '</td><td>' + stt + '</td>' +
                '<td><div class="mini"><i style="width:' + pp + '%"></i></div><span class="muted">' + x.answered + '/' + x.total + '</span></td>' +
                '<td class="' + pctClass(x.pct) + '"><b>' + (x.pct == null ? '' : x.pct + '%') + '</b>' + (x.correct != null ? '<div class="muted">' + x.correct + '/' + x.total + '</div>' : '') + '</td>' +
                '<td>' + (x.result ? '<span class="badge ' + (x.result === 'ĐẠT' ? 'pass' : 'fail') + '">' + esc(x.result) + '</span>' : '') + '</td>' +
                '<td' + (x.tabs >= 3 ? ' class="bad"' : '') + '><b>' + (x.tabs || 0) + '</b></td><td>' + (x.durSec ? mmss(x.durSec) : esc(x.start)) + '</td></tr>';
            }).join('') : '<tr><td colspan="8" class="empty">Chưa có ai vào làm. Đọc mã phiên cho team.</td></tr>') + '</tbody></table></div>' +
            (r.notStarted.length ? '<h3>Chưa vào làm (' + r.notStarted.length + ')</h3><div>' + r.notStarted.map(function (s) { return '<span class="chip" style="margin:3px 4px 3px 0">' + esc(s.name) + ' · ' + esc(CH_VI[s.channel] || s.channel) + '</span>'; }).join('') + '</div>' : '') +
            '</div>';
          var c = $('#lv-close'), o = $('#lv-open');
          if (c) c.onclick = function () { self.call('setSession', { code: code, status: 'CLOSED' }).then(function () { draw(); self.loadSessions(); }); };
          if (o) o.onclick = function () { self.call('setSession', { code: code, status: 'OPEN' }).then(function () { draw(); self.loadSessions(); }); };
          $('#lv-stats').onclick = function () { self.statsCode = code; self.view = 'stats'; self.shell(); };
          $$('tr[data-a]', box).forEach(function (tr) { tr.onclick = function () { self.attemptDrawer(tr.dataset.a); }; });
        });
      };
      draw();
      self.liveT = setInterval(function () { if (document.visibilityState === 'visible') draw(); }, LIVE_MS);
      var box = $('#qz-live'); if (box) window.scrollTo({ top: box.getBoundingClientRect().top + window.scrollY - 140, behavior: 'smooth' });
    },

    attemptDrawer: function (id) {
      var self = this;
      var d = document.createElement('div'); d.className = 'qz drawer';
      d.innerHTML = '<div><div class="card"><span class="spin"></span></div></div>';
      d.onclick = function (e) { if (e.target === d) d.remove(); };
      document.body.appendChild(d);
      self.call('attempt', { attemptId: id }).then(function (r) {
        var inner = d.firstChild;
        if (!r.ok) { inner.innerHTML = '<div class="card"><div class="err">' + esc(r.error) + '</div></div>'; return; }
        var wrong = r.items.filter(function (x) { return !x.ok; });
        inner.innerHTML = '<div class="card"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><h2 style="margin:0">' + esc(r.name) + '</h2><button class="btn sm ghost" id="dr-x">Đóng ✕</button></div>' +
          '<p><b class="' + pctClass(r.pct) + '">' + r.pct + '%</b> · <span class="badge ' + (r.result === 'ĐẠT' ? 'pass' : 'fail') + '">' + esc(r.result) + '</span></p><div class="muted">' + esc(r.topics) + '</div>' +
          (r.comment ? '<div class="ex">💬 <b>Nhận xét tự động:</b> ' + esc(r.comment) + '</div>' : '') +
          '<label class="f">Nhận xét của Leader (nhân viên xem được trong "Kết quả của tôi")</label><textarea id="dr-lc">' + esc(String(r.leaderComment || '').replace(/ — [^—]+$/, '')) + '</textarea><button class="btn sm" id="dr-lcs" style="margin-top:6px">💾 Lưu nhận xét</button>' +
          '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" id="dr-tr">🗒️ Ghi nhận training 1-1 cho các câu sai</button><button class="btn sm ghost" id="dr-re">↺ Hủy bài này, cho làm lại</button></div><div id="dr-msg"></div></div>' +
          '<div class="card"><h2>Câu trả lời sai (' + wrong.length + ')</h2>' + (wrong.length ? wrong.map(function (x) {
            return '<div class="rv"><span class="chip">' + esc(x.id) + '</span><span class="chip">' + esc(TOPIC_VI[x.topic] || x.topic) + '</span><div style="font-weight:600;margin-top:4px">' + esc(x.q) + '</div><div class="a bad">✗ Chọn: ' + esc(x.chosen) + '</div><div class="a good">✓ Đúng: ' + esc(x.correct) + '</div><div class="x">💡 ' + esc(x.exp) + '</div></div>';
          }).join('') : '<div class="empty">Không có câu sai.</div>') + '</div>';
        $('#dr-x', d).onclick = function () { d.remove(); };
        $('#dr-lcs', d).onclick = function () { var bt = this; bt.disabled = true; self.call('setComment', { attemptId: id, comment: $('#dr-lc', d).value }).then(function (x) { bt.disabled = false; $('#dr-msg', d).innerHTML = x.ok ? '<div class="ok-msg">Đã lưu nhận xét.</div>' : '<div class="err">' + esc(x.error) + '</div>'; if (x.ok && self.view === 'rank' && self._rankReload) self._rankReload(); }); };
        $('#dr-re', d).onclick = function () {
          modal('<h2 style="color:var(--qz-navy)">Cho ' + esc(r.name) + ' làm lại?</h2><p>Bài này sẽ bị đánh dấu HỦY (vẫn lưu trên Sheet) và nhân viên được làm lại trong cùng phiên. Phiên phải đang mở.</p>', [{ label: 'Không', cls: 'ghost' }, { label: 'Cho làm lại', cls: 'red' }]).then(function (i) {
            if (i !== 1) return;
            self.call('reopenAttempt', { attemptId: id }).then(function (x) { $('#dr-msg', d).innerHTML = x.ok ? '<div class="ok-msg">Đã hủy bài. Nhân viên nhập lại mã phiên để làm lại.</div>' : '<div class="err">' + esc(x.error) + '</div>'; });
          });
        };
        $('#dr-tr', d).onclick = function () {
          d.remove();
          self.prefill = { attendees: [r.name], qids: wrong.map(function (x) { return x.id; }), topics: Array.from(new Set(wrong.map(function (x) { return x.topic; }))), format: 'Kèm cặp 1-1', content: 'Ôn lại ' + wrong.length + ' câu sai: ' + wrong.map(function (x) { return x.id; }).join(', ') };
          self.view = 'training'; self.shell();
        };
      });
    },

    // ── XẾP HẠNG & NHẬN XÉT ──
    v_rank: function () {
      var self = this;
      var months = []; var d = new Date();
      for (var i = 0; i < 12; i++) { var m = new Date(d.getFullYear(), d.getMonth() - i, 1); months.push(m.getFullYear() + '-' + ('0' + (m.getMonth() + 1)).slice(-2)); }
      self.el().innerHTML = '<div class="card noprint"><h2>🏆 Xếp hạng &amp; nhận xét</h2><div class="muted">Chọn kỳ test (mặc định kỳ mới nhất) hoặc xem theo tháng (điểm cao nhất của mỗi người, không tính tự luyện). Bấm vào một người để xem bài làm và ghi nhận xét.</div><div class="row">' +
        '<div><label class="f">Kỳ test</label><select id="rk-code"></select></div><div><label class="f">Hoặc theo tháng</label><select id="rk-month"><option value="">—</option>' + months.map(function (m) { return '<option>' + m + '</option>'; }).join('') + '</select></div></div>' +
        '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="rk-go">Xem xếp hạng</button><button class="btn ghost" id="rk-print">🖨️ In bảng xếp hạng</button></div></div><div id="rk-out"></div>';
      var fill = function () {
        var list = (self.sessions || []).filter(function (s) { return s.code !== 'TU-LUYEN-TAP'; });
        $('#rk-code').innerHTML = '<option value="">—</option>' + list.map(function (s, i) { return '<option value="' + esc(s.code) + '"' + (i === 0 ? ' selected' : '') + '>' + esc(s.name + ' (' + s.code + ')') + '</option>'; }).join('');
      };
      var go = function () {
        var code = $('#rk-code').value, month = code ? '' : $('#rk-month').value;
        $('#rk-out').innerHTML = '<div class="card"><span class="spin"></span></div>';
        self.call('ranking', { code: code, month: month }).then(function (r) {
          if (!r.ok) { $('#rk-out').innerHTML = '<div class="card"><div class="err">' + esc(r.error) + '</div></div>'; return; }
          if (!r.list.length) { $('#rk-out').innerHTML = '<div class="card empty">Chưa có bài nộp.</div>'; return; }
          var medal = ['🥇', '🥈', '🥉'];
          $('#rk-out').innerHTML = '<div class="card"><div class="tiles"><div class="tile"><b>' + r.list.length + '</b><span>Người đã làm</span></div><div class="tile"><b class="good">' + r.passCount + '</b><span>Đạt</span></div><div class="tile"><b class="' + pctClass(r.avg) + '">' + r.avg + '%</b><span>Điểm trung bình</span></div></div>' +
            '<div class="tblwrap"><table class="tbl"><thead><tr><th>Hạng</th><th>Nhân viên</th><th>Kênh / Cấp độ</th><th>Điểm</th><th>Thời gian</th><th>Kết quả</th><th style="min-width:260px">Nhận xét</th></tr></thead><tbody>' +
            r.list.map(function (x) {
              var weak = x.topics.filter(function (t) { return t.correct / t.total < 0.7; }).map(function (t) { return TOPIC_VI[t.topic] || t.label; });
              return '<tr class="click" data-a="' + esc(x.attemptId) + '"><td style="font-size:18px"><b>' + (medal[x.rank - 1] || x.rank) + '</b></td><td><b>' + esc(x.name) + '</b><div class="muted">' + esc(x.title) + (x.practice ? ' · tự luyện ' + x.practice + ' lần' : '') + '</div></td>' +
                '<td>' + esc(CH_VI[x.channel] || x.channel) + (x.region ? ' · ' + esc(REGION_VI[x.region] || x.region) : '') + '<div class="muted">' + esc(x.level) + '</div></td>' +
                '<td class="' + pctClass(x.pct) + '"><b>' + x.pct + '%</b><div class="muted">' + x.correct + '/' + x.total + '</div></td><td>' + (x.durSec ? mmss(x.durSec) : '') + '</td>' +
                '<td><span class="badge ' + (x.result === 'ĐẠT' ? 'pass' : 'fail') + '">' + esc(x.result) + '</span></td>' +
                '<td style="font-size:12.5px">' + esc(x.comment) + (weak.length ? '<div class="muted">Yếu: ' + esc(weak.join(', ')) + '</div>' : '') + (x.leaderComment ? '<div style="margin-top:4px;color:var(--qz-navy)">🧑‍🏫 ' + esc(x.leaderComment) + '</div>' : '') + '</td></tr>';
            }).join('') + '</tbody></table></div></div>';
          $$('tr[data-a]', $('#rk-out')).forEach(function (tr) { tr.onclick = function () { self.attemptDrawer(tr.dataset.a); }; });
        });
      };
      self._rankReload = go;
      $('#rk-go').onclick = go;
      $('#rk-code').onchange = function () { if (this.value) $('#rk-month').value = ''; };
      $('#rk-month').onchange = function () { if (this.value) $('#rk-code').value = ''; };
      $('#rk-print').onclick = function () { window.print(); };
      if (self.sessions && self.sessions.length) { fill(); go(); }
      else self.call('sessions').then(function (r) { if (r.ok) self.sessions = r.sessions; fill(); go(); });
    },

    // ── PHÂN TÍCH CÂU SAI ──
    v_stats: function () {
      var self = this;
      var months = []; var d = new Date();
      for (var i = 0; i < 12; i++) { var m = new Date(d.getFullYear(), d.getMonth() - i, 1); months.push(m.getFullYear() + '-' + ('0' + (m.getMonth() + 1)).slice(-2)); }
      self.el().innerHTML = '<div class="card noprint"><h2>📉 Câu hỏi bị sai nhiều nhất</h2><div class="muted">Dùng để chọn nội dung training định kỳ: câu có tỷ lệ đúng thấp = kiến thức team đang hổng.</div><div class="row">' +
        '<div><label class="f">Theo phiên</label><select id="st-code"><option value="">— Tất cả phiên —</option>' + (self.sessions || []).map(function (s) { return '<option value="' + esc(s.code) + '"' + (self.statsCode === s.code ? ' selected' : '') + '>' + esc(s.code + ' · ' + s.name) + '</option>'; }).join('') + '</select></div>' +
        '<div><label class="f">Hoặc theo tháng</label><select id="st-month"><option value="">— Tất cả —</option>' + months.map(function (m) { return '<option>' + m + '</option>'; }).join('') + '</select></div>' +
        '<div><label class="f">Cấp độ</label><select id="st-lv"><option value="ALL">Tất cả</option><option value="CO_BAN">Cơ bản</option><option value="NANG_CAO">Nâng cao</option></select></div>' +
        '<div><label class="f">Kênh</label><select id="st-ch"><option value="ALL">Tất cả</option><option value="GT">GT</option><option value="MT">MT</option><option value="HRC">B2B/HoReCa</option><option value="BO">Back Office</option></select></div></div>' +
        '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="st-go">Xem phân tích</button><button class="btn ghost" id="st-print">🖨️ In tài liệu training</button></div></div><div id="st-out"></div>';
      var go = function () {
        $('#st-out').innerHTML = '<div class="card"><span class="spin"></span></div>';
        self.picked = {};
        var code = $('#st-code').value, month = code ? '' : $('#st-month').value;
        self.call('stats', { code: code, month: month, channel: $('#st-ch').value, level: $('#st-lv').value }).then(function (r) {
          if (!r.ok) { $('#st-out').innerHTML = '<div class="card"><div class="err">' + esc(r.error) + '</div></div>'; return; }
          if (!r.attempts) { $('#st-out').innerHTML = '<div class="card empty">Chưa có bài nộp trong phạm vi đã chọn.</div>'; return; }
          var L = ['A', 'B', 'C', 'D'];
          $('#st-out').innerHTML = '<div class="card"><h2>🧭 Theo chủ đề</h2><div class="muted">' + r.attempts + ' bài nộp</div>' +
            r.topics.map(function (t) { return '<div class="tbar"><div class="l">' + esc(t.label) + '</div><div class="b"><i class="' + pctClass(t.pct) + '" style="width:' + t.pct + '%"></i></div><div class="v ' + pctClass(t.pct) + '">' + t.pct + '%</div></div>'; }).join('') + '</div>' +
            '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><h2 style="margin:0">❌ Câu sai nhiều (tỷ lệ đúng tăng dần)</h2><button class="btn sm red noprint" id="st-train" disabled>🗒️ Ghi nhận training cho câu đã chọn</button></div>' +
            r.questions.map(function (q) {
              var tot = q.n;
              return '<div class="qs"><div class="hd"><div class="pc ' + pctClass(q.pct) + '">' + q.pct + '%<div class="muted" style="font-size:11px;font-weight:600">' + q.ok + '/' + q.n + ' đúng</div></div><div style="flex:1">' +
                '<label class="chk noprint" style="margin:0 0 4px"><input type="checkbox" data-q="' + esc(q.id) + '" data-t="' + esc(q.topic) + '"> <span class="chip">' + esc(q.id) + '</span><span class="chip">' + esc(TOPIC_VI[q.topic] || q.topic) + '</span><span class="chip">' + esc(TRACK_VI[q.track] || q.track) + '</span></label>' +
                '<div style="font-weight:600;color:var(--qz-navy)">' + esc(q.q) + '</div>' +
                q.opts.map(function (o, i) { var c = q.pick[L[i]] || 0; return '<div class="op' + (L[i] === q.ans ? ' right' : '') + '"><span class="bar"><i style="width:' + (tot ? c * 100 / tot : 0) + '%"></i></span><span style="flex:0 0 30px" class="muted">' + c + '</span><span>' + (L[i] === q.ans ? '✓ ' : '') + esc(o) + '</span></div>'; }).join('') +
                (q.pick[''] ? '<div class="op"><span class="bar"><i style="width:' + (q.pick[''] * 100 / tot) + '%"></i></span><span style="flex:0 0 30px" class="muted">' + q.pick[''] + '</span><span class="muted">(Bỏ trống)</span></div>' : '') +
                '<div class="ex">💡 ' + esc(q.exp) + (q.src ? '<br><span class="muted">Nguồn: ' + esc(q.src) + '</span>' : '') + '</div>' +
                (q.wrongBy.length ? '<div class="muted" style="margin-top:6px">Sai: ' + esc(q.wrongBy.join(', ')) + '</div>' : '') + '</div></div></div>';
            }).join('') + '</div>';
          $$('input[data-q]', $('#st-out')).forEach(function (c) {
            c.onchange = function () { if (c.checked) self.picked[c.dataset.q] = c.dataset.t; else delete self.picked[c.dataset.q]; $('#st-train').disabled = !Object.keys(self.picked).length; };
          });
          $('#st-train').onclick = function () {
            var ids = Object.keys(self.picked);
            self.prefill = { qids: ids, topics: Array.from(new Set(ids.map(function (k) { return self.picked[k]; }))), sessionCode: code, content: 'Training lại ' + ids.length + ' câu team sai nhiều: ' + ids.join(', '), format: 'Training nhóm' };
            self.view = 'training'; self.shell();
          };
        });
      };
      $('#st-go').onclick = go;
      $('#st-code').onchange = function () { if (this.value) $('#st-month').value = ''; };
      $('#st-month').onchange = function () { if (this.value) $('#st-code').value = ''; };
      $('#st-print').onclick = function () { window.print(); };
      if (!self.sessions || !self.sessions.length) self.call('sessions').then(function (r) { if (r.ok) { self.sessions = r.sessions; var s = $('#st-code'); if (s) s.innerHTML = '<option value="">— Tất cả phiên —</option>' + r.sessions.map(function (x) { return '<option value="' + esc(x.code) + '"' + (self.statsCode === x.code ? ' selected' : '') + '>' + esc(x.code + ' · ' + x.name) + '</option>'; }).join(''); } go(); });
      else go();
    },

    // ── KẾT QUẢ THEO THÁNG ──
    v_monthly: function () {
      var self = this;
      self.el().innerHTML = '<div class="card"><span class="spin"></span></div>';
      self.call('monthly').then(function (r) {
        if (!r.ok) { self.el().innerHTML = '<div class="card"><div class="err">' + esc(r.error) + '</div></div>'; return; }
        if (!r.people.length) { self.el().innerHTML = '<div class="card empty">Chưa có kết quả.</div>'; return; }
        self._monthly = r;
        self.el().innerHTML = '<div class="card"><h2>📅 Điểm theo nhân viên × tháng</h2><div class="muted">Mỗi ô = điểm cao nhất trong tháng (số lần làm). Bấm tên để xem lịch sử &amp; bài làm. Dữ liệu cũng có ở tab MONTHLY của Google Sheet.</div>' +
          '<div class="row noprint" style="margin-top:8px"><div><select id="mo-ch"><option value="">Tất cả kênh</option><option>GT</option><option>MT</option><option value="HRC">B2B/HoReCa</option><option value="BO">Back Office</option></select></div><div><input id="mo-q" type="text" placeholder="Tìm tên…"></div></div>' +
          '<div class="tblwrap" style="margin-top:10px"><table class="tbl" id="mo-t"></table></div></div><div id="mo-h"></div>';
        var draw = function () {
          var ch = $('#mo-ch').value, q = $('#mo-q').value.toLowerCase();
          var ppl = r.people.filter(function (p) { return (!ch || p.channel === ch) && (!q || p.name.toLowerCase().indexOf(q) >= 0); });
          $('#mo-t').innerHTML = '<thead><tr><th>Nhân viên</th><th>Kênh</th>' + r.months.map(function (m) { return '<th>' + esc(m.slice(5) + '/' + m.slice(0, 4)) + '</th>'; }).join('') + '<th>Thử việc</th><th>Tự luyện</th></tr></thead><tbody>' +
            ppl.map(function (p, i) {
              return '<tr class="click" data-i="' + r.people.indexOf(p) + '"><td><b>' + esc(p.name) + '</b><div class="muted">' + esc(p.title) + '</div></td><td>' + esc(CH_VI[p.channel] || p.channel) + '<div class="muted">' + esc(REGION_VI[p.region] || p.region) + '</div></td>' +
                r.months.map(function (m) { var c = p.months[m]; return '<td class="' + (c ? pctClass(c.best) : '') + '">' + (c ? '<b>' + c.best + '%</b> <span class="muted">(' + c.n + ')</span>' : '<span class="muted">—</span>') + '</td>'; }).join('') +
                '<td>' + (p.probation ? '<span class="badge ' + (p.probation.result === 'ĐẠT' ? 'pass' : 'fail') + '">' + esc(p.probation.result) + ' ' + p.probation.pct + '%</span><div class="muted">' + esc(p.probation.date) + '</div>' : '<span class="muted">—</span>') + '</td><td>' + (p.practice ? p.practice + ' lần' : '<span class="muted">—</span>') + '</td></tr>';
            }).join('') + '</tbody>';
          $$('tr[data-i]', $('#mo-t')).forEach(function (tr) { tr.onclick = function () { self.history(r.people[Number(tr.dataset.i)]); }; });
        };
        $('#mo-ch').onchange = draw; $('#mo-q').oninput = draw; draw();
      });
    },
    history: function (p) {
      var self = this;
      $('#mo-h').innerHTML = '<div class="card"><h2>🧾 ' + esc(p.name) + ' — lịch sử làm bài</h2><div class="tblwrap"><table class="tbl"><thead><tr><th>Ngày</th><th>Phiên</th><th>Loại</th><th>Cấp độ</th><th>Điểm</th><th>Kết quả</th><th>Theo chủ đề</th><th>Rời MH</th></tr></thead><tbody>' +
        p.history.map(function (h) { return '<tr class="click" data-a="' + esc(h.attemptId) + '"><td>' + esc(h.date) + '</td><td>' + esc(h.code) + '</td><td>' + esc(h.typeLabel) + '</td><td>' + esc(h.level || '') + '</td><td class="' + pctClass(h.pct) + '"><b>' + h.pct + '%</b> <span class="muted">' + h.correct + '/' + h.total + '</span></td><td><span class="badge ' + (h.result === 'ĐẠT' ? 'pass' : 'fail') + '">' + esc(h.result) + '</span></td><td class="muted">' + esc(h.topics) + '</td><td>' + h.tabs + '</td></tr>'; }).join('') +
        '</tbody></table></div></div>';
      $$('tr[data-a]', $('#mo-h')).forEach(function (tr) { tr.onclick = function () { self.attemptDrawer(tr.dataset.a); }; });
      $('#mo-h').scrollIntoView({ behavior: 'smooth' });
    },

    // ── GHI NHẬN TRAINING ──
    v_training: function () {
      var self = this, pf = self.prefill || {}; self.prefill = null;
      var today = new Date(); var iso = today.getFullYear() + '-' + ('0' + (today.getMonth() + 1)).slice(-2) + '-' + ('0' + today.getDate()).slice(-2);
      var rc = new Date(today.getTime() + 30 * 864e5); var isoRc = rc.getFullYear() + '-' + ('0' + (rc.getMonth() + 1)).slice(-2) + '-' + ('0' + rc.getDate()).slice(-2);
      self.el().innerHTML = '<div class="card"><h2>🗒️ Ghi nhận buổi training</h2><div class="muted">Sau mỗi buổi training định kỳ / kèm cặp, ghi lại để theo dõi và kiểm tra lại. Dữ liệu lưu vào tab TRAINING_LOG.</div>' +
        '<div class="row"><div><label class="f">Ngày training *</label><input type="date" id="tr-date" value="' + iso + '"></div><div><label class="f">Hình thức</label><select id="tr-format"><option>Training nhóm</option><option>Kèm cặp 1-1</option><option>Đi thị trường cùng</option><option>Họp team / online</option></select></div><div><label class="f">Thời lượng (phút)</label><input type="number" id="tr-min" value="45" min="5"></div></div>' +
        '<label class="f">Team / phạm vi</label><input type="text" id="tr-team" placeholder="VD: GT Miền Nam" value="' + esc(self.me.scope === 'ALL' ? '' : self.me.scope) + '">' +
        '<label class="f">Chủ đề đã training</label><div class="pill-sel" id="tr-topics">' + Object.keys(TOPIC_VI).map(function (k) { return '<label><input type="checkbox" value="' + k + '"' + ((pf.topics || []).indexOf(k) >= 0 ? ' checked' : '') + '> ' + esc(TOPIC_VI[k]) + '</label>'; }).join('') + '</div>' +
        '<label class="f">Câu hỏi liên quan (mã câu)</label><input type="text" id="tr-qids" value="' + esc((pf.qids || []).join(', ')) + '" placeholder="VD: P006, Q001">' +
        '<label class="f">Người tham dự</label><div class="pill-sel" id="tr-att"><span class="spin"></span></div>' +
        '<label class="f">Nội dung đã training *</label><textarea id="tr-content">' + esc(pf.content || '') + '</textarea>' +
        '<label class="f">Ghi nhận / kết quả</label><textarea id="tr-result" placeholder="Team đã nắm được gì, ai cần kèm thêm…"></textarea>' +
        '<label class="f">Việc tiếp theo</label><input type="text" id="tr-next" placeholder="VD: Kiểm tra lại bằng phiên Luyện tập">' +
        '<div class="row"><div><label class="f">Ngày kiểm tra lại</label><input type="date" id="tr-rc" value="' + isoRc + '"></div><div><label class="f">Phiên kiểm tra liên quan</label><input type="text" id="tr-sess" value="' + esc(pf.sessionCode || '') + '"></div></div>' +
        '<div style="margin-top:14px"><button class="btn red" id="tr-save">Lưu ghi nhận</button></div><div id="tr-msg"></div></div>' +
        '<div class="card"><h2>📜 Lịch sử training</h2><div id="tr-list"><span class="spin"></span></div></div>';
      api('init').then(function (r) {
        var box = $('#tr-att'); if (!box) return;
        var pre = pf.attendees || [];
        box.innerHTML = (r.staff || []).map(function (s) { return '<label><input type="checkbox" value="' + esc(s.name) + '"' + (pre.indexOf(s.name) >= 0 ? ' checked' : '') + '> ' + esc(s.name) + '</label>'; }).join('') || '<span class="muted">—</span>';
      });
      $('#tr-save').onclick = function () {
        var b = this;
        var t = {
          date: $('#tr-date').value, format: $('#tr-format').value, minutes: $('#tr-min').value, team: $('#tr-team').value,
          topics: $$('#tr-topics input:checked').map(function (x) { return x.value; }), qids: $('#tr-qids').value,
          attendees: $$('#tr-att input:checked').map(function (x) { return x.value; }), content: $('#tr-content').value,
          result: $('#tr-result').value, next: $('#tr-next').value, recheck: $('#tr-rc').value, sessionCode: $('#tr-sess').value
        };
        if (!t.date || !t.content.trim()) { $('#tr-msg').innerHTML = '<div class="err">Cần nhập ngày và nội dung đã training.</div>'; return; }
        b.disabled = true;
        self.call('logTraining', { training: t }).then(function (r) {
          b.disabled = false;
          if (!r.ok) { $('#tr-msg').innerHTML = '<div class="err">' + esc(r.error) + '</div>'; return; }
          $('#tr-msg').innerHTML = '<div class="ok-msg">Đã lưu (' + esc(r.id) + ').</div>';
          ['#tr-content', '#tr-result', '#tr-next', '#tr-qids'].forEach(function (s) { $(s).value = ''; });
          self.trainingList();
        });
      };
      self.trainingList();
    },
    trainingList: function () {
      this.call('trainingList').then(function (r) {
        var box = $('#tr-list'); if (!box) return;
        if (!r.ok || !r.list.length) { box.innerHTML = '<div class="empty">Chưa có ghi nhận.</div>'; return; }
        box.innerHTML = '<div class="tblwrap"><table class="tbl"><thead><tr><th>Ngày</th><th>Leader</th><th>Hình thức</th><th>Chủ đề</th><th>Nội dung</th><th>Tham dự</th><th>Kiểm tra lại</th></tr></thead><tbody>' +
          r.list.map(function (t) {
            var tp = String(t.topics || '').split(',').map(function (x) { x = x.trim(); return TOPIC_VI[x] || x; }).filter(Boolean).join(', ');
            return '<tr><td>' + esc(t.date) + '</td><td>' + esc(t.leader) + '</td><td>' + esc(t.format) + '<div class="muted">' + esc(t.minutes ? t.minutes + ' phút' : '') + '</div></td><td>' + esc(tp) + '</td><td>' + esc(t.content) + (t.result ? '<div class="muted">→ ' + esc(t.result) + '</div>' : '') + '</td><td class="muted">' + esc(t.attendees) + '</td><td>' + esc(t.recheck) + '</td></tr>';
          }).join('') + '</tbody></table></div>';
      });
    },

    // ── NGÂN HÀNG CÂU HỎI (đáp án + giải thích = Leader guide) ──
    v_bank: function () {
      var self = this;
      self.el().innerHTML = '<div class="card noprint"><h2>📚 Ngân hàng câu hỏi — đáp án &amp; giải thích</h2><div class="muted">Tài liệu chuẩn để Leader training định kỳ. Sửa / thêm câu trực tiếp ở tab QUESTIONS của Google Sheet (đặt Active = FALSE để tạm ẩn câu).</div>' +
        '<div class="row" style="margin-top:8px"><div><select id="bk-t"><option value="">Tất cả chủ đề</option>' + Object.keys(TOPIC_VI).map(function (k) { return '<option value="' + k + '">' + esc(TOPIC_VI[k]) + '</option>'; }).join('') + '</select></div>' +
        '<div><select id="bk-k"><option value="">Tất cả kênh</option>' + ['ALL', 'GT', 'MT', 'HRC', 'BO'].map(function (k) { return '<option value="' + k + '">' + esc(TRACK_VI[k]) + '</option>'; }).join('') + '</select></div>' +
        '<div><select id="bk-l"><option value="">Mọi độ khó</option><option value="1">Cơ bản</option><option value="2">Trung bình</option><option value="3">Nâng cao</option></select></div>' +
        '<div><input type="text" id="bk-q" placeholder="Tìm từ khóa…"></div></div><div style="margin-top:10px"><button class="btn ghost sm" id="bk-p">🖨️ In bộ đáp án đang lọc</button></div></div><div class="card" id="bk-out"><span class="spin"></span></div>';
      var draw = function () {
        var t = $('#bk-t').value, k = $('#bk-k').value, lv = $('#bk-l').value, q = $('#bk-q').value.toLowerCase();
        var L = ['A', 'B', 'C', 'D'];
        var list = self.bank.filter(function (x) { return (!t || x.topic === t) && (!k || x.track === k) && (!lv || String(x.lvl) === lv) && (!q || (x.q + ' ' + x.opts.join(' ') + ' ' + x.exp).toLowerCase().indexOf(q) >= 0); });
        $('#bk-out').innerHTML = '<div class="muted">' + list.length + ' câu</div>' + list.map(function (x) {
          return '<div class="qs"><div><span class="chip">' + esc(x.id) + '</span><span class="chip">' + esc(TOPIC_VI[x.topic] || x.topic) + '</span><span class="chip">' + esc(TRACK_VI[x.track] || x.track) + '</span><span class="chip">' + esc(LVL_VI[x.lvl] || x.lvl) + '</span></div>' +
            '<div style="font-weight:600;color:var(--qz-navy);margin:6px 0">' + esc(x.q) + '</div>' +
            x.opts.map(function (o, i) { return '<div class="op' + (L[i] === x.ans ? ' right' : '') + '"><b style="flex:0 0 18px">' + L[i] + '</b><span>' + (L[i] === x.ans ? '✓ ' : '') + esc(o) + '</span></div>'; }).join('') +
            '<div class="ex">💡 ' + esc(x.exp) + (x.src ? '<br><span class="muted">Nguồn: ' + esc(x.src) + '</span>' : '') + '</div></div>';
        }).join('');
      };
      var load = function () {
        if (self.bank) return draw();
        self.call('bank').then(function (r) { if (!r.ok) { $('#bk-out').innerHTML = '<div class="err">' + esc(r.error) + '</div>'; return; } self.bank = r.questions; draw(); });
      };
      $('#bk-t').onchange = draw; $('#bk-k').onchange = draw; $('#bk-l').onchange = draw; $('#bk-q').oninput = function () { if (self.bank) draw(); };
      $('#bk-p').onclick = function () { window.print(); };
      load();
    }
  };

  window.DGMQuiz = { Take: Take, Leader: Leader, setApi: function (u) { QUIZ_API = u; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
