import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/db/prisma";

// Run with: npx prisma db seed
// Wipes menu + table data and re-inserts it, so it's safe to run repeatedly.

async function main() {
  // Delete in FK order: reservations reference tables, dishes reference categories.
  await prisma.reservation.deleteMany();
  await prisma.table.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.category.deleteMany();

  await prisma.category.create({
    data: {
      name: "Entrantes",
      displayOrder: 1,
      dishes: {
        create: [
          {
            name: "Croquetas caseras de jamón ibérico",
            description: "Cremosas por dentro, crujientes por fuera. 8 unidades.",
            price: 8.5,
          },
          {
            name: "Tortilla de patatas",
            description: "Jugosa, con cebolla caramelizada. Receta de la casa.",
            price: 6.9,
          },
          {
            name: "Gazpacho andaluz",
            description: "Tomate, pepino y pimiento, con un toque de aceite de oliva virgen extra.",
            price: 5.5,
          },
          {
            name: "Pimientos de Padrón",
            description: "Fritos en aceite de oliva con escamas de sal marina.",
            price: 7.0,
          },
          {
            name: "Jamón ibérico de bellota",
            description: "Cortado a cuchillo, con picos artesanos.",
            price: 16.5,
          },
        ],
      },
    },
  });

  await prisma.category.create({
    data: {
      name: "Principales",
      displayOrder: 2,
      dishes: {
        create: [
          {
            name: "Paella de marisco",
            description: "Arroz bomba con gambas, mejillones y calamar. Mínimo 2 personas, precio por persona.",
            price: 16.0,
          },
          {
            name: "Solomillo de ternera",
            description: "A la parrilla, con patatas panadera y pimientos asados.",
            price: 21.9,
          },
          {
            name: "Merluza a la vasca",
            description: "En salsa verde con almejas y espárragos.",
            price: 17.5,
          },
          {
            name: "Fideuà de sepia",
            description: "Fideos dorados con sepia y alioli casero.",
            price: 15.5,
          },
          {
            name: "Pollo al ajillo",
            description: "Guisado a fuego lento con ajo, vino blanco y romero.",
            price: 14.5,
          },
        ],
      },
    },
  });

  await prisma.category.create({
    data: {
      name: "Postres",
      displayOrder: 3,
      dishes: {
        create: [
          {
            name: "Crema catalana",
            description: "Con azúcar caramelizado al momento.",
            price: 5.9,
          },
          {
            name: "Tarta de Santiago",
            description: "Almendra marcona y un toque de limón. Sin gluten.",
            price: 6.5,
          },
          {
            name: "Flan de huevo casero",
            description: "Con nata montada y caramelo.",
            price: 4.9,
          },
          {
            name: "Arroz con leche",
            description: "Cremoso, con canela y piel de limón.",
            price: 4.5,
          },
        ],
      },
    },
  });

  await prisma.category.create({
    data: {
      name: "Bebidas",
      displayOrder: 4,
      dishes: {
        create: [
          {
            name: "Agua mineral",
            description: "Botella 50cl, fría o del tiempo.",
            price: 2.0,
          },
          {
            name: "Caña de cerveza",
            description: "Mahou de barril, bien tirada.",
            price: 2.5,
          },
          {
            name: "Copa de Rioja crianza",
            description: "Tempranillo con 12 meses en barrica.",
            price: 3.8,
          },
          {
            name: "Sangría de la casa",
            description: "Jarra de 1 litro con fruta fresca.",
            price: 12.0,
          },
          {
            name: "Café",
            description: "Solo, cortado o con leche.",
            price: 1.6,
          },
        ],
      },
    },
  });

  // The restaurant floor: 8 tables, 26 seats total.
  // Availability logic (Day 5-6) assigns these to reservations.
  await prisma.table.createMany({
    data: [
      { name: "Mesa 1", capacity: 2 },
      { name: "Mesa 2", capacity: 2 },
      { name: "Mesa 3", capacity: 4 },
      { name: "Mesa 4", capacity: 4 },
      { name: "Mesa 5", capacity: 4 },
      { name: "Mesa 6", capacity: 6 },
      { name: "Terraza 1", capacity: 2 },
      { name: "Terraza 2", capacity: 2 },
    ],
  });

  // Default opening hours — only created if missing, so re-seeding never
  // overwrites hours the owner has customised in the admin panel.
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      timeSlots: ["13:00", "13:30", "14:00", "14:30", "15:00", "20:00", "20:30", "21:00", "21:30", "22:00"],
      maxPartySize: 6,
    },
  });

  // Admin user — credentials come from .env, never from code.
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before seeding");
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  const dishes = await prisma.dish.count();
  const tables = await prisma.table.count();
  console.log(`Seeded ${dishes} dishes in 4 categories, ${tables} tables and admin ${email}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
