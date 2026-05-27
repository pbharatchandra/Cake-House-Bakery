import { db } from './server/lib/db.js';

async function testProducts() {
  try {
    const products = await db.product.findMany();
    console.log(`Found ${products.length} products`);
  } catch(e) {
    console.error(e);
  } finally {
    db.$disconnect();
  }
}
testProducts();
