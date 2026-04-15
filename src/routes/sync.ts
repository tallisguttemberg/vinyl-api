import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function syncRoutes(server: FastifyInstance) {
  // GET /v1/sync/catalog
  // Retorna os dados base necessários para o app funcionar offline.
  server.get('/catalog', async (request, reply) => {
    const orgId = (request as any).organizationId;

    // Buscamos apenas os campos mais leves e essenciais para a operação mobile.
    const [customers, materials, services] = await Promise.all([
      prisma.customer.findMany({
        where: { organizationId: orgId },
        select: { id: true, name: true, phone: true, document: true }
      }),
      prisma.material.findMany({
        where: { organizationId: orgId },
        select: { id: true, name: true, costPerSqMeter: true, costPerLinearMeter: true, unit: true }
      }),
      prisma.serviceType.findMany({
        where: { organizationId: orgId },
        select: { id: true, name: true, defaultPrice: true, billingType: true }
      }),
    ]);

    return {
      success: true,
      data: {
        customers,
        materials,
        services,
      },
      syncedAt: new Date().toISOString()
    };
  });
}
