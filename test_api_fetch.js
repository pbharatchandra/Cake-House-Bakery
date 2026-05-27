async function testApi() {
  try {
    const res = await fetch("http://localhost:3000/api/products");
    const data = await res.json();
    console.log(`Fetched ${data.products ? data.products.length : 0} products from API`);
  } catch(e) {
    console.error(e);
  }
}
testApi();
