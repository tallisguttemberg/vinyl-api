import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function quotationRoutes(server: FastifyInstance) {
  server.get('/', async (request, reply) => {
    const orgId = (request as any).organizationId;
    
    const quotations = await prisma.order.findMany({
      where: {
        organizationId: orgId,
        type: 'QUOTATION',
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    return quotations;
  });

  // POST /quotations/sync
  // Recebe orçamentos criados no mobile (modo offline) e os sincroniza com o banco principal.
  server.post('/sync', async (request, reply) => {
    const orgId = (request as any).organizationId;
    const body = request.body as any; // Em produção usaremos Zod ou Typebox para validar a estrutura

    const quotations = Array.isArray(body.quotations) ? body.quotations : [];
    
    if (quotations.length === 0) {
      return { success: true, processed: 0, message: 'Nenhum orçamento para sincronizar.' };
    }

    const syncedResults = [];

    // Processa os orçamentos recebidos um a um
    // Se fossem milhares, usaríamos prisma.$transaction + createMany,
    // mas orçamentos geralmente possuem itens atrelados (nested create).
    for (const quote of quotations) {
      try {
        const order = await prisma.order.create({
          data: {
            organizationId: orgId,
            customerId: quote.customerId,
            customerName: quote.customerName || 'Cliente Balcão',
            type: 'QUOTATION',
            status: 'DRAFT', // Quando chega do mobile vem como rascunho ou cotação direta
            totalAmount: quote.totalAmount || 0,
            totalCost: quote.totalCost || 0,
            totalServiceCommission: 0,
            profit: 0,
            margin: 0,
            // Adicionando os itens aninhados
            items: {
              create: (quote.items || []).map((item: any) => ({
                serviceTypeId: item.serviceTypeId,
                materialId: item.materialId,
                width: item.width || 0,
                height: item.height || 0,
                quantity: item.quantity || 1,
                price: item.price || 0,
                cost: item.cost || 0,
              }))
            }
          }
        });
        
        syncedResults.push({ localId: quote.localId, serverId: order.id, status: 'success' });
      } catch (err) {
        console.error('Erro ao sincronizar orçamento:', err);
        syncedResults.push({ localId: quote.localId, status: 'error', reason: String(err) });
      }
    }

    return {
      success: true,
      processed: syncedResults.length,
      results: syncedResults
    };
  });
}
