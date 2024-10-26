import { Router, Request, Response } from 'express';
import { chromium } from "playwright";
import User from '../models/User';
import { encrypt, decrypt } from '../utils/auth';
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

        const encryptedProxyUrl = encrypt(server_url);
        let encryptedProxyUsername: string | null = null;
        let encryptedProxyPassword: string | null = null;

        if (username && password) {
            encryptedProxyUsername = encrypt(username);
            encryptedProxyPassword = encrypt(password);
        } else if (username && !password) {
            return res.status(400).send('Proxy password is required when proxy username is provided');
        }

        user.proxy_url = encryptedProxyUrl;
        user.proxy_username = encryptedProxyUsername;
        user.proxy_password = encryptedProxyPassword;

        await user.save();

        res.status(200).send('Proxy configuration saved successfully');
    } catch (error: any) {
        res.status(500).send(`Could not save proxy configuration - ${error.message}`);
    }
});

router.get('/test', requireSignIn, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ ok: false, error: 'Unauthorized' });
        }

        const user = await User.findByPk(req.user.id, {
            attributes: ['proxy_url', 'proxy_username', 'proxy_password'],
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const decryptedProxyUrl = user.proxy_url ? decrypt(user.proxy_url) : null;
        const decryptedProxyUsername = user.proxy_username ? decrypt(user.proxy_username) : null;
        const decryptedProxyPassword = user.proxy_password ? decrypt(user.proxy_password) : null;

        const proxyOptions: any = {
            server: decryptedProxyUrl,
            ...(decryptedProxyUsername && decryptedProxyPassword && {
                username: decryptedProxyUsername,
                password: decryptedProxyPassword,
            }),
        };

        const browser = await chromium.launch({
            headless: true,
            proxy: proxyOptions,
        });
        const page = await browser.newPage();
        await page.goto('https://example.com');
        await browser.close();

        res.status(200).send({ success: true });
    } catch (error) {
        res.status(500).send({ success: false, error: 'Proxy connection failed' });
    }
});

router.get('/config', requireSignIn, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const user = await User.findByPk(req.user.id, {
        attributes: ['proxy_url', 'proxy_username', 'proxy_password'],
    });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const auth = user.proxy_username && user.proxy_password ? true : false

    res.status(200).json({
        proxy_url: decryptedProxyUrl,
        auth: auth,
    });
});


// TODO: Move this from here
export const getDecryptedProxyConfig = async (userId: string) => {
    const user = await User.findByPk(userId, {
        attributes: ['proxy_url', 'proxy_username', 'proxy_password'],
    });

    if (!user) {
        throw new Error('User not found');
    }

    const decryptedProxyUrl = user.proxy_url ? decrypt(user.proxy_url) : null;
    const decryptedProxyUsername = user.proxy_username ? decrypt(user.proxy_username) : null;
    const decryptedProxyPassword = user.proxy_password ? decrypt(user.proxy_password) : null;

    return {
        proxy_url: decryptedProxyUrl,
        proxy_username: decryptedProxyUsername,
        proxy_password: decryptedProxyPassword,
    };
};
