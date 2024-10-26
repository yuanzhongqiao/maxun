import { default as axios } from "axios";

export const sendProxyConfig = async (proxyConfig: { server_url: string, username?: string, password?: string }): Promise<boolean> => {
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

export const getProxyConfig = async (): Promise<{ proxy_url: string, auth: boolean }> => {
    try {
        const response = await axios.get(`http://localhost:8080/proxy/config`);
        if (response.status === 200) {
            return response.data;
        } else {
            throw new Error(`Failed to fetch proxy configuration. Try again.`);
        }
    } catch (error: any) {
        console.log(error);
        return { proxy_url: '', auth: false };
    }
}

export const testProxyConfig = async (): Promise<{ success: boolean }> => {
    try {
        const response = await axios.get(`http://localhost:8080/proxy/test`);
        if (response.status === 200) {
            return response.data;
        } else {
            throw new Error(`Failed to test proxy configuration. Try again.`);
        }
    } catch (error: any) {
        console.log(error);
        return { success: false };
    }
}