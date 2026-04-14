import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function quotationRoutes(server: FastifyInstance) {
  // GET /v1/quotations
  server.get('/', async (request, reply) => {
    // Aqui usaremos a API Key do Middleware para filtrar por Organização
    const quotations = await prisma.order.findMany({
      where: {
        type: 'QUOTATION',
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    return quotations;
  });

  // POST /v1/quotations
  server.post('/', async (request, reply) => {
    const body = request.body as any;
    
    // WIP: Lógica para criar orçamento simplificado do Mobile
    return { message: 'Endpoint em desenvolvimento', data: body };
  });
}
