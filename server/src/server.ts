import express from 'express';
import http from 'http';
import cors from 'cors';
import 'dotenv/config';

import { record, workflow, storage } from './routes';
import { BrowserPool } from "./browser-management/classes/BrowserPool";
import logger from './logger'
import { SERVER_PORT } from "./constants/config";
import {Server} from "socket.io";
import { worker } from './workflow-management/scheduler';

const app = express();
app.use(cors());
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

app.use('/record', record);
app.use('/workflow', workflow);
app.use('/storage', storage);

app.get('/', function (req, res) {
    return res.send('Maxun server started 🚀');
});

/**
 * Starts the worker for the workflow queue.
 */
worker.run();

server.listen(SERVER_PORT, () => logger.log('info',`Server listening on port ${SERVER_PORT}`));
