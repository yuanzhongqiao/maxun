import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Maxun API Documentation',
      version: '1.0.0',
      description: 'API documentation for robot management',
    },
    components: {
      securitySchemes: {
        api_key: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API key for authorization. You can find your API key in the "API Key" section on Maxun Dashboard.',
        },
      },
    },
    security: [
      {
        api_key: [], // Apply this security scheme globally
      },
    ],
  },
  apis: [path.join(__dirname, '../api/*.ts')],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
