import { default as axios } from "axios";

export const getUserById = async (userId: string) => {
    try {
        const response = await axios.get(`http://localhost:8080/auth/user/${userId}`);
        if (response.status === 200) {
            return response.data;
        } else {
            throw new Error(`Couldn't get user with id ${userId}`);
        }
    } catch (error: any) {
        console.error(error);
        return null;
    }
}