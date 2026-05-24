import { db } from './server/lib/db.js';

async function test() {
  const orderItems = await db.orderItem.findMany({ take: 1, include: { order: true }});
  if (orderItems.length > 0) {
     const item = orderItems[0];
     console.log("Found item id", item.id, "orderId", item.orderId);
     try {
       const res = await fetch(`http://localhost:3000/api/orders/${item.orderId}/items/${item.id}`, {
         method: 'DELETE'
       });
       const body = await res.text();
       console.log("Status:", res.status, body);
     } catch(e) {
       console.log("Error", e);
     }
  } else {
     console.log("No items");
  }
}
test().catch(console.error);
