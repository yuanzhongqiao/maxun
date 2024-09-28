import { Router, Request, Response } from 'express';
import { genAPIKey } from '../utils/api';
import User from '../models/User';

export const router = Router();

interface AuthenticatedRequest extends Request {
    user?: { id: string };
}

router.get('/generate-api-key', async (req: AuthenticatedRequest, res) => {
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

        if (user.api_key) {
            return res.status(400).json({ message: 'API key already exists' });
        }

        const apiKey = genAPIKey();

        user.api_key = apiKey;
        await user.save();

        return res.status(200).json({
            message: 'API key generated successfully',
            api_key: apiKey,
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error generating API key', error });
    }
});
