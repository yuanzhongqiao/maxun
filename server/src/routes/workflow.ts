/**
 * RESTful API endpoints handling currently generated workflow management.
 */

import { Router } from 'express';
import logger from "../logger";
import { browserPool } from "../server";
import { readFile } from "../workflow-management/storage";

export const router = Router();

/**
 * Logs information about workflow API.
 */
router.all('/', (req, res, next) => {
  logger.log('debug',`The workflow API was invoked: ${req.url}`)
  next() // pass control to the next handler
})
