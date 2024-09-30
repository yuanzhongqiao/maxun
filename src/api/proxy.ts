import { default as axios } from "axios";

export const sendProxyConfig = async (proxyConfig: { type: string, server: string, username: string, password: string }): Promise<boolean> => {
    try {
        const response = await axios.post(`http://localhost:8080/proxy/config`, proxyConfig);
        if (response.status === 200) {
            return response.data;
        } else {
            throw new Error(`Failed to submit proxy configuration. Try again.`);
        }
    } catch (error: any) {
        console.log(error);
        return false;
    }
}