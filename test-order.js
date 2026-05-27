import fetch from "node-fetch";

async function run() {
  const res = await fetch("http://127.0.0.1:3000/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "testId123",
      totalAmount: 10,
      address: "",
      items: [{
        productId: "missing",
        quantity: 1,
        price: 10
      }]
    })
  });
  console.log(res.status, await res.text());
}
run();
