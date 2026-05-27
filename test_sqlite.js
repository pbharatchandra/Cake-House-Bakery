import { db } from './server/lib/db.js';
async function test() {
  try {
    const orders = await db.$queryRaw`PRAGMA table_info("Order");`;
    console.log("sqlite schema for Order:", orders);
  } catch (e) {
    console.error(e);
  } finally {
    db.$disconnect();
  }
}
test();
