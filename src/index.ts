import fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { quotationRoutes } from './routes/quotations';
import { syncRoutes } from './routes/sync';
import { authMiddleware } from './middlewares/auth';

const server = fastify({
  logger: true,
});

// Configuração de CORS
server.register(cors, {
  origin: true, // Permitir todas as origens por enquanto (ajustar em prod)
});

// Configuração do Swagger para Documentação
server.register(swagger, {
  swagger: {
    info: {
      title: 'Vinyl Public API',
      description: 'API for external integrations and Vinyl Cote mobile app',
      version: '1.0.0',
    },
    securityDefinitions: {
      apiKey: {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
      },
    },
  },
});

server.register(swaggerUi, {
  routePrefix: '/docs',
});

import { authRoutes } from './routes/auth';

// Registro de Rotas Públicas
server.register(async (instance) => {
  instance.register(authRoutes, { prefix: '/auth' });
}, { prefix: '/v1' });

// Registro de Rotas com Autenticação (Requerem ApiKey)
server.register(async (instance) => {
  instance.addHook('preHandler', authMiddleware);
  instance.register(quotationRoutes, { prefix: '/quotations' });
  instance.register(syncRoutes, { prefix: '/sync' });
}, { prefix: '/v1' });

// Health Check
server.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3001;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Vinyl API running at http://localhost:${port}`);
    console.log(`📝 Documentation available at http://localhost:${port}/docs`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
