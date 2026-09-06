import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Queries the Hiatus Coffee database ('menu_items' instead of 'todos')
  const { data: menuItems, error } = await supabase.from("menu_items").select();

  if (error) {
    return (
      <div style={{ padding: "1.5rem", fontFamily: "sans-serif" }}>
        <h2 style={{ color: "#a51f18" }}>Error connecting to Supabase:</h2>
        <pre style={{ background: "#f5f5f5", padding: "1rem", borderRadius: "6px" }}>
          {error.message}
        </pre>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem", fontFamily: "sans-serif" }}>
      <h1>Supabase Connected Successfully</h1>
      <p style={{ color: "#666" }}>
        Found {menuItems?.length ?? 0} menu items in table <code>menu_items</code>:
      </p>
      <ul style={{ marginTop: "1rem", lineHeight: "1.6" }}>
        {menuItems && menuItems.length > 0 ? (
          menuItems.map((item) => (
            <li key={item.id}>
              <strong>{item.name}</strong> — ₱{item.price} ({item.flavor})
            </li>
          ))
        ) : (
          <li>No menu items found yet. (Add some at <code>/admin/menu</code>)</li>
        )}
      </ul>
    </div>
  );
}
