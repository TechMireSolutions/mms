import { type FastifyInstance } from 'fastify';
import { generateOpenApi } from '@ts-rest/open-api';
import { rootContract } from '@mms/shared';

export default async function openapiRoutes(app: FastifyInstance) {
  app.get('/api/openapi.json', async () => {
    return generateOpenApi(rootContract, {
      info: {
        title: 'MMS API',
        version: '1.0.0',
      },
    });
  });
}
