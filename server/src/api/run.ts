import { readFile, readFiles } from "../workflow-management/storage";
import { Router, Request, Response } from 'express';
import { requireAPIKey } from "../middlewares/api";
const router = Router();