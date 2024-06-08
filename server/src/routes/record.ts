/**
 * RESTful API endpoints handling remote browser recording sessions.
 */
import { Router } from 'express';

import {
    initializeRemoteBrowserForRecording,
    destroyRemoteBrowser,
    getActiveBrowserId,
    interpretWholeWorkflow,
    stopRunningInterpretation,
    getRemoteBrowserCurrentUrl, getRemoteBrowserCurrentTabs,
} from '../browser-management/controller'
import { chromium } from "playwright";
import logger from "../logger";

export const router = Router();

/**
 * Logs information about remote browser recording session.
 */
router.all('/', (req, res, next) => {
    logger.log('debug',`The record API was invoked: ${req.url}`)
    next() // pass control to the next handler
})

