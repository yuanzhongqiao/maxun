/**
 * The main function group which determines the flow of remote browser management.
 * Holds the singleton instances of browser pool and socket.io server.
 */
import { Socket } from "socket.io";
import { uuid } from 'uuidv4';

import { createSocketConnection, createSocketConnectionForRun } from "../socket-connection/connection";
import { io, browserPool } from "../server";
import { RemoteBrowser } from "./classes/RemoteBrowser";
import { RemoteBrowserOptions } from "../types";
import logger from "../logger";

/**
 * Starts and initializes a {@link RemoteBrowser} instance.
 * Creates a new socket connection over a dedicated namespace
 * and registers all interaction event handlers.
 * Returns the id of an active browser or the new remote browser's generated id.
 * @param options {@link RemoteBrowserOptions} to be used when launching the browser
 * @returns string
 * @category BrowserManagement-Controller
 */
export const initializeRemoteBrowserForRecording = (options: RemoteBrowserOptions): string => {
    const id = getActiveBrowserId() || uuid();
    createSocketConnection(
        io.of(id),
        async (socket: Socket) => {
            // browser is already active
            const activeId = getActiveBrowserId();
            if (activeId) {
                const remoteBrowser = browserPool.getRemoteBrowser(activeId);
                remoteBrowser?.updateSocket(socket);
                await remoteBrowser?.makeAndEmitScreenshot();
            } else {
                const browserSession = new RemoteBrowser(socket);
                browserSession.interpreter.subscribeToPausing();
                await browserSession.initialize(options);
                await browserSession.registerEditorEvents();
                await browserSession.subscribeToScreencast();
                browserPool.addRemoteBrowser(id, browserSession, true);
            }
          socket.emit('loaded');
        });
    return id;
};
};
