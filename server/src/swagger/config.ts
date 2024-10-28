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
  },
  apis: [path.join(__dirname, '../api/*.ts')],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
