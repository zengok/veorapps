import { PrismaClient, Category } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seed başlıyor...');

  // ── Kullanıcılar ──────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('veor2025', 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'ortak1@veor.com' },
      update: {},
      create: { email: 'ortak1@veor.com', password: hashedPassword, name: 'Ortak 1' },
    }),
    prisma.user.upsert({
      where: { email: 'ortak2@veor.com' },
      update: {},
      create: { email: 'ortak2@veor.com', password: hashedPassword, name: 'Ortak 2' },
    }),
    prisma.user.upsert({
      where: { email: 'ortak3@veor.com' },
      update: {},
      create: { email: 'ortak3@veor.com', password: hashedPassword, name: 'Ortak 3' },
    }),
  ]);

  console.log(`✓ ${users.length} kullanıcı eklendi`);

  // ── Ürünler ───────────────────────────────────────────────────────────────
  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: 'prod-women-001' },
      update: {},
      create: {
        id: 'prod-women-001',
        name: 'Veor Rose Elixir',
        category: Category.WOMEN,
        price: 850.00,
        stock: 25,
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-women-002' },
      update: {},
      create: {
        id: 'prod-women-002',
        name: 'Veor Jasmine Noir',
        category: Category.WOMEN,
        price: 750.00,
        stock: 18,
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-men-001' },
      update: {},
      create: {
        id: 'prod-men-001',
        name: 'Veor Oud Intense',
        category: Category.MEN,
        price: 950.00,
        stock: 12,
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-men-002' },
      update: {},
      create: {
        id: 'prod-men-002',
        name: 'Veor Black Cedar',
        category: Category.MEN,
        price: 800.00,
        stock: 20,
        isActive: true,
      },
    }),
  ]);

  console.log(`✓ ${products.length} ürün eklendi`);
  console.log('\nSeed tamamlandı.');
  console.log('\nGiriş bilgileri:');
  console.log('  ortak1@veor.com / veor2025');
  console.log('  ortak2@veor.com / veor2025');
  console.log('  ortak3@veor.com / veor2025');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
