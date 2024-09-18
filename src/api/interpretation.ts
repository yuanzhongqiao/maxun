import { default as axios } from "axios";

// todo: proper typescript types for params
export const handleUploadCredentials = async (credentials: any) => {
    try {
        await axios.post('http://localhost:8080/integration/upload-credentials', { credentials: JSON.parse(credentials) });
        alert('Service Account credentials saved successfully.');
    } catch (error) {
        console.error('Error uploading credentials:', error);
        alert('Failed to upload credentials.');
    }
};