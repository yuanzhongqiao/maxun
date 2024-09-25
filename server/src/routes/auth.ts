import { Router, Request, Response } from 'express';
import User from '../models/User';
import jwt from 'jsonwebtoken';
export const router = Router();

interface AuthenticatedRequest extends Request {
    user?: { id: string };
}

router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email) return res.status(400).send('Email is required')
        if (!password || password.length < 6) return res.status(400).send('Password is required and must be at least 6 characters')

        let userExist = await User.findOne({ where: { email } });
        if (userExist) return res.status(400).send('User already exists')

        const user = await User.create({ email, password });

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

        let user = await User.findOne({ where: { email } });
        const match = await user?.isValidPassword(password);
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

router.get('/current-user', async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).send('Unauthorized');
        }
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] },
        });
        if (!user) {
            return res.status(404).json({ ok: false, error: 'User not found' });
        }
        return res.status(200).json({ ok: true });
    } catch (error: any) {
        return res.status(500).send(`Could not fetch current user : ${error.message}.`);
    }
});