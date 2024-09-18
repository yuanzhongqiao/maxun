import { default as axios } from "axios";

// todo: proper typescript types for params
export const handleUploadCredentials = async (fileName: any, credentials: any, spreadsheetId: any, range: any) => {
    try {
        await axios.post('http://localhost:8080/integration/upload-credentials', { fileName, credentials: JSON.parse(credentials), spreadsheetId, range });
        alert('Service Account credentials saved successfully.');
    } catch (error) {
        console.error('Error uploading credentials:', error);
        alert('Failed to upload credentials.');
    }
};