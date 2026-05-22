const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const surpriseCakes = [
  { name: 'KITKAT CAKE (1/2 Kg)', price: 550 },
  { name: 'KITKAT CAKE (1 Kg)', price: 1000 },
  { name: 'KITKAT CAKE (Special)', price: 1200 },
  { name: 'DAIRYMILK CAKE (1/2 Kg)', price: 550 },
  { name: 'DAIRYMILK CAKE (1 Kg)', price: 1000 },
  { name: 'DAIRYMILK CAKE (Special)', price: 1200 },
  { name: 'BOMB CAKE (1/2 Kg)', price: 500 },
  { name: 'BOMB CAKE (Special)', price: 700 },
  { name: 'FUNNY CAKE (1/2 Kg)', price: 350 },
  { name: 'FUNNY CAKE (1 Kg)', price: 700 },
];

async function main() {
  const name = 'Surprise cakes';
  let cat = await prisma.category.findUnique({ where: { name } });
  if (!cat) {
    cat = await prisma.category.create({
      data: { name, description: name }
    });
    console.log('Category added successfully.');
  } else {
    console.log('Category already exists.');
  }

  for (const item of surpriseCakes) {
    const existing = await prisma.product.findFirst({
      where: {
        name: item.name,
        categoryId: cat.id
      }
    });

    if (!existing) {
      await prisma.product.create({
        data: {
          name: item.name,
          price: item.price,
          description: item.name,
          categoryId: cat.id,
          stockLevel: 100
        }
      });
      console.log(`Added ${item.name}`);
    } else {
      console.log(`Already exists: ${item.name}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
