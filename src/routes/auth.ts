import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function authRoutes(server: FastifyInstance) {
  server.post('/mobile-login', async (request, reply) => {
    const validation = loginSchema.safeParse(request.body);

    if (!validation.success) {
      return reply.status(400).send({
        error: 'E-mail ou senha em formato inválido.',
        details: validation.error.format()
      });
    }

    const { email, password } = validation.data;

    // Busca o usuário e inclui a organização
    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });

    if (!user) {
      return reply.status(401).send({ error: 'Credenciais inválidas.' });
    }

    // Verifica a senha
    const isPasswordValid = await bcrypt.compare(password, user.senhaHash);

    if (!isPasswordValid) {
      return reply.status(401).send({ error: 'Credenciais inválidas.' });
    }

    // Busca a ApiKey ativa vinculada à Organização do usuário
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        organizationId: user.organizationId,
        active: true,
      },
    });

    if (!apiKey) {
      return reply.status(403).send({ error: 'Nenhuma chave de API ativa encontrada para esta empresa.' });
    }

    return reply.send({
      success: true,
      user: {
        id: user.id,
        nome: user.nomeCompleto,
        email: user.email,
        perfil: user.perfil,
        organizationId: user.organizationId,
        organizationName: user.organization.name,
      },
      apiKey: apiKey.key,
    });
  });
}
