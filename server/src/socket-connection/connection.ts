import {Namespace, Socket} from 'socket.io';
import logger from "../logger";

export const createSocketConnection = (
    io: Namespace,
    callback: (socket: Socket) => void,
    ) => {
    const onConnection = async (socket: Socket) => {
        logger.log('info',"Client connected " + socket.id);
        socket.on('disconnect', () => logger.log('info', "Client disconnected " + socket.id));
        callback(socket);
    }

    io.on('connection', onConnection);
};

