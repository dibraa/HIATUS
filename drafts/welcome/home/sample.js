// SAMPLE DATA for the signed-in home mockups. Not the shop's real menu:
// names, prices and photos are placeholders so the layouts can be judged.
const P = "../assets/";
const BEAN = '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4"><ellipse cx="50" cy="50" rx="32" ry="23" transform="rotate(-28 50 50)"/><path d="M28 61c9-5 11-14 15-20 4-7 12-11 20-13"/></svg>';
window.MENU = [
  { name: "Ube Latte", flavor: "Ube", cat: "Espresso", price: 165, img: P + "hero-ube-cup.jpg" },
  { name: "Spanish Latte", flavor: "Sweet", cat: "Espresso", price: 150, img: P + "hero-ube-cups.jpg" },
  { name: "Ube Cold Brew", flavor: "Ube", cat: "Iced", price: 175, img: P + "shop-notes.jpg" },
  { name: "Sea Salt Mocha", flavor: "Chocolate", cat: "Espresso", price: 170, img: P + "shop-cups.jpg" },
  { name: "Matcha Latte", flavor: "Matcha", cat: "Non-coffee", price: 160, img: null },
  { name: "Iced Americano", flavor: "Classic", cat: "Iced", price: 120, img: null },
  { name: "Butter Croissant", flavor: "Pastry", cat: "Pastries", price: 85, img: null },
  { name: "Ensaymada", flavor: "Pastry", cat: "Pastries", price: 75, img: null },
];
window.CATS = ["All", "Favorites", "Espresso", "Iced", "Non-coffee", "Pastries"];
const peso = (n) => "₱" + n;
window.menuCard = (m) => `
  <article class="mcard">
    <div class="ph">${m.img ? `<img src="${m.img}" alt="">` : BEAN}</div>
    <div class="body">
      <span class="eyebrow">${m.flavor}</span>
      <span class="name">${m.name}</span>
      <div class="row"><span class="price">${peso(m.price)}<span class="muted" style="font-size:12px"> · from ${peso(m.price - 15)}</span></span><span class="add" aria-hidden="true">+</span></div>
    </div>
  </article>`;
window.tabs = (current = "All") =>
  `<nav class="tabs" aria-label="Categories">${window.CATS.map((c) => `<a href="#"${c === current ? ' aria-current="true"' : ""}>${c}</a>`).join("")}</nav>`;
window.usual = () => `
  <div class="usual">
    <div class="uitem"><span class="eyebrow">Saved · "Morning usual"</span><div class="thumbs"><img src="${P}hero-ube-cup.jpg" alt=""><img src="${P}shop-room.jpg" alt=""></div><span>Ube Latte (M) · Butter Croissant</span><div class="again"><span class="price">₱250</span><span class="btn btn-cta">Order again</span></div></div>
    <div class="uitem"><span class="eyebrow">Saved · "For two"</span><div class="thumbs"><img src="${P}hero-ube-cups.jpg" alt=""><img src="${P}shop-notes.jpg" alt=""></div><span>2 × Spanish Latte (L)</span><div class="again"><span class="price">₱350</span><span class="btn btn-cta">Order again</span></div></div>
    <div class="uitem"><span class="eyebrow">Favorite</span><div class="thumbs"><img src="${P}shop-cups.jpg" alt=""></div><span>Sea Salt Mocha</span><div class="again"><span class="price">from ₱155</span><span class="btn btn-ghost">Add</span></div></div>
  </div>`;
window.topbar = (count = 2) => `
  <header class="topbar"><b>Hiatus</b><nav><a class="caps" href="#">Menu</a><a class="caps" href="#">Orders</a><span class="cart caps">Cart <span class="count">${count}</span></span></nav></header>`;
