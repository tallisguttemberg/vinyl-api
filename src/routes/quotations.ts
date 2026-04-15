import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Esquema de validação para um item do orçamento
const quotationItemSchema = z.object({
  serviceTypeId: z.string(),
  materialId: z.string().optional().nullable(),
  width: z.number().default(0),
  height: z.number().default(0),
  quantity: z.number().int().default(1),
  price: z.number().default(0),
  cost: z.number().default(0),
});

// Esquema de validação para o orçamento completo vindo do mobile
const quoteSchema = z.object({
  localId: z.string().optional(), // ID gerado no SQLite mobile
  customerId: z.string().optional().nullable(),
  customerName: z.string().default('Cliente Balcão'),
  totalAmount: z.number().default(0),
  totalCost: z.number().default(0),
  totalServiceCommission: z.number().default(0),
  serviceCommissionRate: z.number().default(0),
  profit: z.number().default(0),
  margin: z.number().default(0),
  aplicadorId: z.string().optional().nullable(),
  items: z.array(quotationItemSchema).default([]),
});

const syncSchema = z.object({
  quotations: z.array(quoteSchema),
});

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
  server.post('/sync', async (request, reply) => {
    const orgId = (request as any).organizationId;
    
    // Validação dos dados com Zod
    const validation = syncSchema.safeParse(request.body);

    if (!validation.success) {
      return reply.status(400).send({
        error: 'Invalid data format',
        details: validation.error.format()
      });
    }

    const { quotations } = validation.data;
    
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
            totalServiceCommission: quote.totalServiceCommission || 0,
            serviceCommissionRate: quote.serviceCommissionRate || 0,
            profit: quote.profit || 0,
            margin: quote.margin || 0,
            aplicadorId: quote.aplicadorId,
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
