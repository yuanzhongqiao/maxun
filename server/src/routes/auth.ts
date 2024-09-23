import { Router } from 'express';
import { hashPassword, comparePassword } from '../utils/auth';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
// Todo: DB 
export const router = Router();

router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email) return res.status(400).send('Email is required')
        if (!password || password.length < 6) return res.status(400).send('Password is required and must be at least 6 characters')

        let userExist = await User.findOne({ email }).exec()
        if (userExist) return res.status(400).send('User already exists')

        const hashedPassword = await hashPassword(password)

        // register user
        const user = new User({
            email,
            password: hashedPassword
        })
        await user.save()
        const token = jwt.sign({
            _id: user._id
        }, process.env.JWT_SECRET as string, {
            expiresIn: '3d'
        })
        user.password = undefined
        res.cookie('token', token, {
            httpOnly: true
        })
        res.json(user)
    } catch (error) {
        res.status(500).send(`Could not register user - ${error.message}`)
    }
})

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).send('Email and password are required')
        if (password.length < 6) return res.status(400).send('Password must be at least 6 characters')

        let user = await User.findOne({ email }).exec()
        const match = await comparePassword(password, user.password)
        if (!match) return res.status(400).send('Invalid email or password')

        // create signed jwt
        const token = jwt.sign({
            _id: user._id
        }, process.env.JWT_SECRET as string, {
            expiresIn: '3d'
        })
        // return user and token to client, exclude hashed password
        user.password = undefined
        res.cookie('token', token, {
            httpOnly: true
        })
        res.json(user)
    } catch (error) {
        res.status(400).send(`Could not login user - ${error.message}`)
    }
})

const logout = async (req, res) => {
    try {
        res.clearCookie('token')
        return res.json({ message: 'Logout successful' })
    } catch (error) {
        res.status(500).send(`Could not logout user - ${error.message}`)
    }
}

const currentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password').exec();
        return res.status(200).json({ ok: true });
    } catch (error) {
        return res.status(500).send(`Could not fetch current user : ${error.message}.`);
    }
};