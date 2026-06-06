import { PrismaClient, Condition } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Categorías principales (según spec)
const categories = [
  { name: "Ropa y calzado", slug: "ropa-calzado", icon: "Shirt", order: 1 },
  { name: "Electrónica", slug: "electronica", icon: "Smartphone", order: 2 },
  { name: "Muebles y hogar", slug: "muebles-hogar", icon: "Sofa", order: 3 },
  { name: "Juguetes", slug: "juguetes", icon: "ToyBrick", order: 4 },
  { name: "Libros", slug: "libros", icon: "BookOpen", order: 5 },
  { name: "Deportes", slug: "deportes", icon: "Dumbbell", order: 6 },
  { name: "Otros", slug: "otros", icon: "Package", order: 7 },
];

async function main() {
  console.log("🌱 Seeding...");

  // Categorías
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, icon: c.icon, order: c.order },
      create: c,
    });
  }
  console.log(`✓ ${categories.length} categorías`);

  // Usuario admin
  const adminPass = await bcrypt.hash("admin1234", 10);
  await prisma.user.upsert({
    where: { email: "admin@reven.ar" },
    update: {},
    create: {
      firstName: "Admin",
      lastName: "Reven",
      email: "admin@reven.ar",
      passwordHash: adminPass,
      province: "Buenos Aires",
      city: "CABA",
      role: "ADMIN",
      verification: "VERIFIED",
      emailVerified: new Date(),
    },
  });
  console.log("✓ admin@reven.ar (pass: admin1234)");

  // Usuario demo verificado, con ubicación en CABA (Obelisco)
  const demoPass = await bcrypt.hash("demo1234", 10);
  const demo = await prisma.user.upsert({
    where: { email: "demo@reven.ar" },
    update: {},
    create: {
      firstName: "Vanesa",
      lastName: "Gómez",
      email: "demo@reven.ar",
      passwordHash: demoPass,
      province: "Buenos Aires",
      city: "CABA",
      latitude: -34.6037,
      longitude: -58.3816,
      verification: "VERIFIED",
      emailVerified: new Date(),
    },
  });
  console.log("✓ demo@reven.ar (pass: demo1234) — verificado");

  // Un par de publicaciones de ejemplo del usuario demo
  const electro = await prisma.category.findUnique({ where: { slug: "electronica" } });
  const muebles = await prisma.category.findUnique({ where: { slug: "muebles-hogar" } });

  const sampleCount = await prisma.listing.count({ where: { sellerId: demo.id } });
  if (sampleCount === 0 && electro && muebles) {
    await prisma.listing.create({
      data: {
        title: "iPhone 12 64GB — impecable",
        description:
          "Vendo iPhone 12 negro, 64GB. Batería 89%. Sin detalles, siempre con funda y vidrio. Incluye caja y cable.",
        price: 320000,
        condition: Condition.VERY_GOOD,
        categoryId: electro.id,
        province: "Buenos Aires",
        city: "CABA",
        neighborhood: "Palermo",
        latitude: -34.5889,
        longitude: -58.4306,
        sellerId: demo.id,
        images: {
          create: [
            {
              url: "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=800&q=80",
              position: 0,
            },
          ],
        },
      },
    });

    await prisma.listing.create({
      data: {
        title: "Sillón de 2 cuerpos — gris, muy buen estado",
        description:
          "Sillón de 2 cuerpos color gris, tapizado en pana. Muy cómodo, poco uso, sin manchas ni roturas. Se retira en Caballito.",
        price: 180000,
        condition: Condition.VERY_GOOD,
        categoryId: muebles.id,
        province: "Buenos Aires",
        city: "CABA",
        neighborhood: "Caballito",
        latitude: -34.6189,
        longitude: -58.4416,
        sellerId: demo.id,
        featuredUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // destacado de ejemplo
        images: {
          create: [
            {
              url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80",
              position: 0,
            },
          ],
        },
      },
    });
    console.log("✓ 2 publicaciones de ejemplo");
  }

  console.log("✅ Seed completo");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
