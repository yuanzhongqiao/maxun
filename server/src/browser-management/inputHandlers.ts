/**
 * A set of functions handling reproduction of user input
 * on the remote browser instance as well as the generation of workflow pairs.
 * These functions are called by the client through socket communication.
 */
import { Socket } from 'socket.io';

import logger from "../logger";
import { Coordinates, ScrollDeltas, KeyboardInput } from '../types';
import { browserPool } from "../server";
import { WorkflowGenerator } from "../workflow-management/classes/Generator";
import { Page } from "playwright";
import { throttle } from "../../../src/helpers/inputHelpers";
import { CustomActions } from "../../../src/shared/types";

