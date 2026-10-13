// SAMPLE queue for the staff mockups (placeholder names, items and prices).
const I = {
  queue: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  off: '<circle cx="12" cy="12" r="9"/><path d="M6 6l12 12"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  note: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  check: '<path d="M5 12l5 5L20 7"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
};
window.icon = (n) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;

window.ORDERS = [
  { code: "#3F2A9C", who: "Jai R.", min: 1, status: "new", type: "Takeout", paid: false, total: 285,
    items: [["1", "Ube Latte", "Large · iced · oat"], ["1", "Butter Croissant", "Warmed"]], fresh: true },
  { code: "#A71C04", who: "Sam T.", min: 3, status: "new", type: "Dine in · T4", paid: true, total: 150,
    items: [["1", "Spanish Latte", "Medium · hot"]] },
  { code: "#5D0B3E", who: "Kriza M.", min: 9, status: "make", type: "Takeout", paid: false, total: 340,
    items: [["2", "Sea Salt Mocha", "Medium · iced"]], note: "Less sweet, please — allergic to hazelnut" },
  { code: "#09E4B1", who: "Cai D.", min: 6, status: "make", type: "Takeout", paid: true, total: 175,
    items: [["1", "Ube Cold Brew", "Large"]] },
  { code: "#7B3310", who: "Nico P.", min: 14, status: "make", type: "Dine in · T2", paid: false, total: 245,
    items: [["1", "Matcha Latte", "Medium · hot"], ["1", "Ensaymada", ""]] },
  { code: "#C2F871", who: "Aldo V.", min: 11, status: "ready", type: "Takeout", paid: false, total: 120,
    items: [["1", "Iced Americano", "Medium"]] },
  { code: "#E05A2D", who: "Bea L.", min: 7, status: "ready", type: "Takeout", paid: true, total: 165,
    items: [["1", "Ube Latte", "Medium · hot"]] },
];

const urgency = (o) => (o.status === "ready" ? "" : o.min >= 12 ? `<span class="chip over">Over 12m</span>` : o.min >= 8 ? `<span class="chip late">Late</span>` : "");
const ACTION = {
  new: `<button class="go start">${"Start"}</button>`,
  make: `<button class="go ready">Mark ready</button>`,
  ready: (o) => `<button class="go hand">${o.paid ? "Hand over" : "Take ₱" + o.total + " · hand over"}</button>`,
};
window.ticket = (o, opts = {}) => `
  <article class="tk${o.fresh ? " fresh" : ""}${opts.selected ? " sel" : ""}" aria-label="Order ${o.code}">
    <div class="top">
      <div><div class="code">${o.code}</div><div class="who">${o.who}</div></div>
      <div class="meta"><span class="time">${o.min}m</span>${o.fresh ? '<span class="chip new">New</span>' : ""}${urgency(o)}</div>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;padding:0 14px 6px"><span class="chip type">${o.type}</span><span class="chip ${o.paid ? "paid" : "unpaid"}">${o.paid ? "Paid" : "Unpaid ₱" + o.total}</span></div>
    <ul>${o.items.map(([q, n, d]) => `<li><span class="q">${q}×</span><span>${n}${d ? `<small>${d}</small>` : ""}</span></li>`).join("")}</ul>
    ${o.note ? `<div class="note">${icon("note")}<span>${o.note}</span></div>` : ""}
    ${opts.noAction ? "" : `<div class="act">${typeof ACTION[o.status] === "function" ? ACTION[o.status](o) : ACTION[o.status]}<button class="more" aria-label="More actions for ${o.code}">${icon("more")}</button></div>`}
  </article>`;

window.staffBar = (cur = "Queue") => `
  <header class="sbar">
    <span class="brand">Counter</span>
    <nav aria-label="Staff">
      <a href="#"${cur === "Queue" ? ' aria-current="page"' : ""}>${icon("queue")} Queue <span class="n">2</span></a>
      <a href="#"${cur === "Sold out" ? ' aria-current="page"' : ""}>${icon("off")} Sold out</a>
      <a href="#"${cur === "Shift" ? ' aria-current="page"' : ""}>${icon("clock")} Shift</a>
    </nav>
    <span class="shift"><span class="dot" aria-hidden="true"></span>On shift <b>since 7:02</b> · drawer <b>₱2,000</b></span>
  </header>`;
window.kpis = () => `
  <div class="kpis" role="status"><span><b>7</b>open</span><span><b>6m</b>avg wait</span><span><b>2</b>late</span><span><b>₱990</b>to collect</span><span><b>46</b>done today</span></div>`;

// The hand-over panel: payment folded into handing the order over, so a
// barista never leaves the queue for a separate POS screen.
window.payPanel = (o) => `
  <section class="pay" aria-label="Hand over ${o.code}">
    <div class="pay-head"><div><span class="eyebrow">Hand over</span><div class="code">${o.code} · ${o.who}</div></div><span class="chip unpaid">Unpaid</span></div>
    <div class="pay-total"><span>Total</span><b>₱${o.total}.00</b></div>
    <div class="seg" role="radiogroup" aria-label="Payment method"><button role="radio" aria-checked="true">Cash</button><button role="radio" aria-checked="false">E-wallet</button></div>
    <span class="eyebrow">Cash received</span>
    <div class="quick"><button>Exact</button><button aria-pressed="true">₱200</button><button>₱500</button><button>₱1,000</button><button>Other…</button></div>
    <div class="change"><span>Change</span><b>₱${200 - o.total}.00</b></div>
    <button class="go hand big">${icon("check")} Paid ₱${o.total} · hand over</button>
    <button class="linkish">Not here yet — keep on the shelf</button>
  </section>`;
