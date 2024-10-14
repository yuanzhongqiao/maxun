import { Client } from 'minio';

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minio-access-key',
  secretKey: process.env.MINIO_SECRET_KEY || 'minio-secret-key',
});


export default minioClient;