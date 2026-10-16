import type { OrderItem } from "@/types/database";
import type { QueueOrder } from "@/types/staff";

/** Frontend-first preview: the staff workspace renders from these mocks with
 *  no backend running. Flip to false to read the live API again. */
export const USE_MOCKS = true;

export const MOCK_USER = {
  name: "Maria Santos",
  email: "maria@hiatus.example",
};

export const MOCK_SHIFT = {
  since: "7:02 AM",
  openingCash: 2000,
};

export const MOCK_SUMMARY = {
  ordersToday: 46,
};

const item = (
  id: string,
  orderId: string,
  item_name: string,
  quantity: number,
  unit_price: number,
  size?: "S" | "M" | "L",
  extra?: Partial<OrderItem>
): OrderItem => ({
  id,
  order_id: orderId,
  menu_item_id: null,
  item_name,
  flavor: "",
  size: size ?? null,
  unit_price,
  quantity,
  subtotal: quantity * unit_price,
  ...extra,
});

const at = (minAgo: number) => new Date(Date.now() - minAgo * 60000).toISOString();

/** Sample queue covering every card state: new, making, ready, paid, unpaid,
 *  priority, flagged note, walk-in, long name, and a 6-item order. Line
 *  prices are plausible counter prices; totals are derived from the lines
 *  below so receipts and metrics can never disagree with them. */
