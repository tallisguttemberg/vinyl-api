import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const orgId = 'test-org-id';

  // Verifica se a organização de teste existe
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    console.error('A organização de teste não existe. Execute primeiro a criação da key.');
    process.exit(1);
  }

  // Cria a hash para a senha '123456'
  const senhaHash = await bcrypt.hash('123456', 10);

  const user = await prisma.user.upsert({
    where: { email: 'tallis@test.com' },
    update: {
      senhaHash, // Atualiza a senha caso mude o algoritmo
    },
    create: {
      organizationId: orgId,
      usuario: 'tallis_mobile',
      nomeCompleto: 'Tallis Guttemberg (Vendedor)',
      email: 'tallis@test.com',
      senhaHash,
      perfil: 'OPERADOR', // Um aplicador de campo
      status: 'ATIVO',
    },
  });

  console.log('✅ Usuário de teste criado/atualizado com sucesso!');
  console.log('--- CREDENCIAIS MOBILE ---');
  console.log(`Email: tallis@test.com`);
  console.log(`Senha: 123456`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
