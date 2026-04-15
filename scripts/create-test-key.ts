import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Garantir que temos uma organização para o teste
  const org = await prisma.organization.upsert({
    where: { id: 'test-org-id' },
    update: {},
    create: {
      id: 'test-org-id',
      name: 'Empresa Teste API',
      document: '12345678901',
      status: 'ACTIVE',
    },
  });

  console.log(`✅ Organização verificada: ${org.name} (${org.id})`);

  // 2. Criar uma API Key de teste
  const apiKey = await prisma.apiKey.upsert({
    where: { key: 'vinyl_test_key_2026' },
    update: { active: true },
    create: {
      name: 'Chave de Desenvolvimento',
      key: 'vinyl_test_key_2026',
      organizationId: org.id,
      active: true,
    },
  });

  console.log(`🚀 API Key pronta para uso: ${apiKey.key}`);
  console.log(`Use o header: x-api-key: ${apiKey.key}`);

  // 3. Criar alguns dados de catálogo para teste
  await prisma.supplier.upsert({
    where: { id: 'dummy-supplier' },
    update: {},
    create: {
      id: 'dummy-supplier',
      name: 'Fornecedor Master',
      organizationId: org.id,
    },
  });

  await prisma.serviceType.upsert({
    where: { id: 'serv-test-1' },
    update: {},
    create: {
      id: 'serv-test-1',
      organizationId: org.id,
      name: 'Adesivagem de Frota',
      billingType: 'PER_M2',
      defaultPrice: 150.00,
    }
  });

  await prisma.material.upsert({
    where: { id: 'mat-test-1' },
    update: {},
    create: {
      id: 'mat-test-1',
      organizationId: org.id,
      name: 'Vinil Brilho 3M',
      pricePerRoll: 1200.00,
      costPerSqMeter: 45.00,
      supplierId: 'dummy-supplier',
    }
  });

  console.log(`📦 Dados de catálogo criados para teste.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
