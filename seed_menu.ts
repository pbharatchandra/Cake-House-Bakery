import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const menu = {
  drinks: [
    { name: 'TEA', price: 6 },
    { name: 'COFFEE', price: 10 },
    { name: 'COLD COFFEE', price: 50 },
    { name: 'MAJITO', price: 50 },
    { name: 'BLUE CURACAO', price: 60 },
    { name: 'OREO SHAKE', price: 60 },
    { name: 'GINGER LEMONADE', price: 50 },
    { name: 'LIME SODA', price: 30 },
    { name: 'STRAWBERRY MOJITO', price: 40 },
    { name: 'BLACK CURRENT MOJITO', price: 50 },
    { name: 'MANGO MOJITO', price: 50 },
    { name: 'PINE APPLE MOJITO', price: 50 },
  ],
  snacks: [
    { name: 'SAMOSA PLATE', price: 15 },
    { name: 'ALOO PUFF', price: 25 },
    { name: 'PANNER PUFF', price: 30 },
    { name: 'MUSHROOM PUFF', price: 30 },
    { name: 'FRENCH FRIES (100 GRAM)', price: 50 },
    { name: 'BURGER', price: 50 },
    { name: 'CHEESE BURGER', price: 70 },
    { name: 'PANNER PIZZA', price: 130 },
    { name: 'ONION PIZZA', price: 100 },
    { name: 'SWEET CORN PIZZA', price: 120 },
    { name: 'MIX PIZZA', price: 150 },
    { name: 'DOUGH NUT', price: 50 },
  ],
  regularCakes: [
    { name: 'VANILLA CAKE', hkg: 290, kg: 590, sp: 800 },
    { name: 'PINEAPPLE CAKE', hkg: 290, kg: 590, sp: 800 },
    { name: 'STRAWBERRY CAKE', hkg: 290, kg: 590, sp: 800 },
    { name: 'MANGO CAKE', hkg: 290, kg: 590, sp: 800 },
    { name: 'BUTTER SCOTCH CAKE', hkg: 290, kg: 590, sp: 800 },
    { name: 'WHITE FOREST CAKE', hkg: 300, kg: 590, sp: 800 },
    { name: 'CHOCO CHIPS CAKE', hkg: 350, kg: 700, sp: 900 },
    { name: 'MIX FRUIT CAKE', hkg: 290, kg: 590, sp: 800 },
    { name: 'BLACK FOREST CAKE', hkg: 290, kg: 590, sp: 800 },
    { name: 'CHOCOLATE TRUFFLE CAKE', hkg: 400, kg: 800, sp: 1000 },
    { name: 'RASMALAI CAKE', hkg: 300, kg: 600, sp: 800 },
    { name: 'RED VELVET CAKE', hkg: 350, kg: 700, sp: 900 },
    { name: 'OREO CAKE', hkg: 300, kg: 600, sp: 800 },
    { name: 'DOLL CAKE', hkg: 350, kg: 650, sp: 800 },
    { name: 'SPIDER MAN CAKE', hkg: 350, kg: 650, sp: 900 },
    { name: 'DORAEMON CAKE', hkg: 350, kg: 650, sp: 900 },
    { name: 'BLACK CURRENT CAKE', hkg: 300, kg: 600, sp: 800 },
  ],
  surpriseCakes: [
    { name: 'KITKAT CAKE', hkg: 550, kg: 1000, sp: 1200 },
    { name: 'DAIRYMILK CAKE', hkg: 550, kg: 1000, sp: 1200 },
    { name: 'BOMB CAKE', hkg: 500, kg: null, sp: 700 },
    { name: 'FUNNY CAKE', hkg: 350, kg: 700, sp: null },
  ]
};

async function getOrCreateCategory(name: string) {
  let cat = await prisma.category.findFirst({
    where: { name }
  });
  if (!cat) {
    cat = await prisma.category.create({
      data: { name, description: name }
    });
  }
  return cat;
}

async function upsertProduct(name: string, price: number, categoryId: string, isCustomizable: boolean = false, customizationOptions: string | null = null) {
  let prod = await prisma.product.findFirst({
    where: { name: { equals: name } }
  });
  if (prod) {
    prod = await prisma.product.update({
      where: { id: prod.id },
      data: { price, categoryId, isCustomizable, customizationOptions, stockLevel: prod.stockLevel || 100 }
    });
  } else {
    prod = await prisma.product.create({
      data: { name, description: name, price, categoryId, isCustomizable, customizationOptions, stockLevel: 100 }
    });
  }
  return prod;
}

async function run() {
  const drinksCat = await getOrCreateCategory('Drinks');
  const snacksCat = await getOrCreateCategory('Snacks');
  const regularCakesCat = await getOrCreateCategory('Regular Cakes');
  const surpriseCakesCat = await getOrCreateCategory('Surprise Cakes');

  console.log('Upserting drinks...');
  for (const item of menu.drinks) {
    await upsertProduct(item.name, item.price, drinksCat.id);
  }

  console.log('Upserting snacks...');
  for (const item of menu.snacks) {
    await upsertProduct(item.name, item.price, snacksCat.id);
  }

  console.log('Upserting regular cakes...');
  for (const item of menu.regularCakes) {
    if (item.hkg) await upsertProduct(`${item.name} (1/2 Kg)`, item.hkg, regularCakesCat.id, true, JSON.stringify([{ name: 'Flavor Notes', type: 'text', required: false, options: [] }, { name: 'Message on Cake', type: 'text', required: false, options: [] }]));
    if (item.kg) await upsertProduct(`${item.name} (1 Kg)`, item.kg, regularCakesCat.id, true, JSON.stringify([{ name: 'Flavor Notes', type: 'text', required: false, options: [] }, { name: 'Message on Cake', type: 'text', required: false, options: [] }]));
    if (item.sp) await upsertProduct(`${item.name} (Special)`, item.sp, regularCakesCat.id, true, JSON.stringify([{ name: 'Flavor Notes', type: 'text', required: false, options: [] }, { name: 'Message on Cake', type: 'text', required: false, options: [] }]));
  }

  console.log('Upserting surprise cakes...');
  for (const item of menu.surpriseCakes) {
    if (item.hkg) await upsertProduct(`${item.name} (1/2 Kg)`, item.hkg, surpriseCakesCat.id, true, JSON.stringify([{ name: 'Message on Cake', type: 'text', required: false, options: [] }]));
    if (item.kg) await upsertProduct(`${item.name} (1 Kg)`, item.kg, surpriseCakesCat.id, true, JSON.stringify([{ name: 'Message on Cake', type: 'text', required: false, options: [] }]));
    if (item.sp) await upsertProduct(`${item.name} (Special)`, item.sp, surpriseCakesCat.id, true, JSON.stringify([{ name: 'Message on Cake', type: 'text', required: false, options: [] }]));
  }

  console.log('Done!');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
