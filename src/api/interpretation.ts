import { default as axios } from "axios";

// todo: proper typescript types for params
export const handleUploadCredentials = async (fileName: any, credentials: any, spreadsheetId: any, range: any): Promise<boolean> => {
    try {
        const response = await axios.post('http://localhost:8080/integration/upload-credentials', { fileName, credentials: JSON.parse(credentials), spreadsheetId, range });
        if (response.status === 200) {
            return response.data;
          } else {
            throw new Error(`Couldn't make gsheet integration for ${fileName}`);
        }
    } catch (error) {
        console.error('Error uploading credentials:', error);
        return false;
    }
};

export const handleWriteToGsheet = async (fileName: string, runId: string): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
        const response = await axios.post(`http://localhost:8080/integration/update-google-sheet/${fileName}/${runId}`);
        if (response.status === 200) {
            return response.data;
          } else {
            throw new Error(`Couldn't make gsheet integration for ${fileName}`);
        }
    } catch (error) {
        console.error('Error uploading credentials:', error);
        return { success: false, message: 'Failed to write to Google Sheet' };
    }
};