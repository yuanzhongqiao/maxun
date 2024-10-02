import { Router, Request, Response } from 'express';
import User from '../models/User';
import { hashPassword, comparePassword } from '../utils/auth';

export const router = Router();

router.post('/config', async (req: Request, res: Response) => {
    const { server_url, username, password } = req.body;

    try {
        if (!server_url) {
            return res.status(400).send('Proxy URL is required');
        }

        const userId = 1;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        let hashedProxyUsername: string | null = null;
        let hashedProxyPassword: string | null = null;

        if (username && password) {
            hashedProxyUsername = await hashPassword(username);
            hashedProxyPassword = await hashPassword(password);
        } else if (username && !password) {
            return res.status(400).send('Proxy password is required when proxy username is provided');
        }

        user.proxy_url = server_url;
        user.proxy_username = hashedProxyUsername;
        user.proxy_password = hashedProxyPassword;

        await user.save();

        res.status(200).send('Proxy configuration saved successfully');
    } catch (error: any) {
        res.status(500).send(`Could not save proxy configuration - ${error.message}`);
    }
});
