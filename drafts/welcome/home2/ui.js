// Shared pieces for the round-2 signed-in home mockups.
// SAMPLE DATA: names, prices and photos are placeholders, not the real menu.
const P = "../assets/";
// One icon family (Lucide-style 24px line icons), always aria-hidden beside text.
const I = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  cup: '<path d="M4 8h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z"/><path d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 2v3M12 2v3"/>',
  receipt: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  bag: '<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  repeat: '<path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12"/><path d="M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
};
window.icon = (n, cls = "ico") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;

window.MENU = [
  { name: "Ube Latte", flavor: "Ube", price: 165, img: P + "hero-ube-cup.jpg" },
  { name: "Spanish Latte", flavor: "Sweet", price: 150, img: P + "hero-ube-cups.jpg" },
  { name: "Ube Cold Brew", flavor: "Ube", price: 175, img: P + "shop-notes.jpg" },
  { name: "Sea Salt Mocha", flavor: "Chocolate", price: 170, img: P + "shop-cups.jpg" },
  { name: "Matcha Latte", flavor: "Matcha", price: 160, img: null },
  { name: "Iced Americano", flavor: "Classic", price: 120, img: null },
  { name: "Butter Croissant", flavor: "Pastry", price: 85, img: null },
  { name: "Ensaymada", flavor: "Pastry", price: 75, img: null },
];
window.menuCard = (m) => `
  <article class="mcard">
    <div class="ph">${m.img ? `<img src="${m.img}" alt="">` : icon("cup")}</div>
    <div class="body">
      <span class="eyebrow">${m.flavor}</span>
      <span class="name">${m.name}</span>
      <div class="row"><span class="price">₱${m.price}<span class="muted" style="font-size:12px"> · S ₱${m.price - 15}</span></span>
      <button class="addbtn" aria-label="Add ${m.name} to cart">${icon("plus")}</button></div>
    </div>
  </article>`;
window.tabs = (cur = "All") => `<nav class="tabs" aria-label="Menu categories">${["All","Favorites","Espresso","Iced","Non-coffee","Pastries"].map(c => `<a href="#"${c===cur?' aria-current="page"':""}>${c}</a>`).join("")}</nav>`;
window.blocks = () => `
  <div class="blocks">
    <a class="block b1" href="#"><span>12 drinks</span><b>Espresso</b></a>
    <a class="block b2" href="#"><span>8 drinks</span><b>Iced</b></a>
    <a class="block b3" href="#"><span>6 drinks</span><b>Non-coffee</b></a>
    <a class="block b4" href="#"><span>6 items</span><b>Pastries</b></a>
  </div>`;
// Only the FIRST saved order gets the filled button: one primary per view.
window.usual = () => `
  <div class="usual">
    <div class="uitem"><span class="eyebrow">Saved · Morning usual</span><div class="thumbs"><img src="${P}hero-ube-cup.jpg" alt=""><img src="${P}shop-room.jpg" alt=""></div><span>Ube Latte (M) · Butter Croissant</span><div class="again"><span class="price">₱250</span><a class="btn btn-cta" href="#">${icon("repeat")} Order again</a></div></div>
    <div class="uitem"><span class="eyebrow">Saved · For two</span><div class="thumbs"><img src="${P}hero-ube-cups.jpg" alt=""><img src="${P}shop-notes.jpg" alt=""></div><span>2 × Spanish Latte (L)</span><div class="again"><span class="price">₱350</span><a class="btn btn-outline" href="#">Order again</a></div></div>
  </div>`;
window.topbar = (cur = "Home", count = 2) => `
  <header class="topbar"><b>Hiatus</b><nav aria-label="Main">
    ${["Home","Menu","Orders"].map(n => `<a class="caps sec-link" href="#"${n===cur?' aria-current="page"':""}>${n}</a>`).join("")}
    <a class="cartbtn caps" href="#" aria-label="Cart, ${count} items">${icon("bag")} <span class="sec-link">Cart</span> <span class="count">${count}</span></a></nav></header>`;
window.tabbar = (cur = "Home", count = 2) => `
  <nav class="tabbar" aria-label="Main">
    ${[["Home","home"],["Menu","cup"],["Orders","receipt"],["Profile","user"]].map(([n,i]) => `<a href="#"${n===cur?' aria-current="page"':""}>${icon(i)}${n}</a>`).join("")}
  </nav>`;
