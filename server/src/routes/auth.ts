import { Router } from 'express';
export const router = Router();

router.post('/auth/google', (req, res) => {	
    res.send('Google auth');
});