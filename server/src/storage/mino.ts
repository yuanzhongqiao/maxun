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

    for (const key of Object.keys(binaryOutput)) {
      let binaryData = binaryOutput[key];

      // Log the key and data
      console.log(`Processing binary output key: ${key}`);
      console.log(`Binary data:`, binaryData);

      // Check if binaryData is an object with a "data" field (containing the Buffer string)
      if (binaryData && typeof binaryData.data === 'string') {
        try {
          const parsedData = JSON.parse(binaryData.data);

          // Check if the parsed data has the "type" and "data" fields
          if (parsedData && parsedData.type === 'Buffer' && Array.isArray(parsedData.data)) {
            // Convert the parsed array into a Buffer
            binaryData = Buffer.from(parsedData.data);
            console.log(`Successfully parsed and converted binary data to Buffer for key: ${key}`);
          } else {
            console.error(`Invalid Buffer format for key: ${key}`);
            continue; // Skip invalid data
          }
        } catch (jsonError) {
          console.error(`Failed to parse JSON for key: ${key}`, jsonError);
          continue; // Skip if parsing fails
        }
      }

      // Handle cases where data might still be invalid
      if (!Buffer.isBuffer(binaryData)) {
        console.error(`Binary data for key ${key} is not a valid Buffer.`);
        continue;
      }

      try {
        const minioKey = run.runId ? `${run.runId}/${key}`: key;

        console.log(`Uploading data to MinIO with key: ${minioKey}`);

        await run.uploadBinaryOutputToMinioBucket(minioKey, binaryData);

        // Save the Minio URL in the result object
        uploadedBinaryOutput[key] = `minio://${this.bucketName}/${minioKey}`;

        console.log(`Successfully uploaded ${key} to MinIO`);
      } catch (error) {
        console.error(`Error uploading key ${key} to MinIO:`, error);
      }
    }

    // Log the binary output after processing
    console.log('Uploaded Binary Output:', uploadedBinaryOutput);

    // Update the run with the Minio URLs for binary output
    try {
      await run.update({
        binaryOutput: uploadedBinaryOutput
      });
      console.log('Run successfully updated with binary output');
    } catch (updateError) {
      console.error('Error updating run with binary output:', updateError);
    }

    return uploadedBinaryOutput;
  }
}

export { minioClient, BinaryOutputService };