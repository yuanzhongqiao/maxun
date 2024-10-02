import { Router, Request, Response } from 'express';
import User from '../models/User';
import { hashPassword } from '../utils/auth';
import { requireSignIn } from '../middlewares/auth';

export const router = Router();

interface AuthenticatedRequest extends Request {
    user?: { id: string };
}

router.post('/config', requireSignIn, async (req: AuthenticatedRequest, res: Response) => {
    const { server_url, username, password } = req.body;

    try {

        if (!req.user) {
            return res.status(401).json({ ok: false, error: 'Unauthorized' });
        }

        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] },
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!server_url) {
            return res.status(400).send('Proxy URL is required');
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
