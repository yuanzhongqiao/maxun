import { Client } from 'minio';
import Run from '../models/Run';

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minio-access-key',
  secretKey: process.env.MINIO_SECRET_KEY || 'minio-secret-key',
});

class BinaryOutputService {
  private bucketName: string;

  constructor(bucketName: string) {
    this.bucketName = bucketName;
  }

  /**
   * Uploads binary data to Minio and stores references in PostgreSQL.
   * @param run - The run object representing the current process.
   * @param binaryOutput - The binary output object containing data to upload.
   * @returns A map of Minio URLs pointing to the uploaded binary data.
   */
  async uploadAndStoreBinaryOutput(run: Run, binaryOutput: Record<string, any>): Promise<Record<string, string>> {
    const uploadedBinaryOutput: Record<string, string> = {};

    for (const key of Object.keys(binaryOutput)) {
      const binaryData = binaryOutput[key];
      const bufferData = Buffer.from(binaryData, 'binary');
      const minioKey = `${run.runId}/${key}`;

      await run.uploadBinaryOutputToMinioBucket(minioKey, bufferData);

      // Save the Minio URL in the result object
      uploadedBinaryOutput[key] = `minio://${this.bucketName}/${minioKey}`;
    }

    // Update the run with the Minio URLs for binary output
    await run.update({
      binaryOutput: uploadedBinaryOutput
    });

    return uploadedBinaryOutput;
  }
}

export { minioClient, BinaryOutputService };