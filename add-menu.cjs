const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const menuData = [
  // Drinks
  { name: 'TEA', price: 6, categoryName: 'Drinks' },
  { name: 'COFFEE', price: 10, categoryName: 'Drinks' },
  { name: 'COLD COFFEE', price: 50, categoryName: 'Drinks' },
  { name: 'MAJITO', price: 50, categoryName: 'Drinks' },
  { name: 'BLUE CURACAO', price: 60, categoryName: 'Drinks' },
  { name: 'OREO SHAKE', price: 60, categoryName: 'Drinks' },
  { name: 'GINGER LEMORADE', price: 50, categoryName: 'Drinks' },
  { name: 'LIME SODA', price: 30, categoryName: 'Drinks' },
  { name: 'STRAWBERRY MOJITO', price: 40, categoryName: 'Drinks' },
  { name: 'BLACK CURRENT MOJITO', price: 50, categoryName: 'Drinks' },
  { name: 'MANGO MOJITO', price: 50, categoryName: 'Drinks' },
  { name: 'PINE APPLE MOJITO', price: 50, categoryName: 'Drinks' },
  // Snacks
  { name: 'SAMOSA PLATE', price: 15, categoryName: 'Snacks' },
  { name: 'ALOO PUFF', price: 25, categoryName: 'Snacks' },
  { name: 'PANNER PUFF', price: 30, categoryName: 'Snacks' },
  { name: 'MASRUM PUFF', price: 30, categoryName: 'Snacks' },
  { name: 'FRENCH FRIES (100 GRAM)', price: 50, categoryName: 'Snacks' },
  { name: 'BURGUR', price: 50, categoryName: 'Snacks' },
  { name: 'CHESE BURGER', price: 70, categoryName: 'Snacks' },
  { name: 'PANNER PIZZA', price: 130, categoryName: 'Snacks' },
  { name: 'ONION PIZZA', price: 100, categoryName: 'Snacks' },
  { name: 'SWEET CORN PIZZA', price: 120, categoryName: 'Snacks' },
  { name: 'MIX PIZZA', price: 150, categoryName: 'Snacks' },
  { name: 'DOUGH NUT', price: 50, categoryName: 'Snacks' },
  // Regular Cakes (1/2 kg and 1 kg separately)
  { name: 'VANILLA CAKE (1/2 Kg)', price: 290, categoryName: 'Regular Cakes' },
  { name: 'VANILLA CAKE (1 Kg)', price: 590, categoryName: 'Regular Cakes' },
  { name: 'PINEAPPLE CAKE (1/2 Kg)', price: 290, categoryName: 'Regular Cakes' },
  { name: 'PINEAPPLE CAKE (1 Kg)', price: 590, categoryName: 'Regular Cakes' },
  { name: 'STRAWBERRY CAKE (1/2 Kg)', price: 290, categoryName: 'Regular Cakes' },
  { name: 'STRAWBERRY CAKE (1 Kg)', price: 590, categoryName: 'Regular Cakes' },
  { name: 'MANGO CAKE (1/2 Kg)', price: 290, categoryName: 'Regular Cakes' },
  { name: 'MANGO CAKE (1 Kg)', price: 590, categoryName: 'Regular Cakes' },
  { name: 'BUTTER SCATCH CAKE (1/2 Kg)', price: 290, categoryName: 'Regular Cakes' },
  { name: 'BUTTER SCATCH CAKE (1 Kg)', price: 590, categoryName: 'Regular Cakes' },
  { name: 'WHITE FOREST CAKE (1/2 Kg)', price: 300, categoryName: 'Regular Cakes' },
  { name: 'WHITE FOREST CAKE (1 Kg)', price: 590, categoryName: 'Regular Cakes' },
  { name: 'CHOCO CHIPS CAKE (1/2 Kg)', price: 350, categoryName: 'Regular Cakes' },
  { name: 'CHOCO CHIPS CAKE (1 Kg)', price: 700, categoryName: 'Regular Cakes' },
  { name: 'MIX FRUIT CAKE (1/2 Kg)', price: 290, categoryName: 'Regular Cakes' },
  { name: 'MIX FRUIT CAKE (1 Kg)', price: 590, categoryName: 'Regular Cakes' },
  { name: 'BLACK FOREST CAKE (1/2 Kg)', price: 290, categoryName: 'Regular Cakes' },
  { name: 'BLACK FOREST CAKE (1 Kg)', price: 590, categoryName: 'Regular Cakes' },
  { name: 'CHOCOLATE TRUFFLE CAKE (1/2 Kg)', price: 400, categoryName: 'Regular Cakes' },
  { name: 'CHOCOLATE TRUFFLE CAKE (1 Kg)', price: 800, categoryName: 'Regular Cakes' },
  { name: 'RASMALAI CAKE (1/2 Kg)', price: 300, categoryName: 'Regular Cakes' },
  { name: 'RASMALAI CAKE (1 Kg)', price: 600, categoryName: 'Regular Cakes' },
  { name: 'RED VELVET CAKE (1/2 Kg)', price: 350, categoryName: 'Regular Cakes' },
  { name: 'RED VELVET CAKE (1 Kg)', price: 700, categoryName: 'Regular Cakes' },
  { name: 'OREO CAKE (1/2 Kg)', price: 300, categoryName: 'Regular Cakes' },
  { name: 'OREO CAKE (1 Kg)', price: 600, categoryName: 'Regular Cakes' },
  { name: 'DOLL CAKE (1/2 Kg)', price: 350, categoryName: 'Regular Cakes' },
  { name: 'DOLL CAKE (1 Kg)', price: 650, categoryName: 'Regular Cakes' },
  { name: 'SPIDER MAN CAKE (1/2 Kg)', price: 350, categoryName: 'Regular Cakes' },
  { name: 'SPIDER MAN CAKE (1 Kg)', price: 650, categoryName: 'Regular Cakes' },
  { name: 'DOREMAN CAKE (1/2 Kg)', price: 350, categoryName: 'Regular Cakes' },
  { name: 'DOREMAN CAKE (1 Kg)', price: 650, categoryName: 'Regular Cakes' },
  { name: 'BLACK CURRENT CAKE (1/2 Kg)', price: 300, categoryName: 'Regular Cakes' },
  { name: 'BLACK CURRENT CAKE (1 Kg)', price: 600, categoryName: 'Regular Cakes' },
  // Special Cakes
  { name: 'VANILLA CAKE (Special)', price: 800, categoryName: 'Special Cakes' },
  { name: 'PINEAPPLE CAKE (Special)', price: 800, categoryName: 'Special Cakes' },
  { name: 'STRAWBERRY CAKE (Special)', price: 800, categoryName: 'Special Cakes' },
  { name: 'MANGO CAKE (Special)', price: 800, categoryName: 'Special Cakes' },
  { name: 'BUTTER SCATCH CAKE (Special)', price: 800, categoryName: 'Special Cakes' },
  { name: 'WHITE FOREST CAKE (Special)', price: 800, categoryName: 'Special Cakes' },
  { name: 'CHOCO CHIPS CAKE (Special)', price: 900, categoryName: 'Special Cakes' },
  { name: 'MIX FRUIT CAKE (Special)', price: 800, categoryName: 'Special Cakes' },
  { name: 'BLACK FOREST CAKE (Special)', price: 800, categoryName: 'Special Cakes' },
  { name: 'CHOCOLATE TRUFFLE CAKE (Special)', price: 1000, categoryName: 'Special Cakes' },
  { name: 'RASMALAI CAKE (Special)', price: 800, categoryName: 'Special Cakes' },
  { name: 'RED VELVET CAKE (Special)', price: 900, categoryName: 'Special Cakes' },
  { name: 'OREO CAKE (Special)', price: 800, categoryName: 'Special Cakes' },
  { name: 'DOLL CAKE (Special)', price: 800, categoryName: 'Special Cakes' },
  { name: 'SPIDER MAN CAKE (Special)', price: 900, categoryName: 'Special Cakes' },
  { name: 'DOREMAN CAKE (Special)', price: 900, categoryName: 'Special Cakes' },
  { name: 'BLACK CURRENT CAKE (Special)', price: 800, categoryName: 'Special Cakes' }
];

async function main() {
  const categories = {};
  
  // create required categories if not exists
  const targetCategories = ['Drinks', 'Snacks', 'Regular Cakes', 'Special Cakes', 'Surprise cakes'];
  for (const name of targetCategories) {
    let cat = await prisma.category.findUnique({ where: { name } });
    if (!cat) {
      cat = await prisma.category.create({
        data: { name, description: name }
      });
    }
    categories[name] = cat.id;
  }

  // insert products
  for (const item of menuData) {
    const existing = await prisma.product.findFirst({
      where: {
        name: item.name,
        categoryId: categories[item.categoryName]
      }
    });

    if (!existing) {
      await prisma.product.create({
        data: {
          name: item.name,
          price: item.price,
          description: item.name,
          categoryId: categories[item.categoryName],
          stockLevel: 100 // default stock
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
