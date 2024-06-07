import { Action, ActionType, Coordinates, TagName } from "../../types";
import { WhereWhatPair, WorkflowFile } from '@wbr-project/wbr-interpret';
import logger from "../../logger";
import { Socket } from "socket.io";
import { Page } from "playwright";
import {
  getElementInformation,
  getRect,
  getSelectors,
  isRuleOvershadowing,
  selectorAlreadyInWorkflow
} from "../selector";
import { CustomActions } from "../../../../src/shared/types";
import { workflow } from "../../routes";
import { saveFile } from "../storage";
import fs from "fs";
import { getBestSelectorForAction } from "../utils";
import { browserPool } from "../../server";

interface PersistedGeneratedData {
  lastUsedSelector: string;
  lastIndex: number|null;
  lastAction: string;
}

interface MetaData {
  name: string;
  create_date: string;
  pairs: number;
  update_date: string;
  params: string[],
}

/**
 * Workflow generator is used to transform the user's interactions into an automatically
 * generated correct workflows, using the ability of internal state persistence and
 * heuristic generative algorithms.
 * This class also takes care of the selector generation.
 * @category WorkflowManagement
 */
export class WorkflowGenerator {
 
  private socket : Socket;

  public constructor(socket: Socket) {
    this.socket = socket;
    this.registerEventHandlers(socket);
  }

  
}
