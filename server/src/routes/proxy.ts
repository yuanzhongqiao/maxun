import { Router, Request, Response } from 'express';
export const router = Router();

router.post('/config', async (req: Request, res: Response) => {
    const { proxyConfig } = req.body;
    try {
        if (!proxyConfig) {
            return res.status(400).send('Proxy configuration is required');
        }
        console.log(proxyConfig);
    } catch (error: any) {
        res.status(500).send(`Could not send proxy configuration - ${error.message}`)
    }
})