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
      lastName: "Trato",
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

  // ── Más vendedores y productos de ejemplo (de otras personas) ──
  const cats = await prisma.category.findMany({ select: { id: true, slug: true } });
  const catId = (slug: string) => cats.find((c) => c.slug === slug)!.id;
  const sellerPass = await bcrypt.hash("demo1234", 10);
  const inDays = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);
  const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&q=80`;

  const extraSellers = [
    {
      email: "lucas@reven.ar", firstName: "Lucas", lastName: "Pérez",
      province: "Santa Fe", city: "Rosario", lat: -32.9442, lng: -60.6505,
      listings: [
        { title: "Zapatillas Nike Air Max — talle 42", price: 45000, condition: Condition.VERY_GOOD, cat: "ropa-calzado", barrio: "Centro", img: "1542291026-7eec264c27ff", featured: 0 },
        { title: "Campera de cuero negra — talle L", price: 32000, condition: Condition.GOOD, cat: "ropa-calzado", barrio: "Pichincha", img: "1551028719-00167b16eac5", featured: 0 },
        { title: 'Smart TV Samsung 50" 4K', price: 290000, condition: Condition.GOOD, cat: "electronica", barrio: "Centro", img: "1593359677879-a4bb92f829d1", featured: 7 },
        { title: "Bicicleta mountain bike rodado 29", price: 185000, condition: Condition.VERY_GOOD, cat: "deportes", barrio: "Fisherton", img: "1485965120184-e220f721d03e", featured: 0 },
      ],
    },
    {
      email: "sofia@reven.ar", firstName: "Sofía", lastName: "Díaz",
      province: "Córdoba", city: "Córdoba", lat: -31.4201, lng: -64.1888,
      listings: [
        { title: "Mesa de comedor de madera maciza", price: 120000, condition: Condition.GOOD, cat: "muebles-hogar", barrio: "Nueva Córdoba", img: "1530018607912-eff2daa1bac4", featured: 0 },
        { title: "PlayStation 4 + 2 joysticks", price: 250000, condition: Condition.VERY_GOOD, cat: "electronica", barrio: "Centro", img: "1486401899868-0e435ed85128", featured: 7 },
        { title: "Colección Harry Potter (7 libros)", price: 38000, condition: Condition.GOOD, cat: "libros", barrio: "Güemes", img: "1512820790803-83ca734da794", featured: 0 },
        { title: "Auriculares inalámbricos", price: 28000, condition: Condition.LIKE_NEW, cat: "electronica", barrio: "Centro", img: "1560769629-975ec94e6a86", featured: 0 },
      ],
    },
    {
      email: "martin@reven.ar", firstName: "Martín", lastName: "López",
      province: "Mendoza", city: "Mendoza", lat: -32.8895, lng: -68.8458,
      listings: [
        { title: "Guitarra criolla con funda", price: 55000, condition: Condition.GOOD, cat: "otros", barrio: "Centro", img: "1525201548942-d8732f6617a0", featured: 0 },
        { title: "Escritorio de oficina", price: 60000, condition: Condition.GOOD, cat: "muebles-hogar", barrio: "Godoy Cruz", img: "1518455027359-f3f8164ba6bd", featured: 0 },
        { title: "Pelota de fútbol profesional", price: 18000, condition: Condition.VERY_GOOD, cat: "deportes", barrio: "Centro", img: "1431324155629-1a6deb1dec8d", featured: 0 },
        { title: "Camiseta de fútbol retro", price: 22000, condition: Condition.GOOD, cat: "ropa-calzado", barrio: "Centro", img: "1556905055-8f358a7a47b2", featured: 0 },
      ],
    },
  ];

  for (const s of extraSellers) {
    const u = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        passwordHash: sellerPass,
        province: s.province,
        city: s.city,
        latitude: s.lat,
        longitude: s.lng,
        verification: "VERIFIED",
        emailVerified: new Date(),
      },
    });
    const count = await prisma.listing.count({ where: { sellerId: u.id } });
    if (count === 0) {
      for (const l of s.listings) {
        await prisma.listing.create({
          data: {
            title: l.title,
            description: `${l.title}. En muy buen estado, poco uso. Se entrega en ${s.city}. Cualquier consulta, escribime por el chat.`,
            price: l.price,
            condition: l.condition,
            categoryId: catId(l.cat),
            province: s.province,
            city: s.city,
            neighborhood: l.barrio,
            latitude: s.lat,
            longitude: s.lng,
            sellerId: u.id,
            ...(l.featured ? { featuredUntil: inDays(l.featured) } : {}),
            images: { create: [{ url: img(l.img), position: 0 }] },
          },
        });
      }
      console.log(`✓ ${s.firstName} ${s.lastName}: ${s.listings.length} publicaciones`);
    }
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
