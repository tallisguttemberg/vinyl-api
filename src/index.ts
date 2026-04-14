import fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { quotationRoutes } from './routes/quotations';

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

// Registro de Rotas
server.register(quotationRoutes, { prefix: '/v1/quotations' });

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