export const MOCK_QUEUE: QueueOrder[] = [
  {
    id: "3f2a9c71b4e84a2d9c1e5f07",
    status: "pending",
    order_type: "takeout",
    table_label: null,
    priority: 0,
    payment_method: "cash",
    payment_status: "unpaid",
    total_amount: 0,
    discount_amount: 0,
    pickup_note: null,
    created_at: at(1),
    profiles: { full_name: "Jai R.", phone: null },
    order_items: [
      item("3f2a9c71b4e84a2d9c1e5f07-a", "3f2a9c71b4e84a2d9c1e5f07", "Ube Latte", 1, 185, "L"),
      item("3f2a9c71b4e84a2d9c1e5f07-b", "3f2a9c71b4e84a2d9c1e5f07", "Butter Croissant", 1, 100),
    ],
  },
  {
    id: "a71c04d2e5f647b8a3d2c190",
    status: "pending",
    order_type: "dine_in",
    table_label: "T4",
    priority: 1,
    payment_method: "ewallet",
    payment_status: "paid",
    total_amount: 0,
    discount_amount: 0,
    pickup_note: null,
    created_at: at(3),
    profiles: { full_name: "Sam T.", phone: null },
    order_items: [item("a71c04d2e5f647b8a3d2c190-a", "a71c04d2e5f647b8a3d2c190", "Spanish Latte", 1, 150, "M")],
  },
  {
    id: "5d0b3e88f1c24a6db7e9a031",
    status: "preparing",
    order_type: "takeout",
    table_label: null,
    priority: 0,
    special_request_flag: true,
    payment_method: "cash",
    payment_status: "unpaid",
    total_amount: 0,
    discount_amount: 0,
    pickup_note: "Less sweet, please, allergic to hazelnut",
    created_at: at(9),
    profiles: { full_name: "Kriza M.", phone: null },
    order_items: [item("5d0b3e88f1c24a6db7e9a031-a", "5d0b3e88f1c24a6db7e9a031", "Sea Salt Mocha", 2, 170, "M")],
  },
  {
    id: "09e4b166c3d84f2aa5b7d412",
    status: "preparing",
    order_type: "takeout",
    table_label: null,
    priority: 0,
    payment_method: "ewallet",
    payment_status: "paid",
    total_amount: 0,
    discount_amount: 0,
    pickup_note: null,
    created_at: at(6),
    profiles: { full_name: "Cai D.", phone: null },
    order_items: [item("09e4b166c3d84f2aa5b7d412-a", "09e4b166c3d84f2aa5b7d412", "Ube Cold Brew", 1, 175, "L")],
  },
  {
    id: "7b3310aa9e2c4d5f8b1c6e93",
    status: "preparing",
    order_type: "dine_in",
    table_label: "T2",
    priority: 0,
    payment_method: "cash",
    payment_status: "unpaid",
    total_amount: 0,
    discount_amount: 0,
    pickup_note: null,
    created_at: at(14),
    profiles: { full_name: "Nico P.", phone: null },
    order_items: [
      item("7b3310aa9e2c4d5f8b1c6e93-a", "7b3310aa9e2c4d5f8b1c6e93", "Matcha Latte", 1, 150, "M"),
      item("7b3310aa9e2c4d5f8b1c6e93-b", "7b3310aa9e2c4d5f8b1c6e93", "Ensaymada", 1, 95),
    ],
  },
  {
    id: "c2f8713bd4a649e881f5a2c4",
    status: "ready",
    order_type: "takeout",
    table_label: null,
    priority: 0,
    payment_method: "cash",
    payment_status: "unpaid",
    total_amount: 0,
    discount_amount: 0,
    pickup_note: null,
    created_at: at(11),
    profiles: { full_name: "Aldo V.", phone: null },
    order_items: [item("c2f8713bd4a649e881f5a2c4-a", "c2f8713bd4a649e881f5a2c4", "Iced Americano", 1, 120, "M")],
  },
  {
    id: "e05a2d77c1b949d3a4f8b6e5",
    status: "ready",
    order_type: "takeout",
    table_label: null,
    priority: 0,
    payment_method: "ewallet",
    payment_status: "paid",
    total_amount: 0,
    discount_amount: 0,
    pickup_note: null,
    created_at: at(7),
    profiles: { full_name: "Bea L.", phone: null },
    order_items: [item("e05a2d77c1b949d3a4f8b6e5-a", "e05a2d77c1b949d3a4f8b6e5", "Ube Latte", 1, 165, "M")],
  },
  {
    id: "f41d88c2a7e64b19d3c0a5f6",
    status: "pending",
    order_type: "dine_in",
    table_label: "T1",
    priority: 0,
    payment_method: "cash",
    payment_status: "unpaid",
    total_amount: 0,
    discount_amount: 0,
    pickup_note: "Oat milk, no ice",
    created_at: at(4),
    profiles: { full_name: "Maria Christalla Concepcion-Santos", phone: null },
    order_items: [
      item("f41d88c2a7e64b19d3c0a5f6-a", "f41d88c2a7e64b19d3c0a5f6", "Ube Latte", 2, 185, "L"),
      item("f41d88c2a7e64b19d3c0a5f6-b", "f41d88c2a7e64b19d3c0a5f6", "Spanish Latte", 1, 150, "M"),
      item("f41d88c2a7e64b19d3c0a5f6-c", "f41d88c2a7e64b19d3c0a5f6", "Sea Salt Mocha", 1, 170, "M"),
      item("f41d88c2a7e64b19d3c0a5f6-d", "f41d88c2a7e64b19d3c0a5f6", "Butter Croissant", 2, 100),
      item("f41d88c2a7e64b19d3c0a5f6-e", "f41d88c2a7e64b19d3c0a5f6", "Ensaymada", 1, 95),
      item("f41d88c2a7e64b19d3c0a5f6-f", "f41d88c2a7e64b19d3c0a5f6", "Iced Americano", 1, 120, "M"),
    ],
  },
  {
    id: "88c2a1149d0e4f7ab6c3d827",
    status: "pending",
    order_type: "takeout",
    table_label: null,
    priority: 0,
    payment_method: "cash",
    payment_status: "unpaid",
    total_amount: 0,
    discount_amount: 0,
    pickup_note: null,
    created_at: at(2),
    profiles: null,
    order_items: [item("88c2a1149d0e4f7ab6c3d827-a", "88c2a1149d0e4f7ab6c3d827", "Matcha Latte", 1, 130, "S")],
  },
];

/* Totals always equal the lines, so cards, metrics, and receipts agree. */
MOCK_QUEUE.forEach((o) => {
  o.total_amount = o.order_items.reduce((s, i) => s + i.subtotal, 0);
});
