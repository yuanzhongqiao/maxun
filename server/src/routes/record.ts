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

