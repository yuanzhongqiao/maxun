import { Router, Request, Response } from 'express';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import { hashPassword, comparePassword } from '../utils/auth';
import { requireSignIn } from '../middlewares/auth';
import { genAPIKey } from '../utils/api';
export const router = Router();

interface AuthenticatedRequest extends Request {
    user?: { id: string };
}

router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email) return res.status(400).send('Email is required')
        if (!password || password.length < 6) return res.status(400).send('Password is required and must be at least 6 characters')

        let userExist = await User.findOne({ raw: true, where: { email } });
        if (userExist) return res.status(400).send('User already exists')

        const hashedPassword = await hashPassword(password)

        const user = await User.create({ email, password: hashedPassword });

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
        user.password = undefined as unknown as string
        res.cookie('token', token, {
            httpOnly: true
        })
        res.json(user)
    } catch (error: any) {
        res.status(500).send(`Could not register user - ${error.message}`)
    }
})

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).send('Email and password are required')
        if (password.length < 6) return res.status(400).send('Password must be at least 6 characters')

        let user = await User.findOne({ raw: true, where: { email } });
        if (!user) return res.status(400).send('User does not exist');

        const match = await comparePassword(password, user.password)
        if (!match) return res.status(400).send('Invalid email or password')

        const token = jwt.sign({ id: user?.id }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

        // return user and token to client, exclude hashed password
        if (user) {
            user.password = undefined as unknown as string;
        }
        res.cookie('token', token, {
            httpOnly: true
        })
        res.json(user)
    } catch (error: any) {
        res.status(400).send(`Could not login user - ${error.message}`)
        console.log(`Could not login user - ${error}`)
    }
})

router.get('/logout', async (req, res) => {
    try {
        res.clearCookie('token')
        return res.json({ message: 'Logout successful' })
    } catch (error: any) {
        res.status(500).send(`Could not logout user - ${error.message}`)
    }
})

router.get('/current-user', requireSignIn, async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ ok: false, error: 'Unauthorized' });
        }
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] },
        });
        if (!user) {
            return res.status(404).json({ ok: false, error: 'User not found' });
        } else {
            return res.status(200).json({ ok: true, user: user });
        }
    } catch (error: any) {
        console.error('Error in current-user route:', error);
        return res.status(500).json({ ok: false, error: `Could not fetch current user: ${error.message}` });
    }
});

router.post('/generate-api-key', requireSignIn, async (req: AuthenticatedRequest, res) => {
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

        await user.update({ api_key: apiKey });

        return res.status(200).json({
            message: 'API key generated successfully',
            api_key: apiKey,
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error generating API key', error });
    }
});

router.get('/api-key', requireSignIn, async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ ok: false, error: 'Unauthorized' });
        }

        const user = await User.findByPk(req.user.id, {
            raw: true,
            attributes: ['api_key'],
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            message: 'API key fetched successfully',
            api_key: user.api_key || null,
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching API key', error });
    }
});

router.delete('/delete-api-key', requireSignIn, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, { raw: true });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.api_key) {
            return res.status(404).json({ message: 'API Key not found' });
        }

        await User.update({ api_key: null }, { where: { id: req.user.id } });

        return res.status(200).json({ message: 'API Key deleted successfully' });
    } catch (error: any) {
        return res.status(500).json({ message: 'Error deleting API key', error: error.message });
    }
});
