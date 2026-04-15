import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const apiKey = request.headers['x-api-key'] as string;

  if (!apiKey) {
    return reply.status(401).send({ error: 'API Key is missing' });
  }

  const keyRecord = await prisma.apiKey.findUnique({
    where: { key: apiKey },
    include: { organization: true },
  });

  if (!keyRecord || !keyRecord.active) {
    return reply.status(401).send({ error: 'Invalid or inactive API Key' });
  }

  // Atualiza a data de último uso (em background)
  prisma.apiKey.update({
    where: { id: keyRecord.id },
    data: { lastUsedAt: new Date() },
  }).catch(console.error);

  // Anexa o ID da organização ao request para uso nas rotas
  (request as any).organizationId = keyRecord.organizationId;
}
