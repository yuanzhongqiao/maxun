import { default as axios } from "axios";

// todo: proper typescript types for params
export const handleUploadCredentials = async (fileName: any, credentials: any, spreadsheetId: any, range: any): Promise<boolean> => {
    try {
        const response = await axios.post('http://localhost:8080/integration/upload-credentials', { fileName, credentials: JSON.parse(credentials), spreadsheetId, range });
        if (response.status === 200) {
            alert('Service Account credentials saved successfully.');
            return response.data;
          } else {
            throw new Error(`Couldn't make gsheet integration for ${fileName}`);
        }
    } catch (error) {
        console.error('Error uploading credentials:', error);
        alert('Failed to upload credentials.');
        return false;
    }
};