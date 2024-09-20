import { default as axios } from "axios";

export const handleUploadCredentials = async (fileName: string, credentials: any, spreadsheetId: string, range: string): Promise<boolean> => {
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
