import fetch from "node-fetch";

async function run() {
  const loginRes = await fetch("http://127.0.0.1:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@rustic.com", password: "dummy" })
  });
  const cookie = loginRes.headers.get("set-cookie");
  console.log("Cookie:", cookie);
  
  const res = await fetch("http://127.0.0.1:3000/api/auth/users", {
    headers: { "cookie": cookie }
  });
  console.log("Status:", res.status);
  console.log("Body:", await res.text());
}
run();
