import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import { record, workflow, storage, auth, integration, proxy } from './routes';
import { BrowserPool } from "./browser-management/classes/BrowserPool";
import logger from './logger';
import { connectDB, syncDB } from './db/config';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import csrf from 'csurf';
import { SERVER_PORT } from "./constants/config";
import { Server } from "socket.io";
import { readdirSync } from "fs"

const csrfProtection = csrf({ cookie: true })

const app = express();
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

const server = http.createServer(app);

/**
 * Globally exported singleton instance of socket.io for socket communication with the client.
 * @type {Server}
 */
export const io = new Server(server);

/**
 * {@link BrowserPool} globally exported singleton instance for managing browsers.
 */
export const browserPool = new BrowserPool();

app.use(bodyParser.json({ limit: '10mb' }))
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb', parameterLimit: 10000 }));
// parse cookies - "cookie" is true in csrfProtection
app.use(cookieParser())
app.use(csrfProtection)

app.use('/record', record);
app.use('/workflow', workflow);
app.use('/storage', storage);
app.use('/auth', auth);
app.use('/integration', integration);
app.use('/proxy', proxy);

readdirSync('./api').map(r => app.use('/api', require(`./api/${r}`)))

app.get('/', function (req, res) {
  return res.send('Maxun server started 🚀');
});

app.get('/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() })
})

server.listen(SERVER_PORT, async () => {
  await connectDB();
  await syncDB();
  logger.log('info', `Server listening on port ${SERVER_PORT}`);
});
