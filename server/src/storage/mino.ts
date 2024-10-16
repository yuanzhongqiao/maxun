import { Client } from 'minio';
import Run from '../models/Run';

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minio-access-key',
  secretKey: process.env.MINIO_SECRET_KEY || 'minio-secret-key',
});

minioClient.bucketExists('maxun-test')
  .then((exists) => {
    if (exists) {
      console.log('MinIO was connected successfully.');
    } else {
      console.log('Bucket does not exist, but MinIO was connected.');
    }
  })
  .catch((err) => {
    console.error('Error connecting to MinIO:', err);
  })

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
    const plainRun = run.toJSON();

    for (const key of Object.keys(binaryOutput)) {
      let binaryData = binaryOutput[key];

      if (!plainRun.runId) {
        console.error('Run ID is undefined. Cannot upload binary data.');
        continue;
      }

      console.log(`Processing binary output key: ${key}`);
      console.log(`Binary data:`, binaryData);

      // Check if binaryData has a valid Buffer structure and parse it
      if (binaryData && typeof binaryData.data === 'string') {
        try {
          const parsedData = JSON.parse(binaryData.data);
          if (parsedData && parsedData.type === 'Buffer' && Array.isArray(parsedData.data)) {
            binaryData = Buffer.from(parsedData.data);
          } else {
            console.error(`Invalid Buffer format for key: ${key}`);
            continue;
          }
        } catch (error) {
          console.error(`Failed to parse JSON for key: ${key}`, error);
          continue;
        }
      }

      // Handle cases where binaryData might not be a Buffer
      if (!Buffer.isBuffer(binaryData)) {
        console.error(`Binary data for key ${key} is not a valid Buffer.`);
        continue;
      }

      try {
        const minioKey = `${plainRun.runId}/${key}`;

        await this.uploadBinaryOutputToMinioBucket(run, minioKey, binaryData);

        // Save the Minio URL in the result object
        uploadedBinaryOutput[key] = `minio://${this.bucketName}/${minioKey}`;
      } catch (error) {
        console.error(`Error uploading key ${key} to MinIO:`, error);
      }
    }

    console.log('Uploaded Binary Output:', uploadedBinaryOutput);

    try {
      await run.update({ binaryOutput: uploadedBinaryOutput });
      console.log('Run successfully updated with binary output');
    } catch (updateError) {
      console.error('Error updating run with binary output:', updateError);
    }

    return uploadedBinaryOutput;
  }

  async uploadBinaryOutputToMinioBucket(run: Run, key: string, data: Buffer): Promise<void> {
    const bucketName = 'maxun-run-screenshots';
    try {
      console.log(`Uploading to bucket ${bucketName} with key ${key}`);
      await minioClient.putObject(bucketName, key, data, data.length, { 'Content-Type': 'image/png' });
      const plainRun = run.toJSON();
      plainRun.binaryOutput[key] = `minio://${bucketName}/${key}`;
      console.log(`Successfully uploaded to MinIO: minio://${bucketName}/${key}`);
    } catch (error) {
      console.error(`Error uploading to MinIO bucket: ${bucketName} with key: ${key}`, error);
      throw error;
    }
  }
}

export { minioClient, BinaryOutputService };