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

  /**
   * The socket used to communicate with the client.
   * @private
   */
  private socket : Socket;

  /**
   * The public constructor of the WorkflowGenerator.
   * Takes socket for communication as a parameter and registers some important events on it.
   * @param socket The socket used to communicate with the client.
   * @constructor
   */
  public constructor(socket: Socket) {
    this.socket = socket;
    this.registerEventHandlers(socket);
  }

  /**
   * The current workflow being recorded.
   * @private
   */
  private workflowRecord: WorkflowFile = {
    workflow: [],
  };

  /**
   * Metadata of the currently recorded workflow.
   * @private
   */
  private recordingMeta: MetaData = {
    name: '',
    create_date: '',
    pairs: 0,
    update_date: '',
    params: [],
  }

  /**
   * The persistent data from the whole workflow generation process.
   * Used for correct generation of other user inputs.
   * @private
   */
  private generatedData: PersistedGeneratedData = {
    lastUsedSelector: '',
    lastIndex: null,
    lastAction: '',
  }

  /**
   * Registers the event handlers for all generator-related events on the socket.
   * @param socket The socket used to communicate with the client.
   * @private
   */
  private registerEventHandlers = (socket: Socket) => {
    socket.on('save', async (fileName: string) => {
      logger.log('debug', `Saving workflow ${fileName}`);
      await this.saveNewWorkflow(fileName)
    });
    socket.on('new-recording', () => this.workflowRecord = {
      workflow: [],
    } );
    socket.on('activeIndex', (data) => this.generatedData.lastIndex = parseInt(data));
    socket.on('decision', async ({pair, actionType, decision}) => {
      const id = browserPool.getActiveBrowserId();
      if (id) {
        const activeBrowser = browserPool.getRemoteBrowser(id);
        const currentPage = activeBrowser?.getCurrentPage();
        if (decision) {
          switch (actionType) {
            case 'customAction':
              pair.where.selectors = [this.generatedData.lastUsedSelector];
              break;
            default: break;
          }
        }
        if (currentPage) {
          await this.addPairToWorkflowAndNotifyClient(pair, currentPage);
        }
      }
    })
    socket.on('updatePair', (data) => {
      this.updatePairInWorkflow(data.index, data.pair);
    })
  };

  
}
