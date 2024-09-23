import { hashPassword, comparePassword } from '../utils/auth';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
// Todo: DB 

const register = async (req, res) => {
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
}

