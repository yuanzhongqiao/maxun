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

  /**
   * Adds a newly generated pair to the workflow and notifies the client about it by
   * sending the updated workflow through socket.
   *
   * Checks some conditions for the correct addition of the pair.
   * 1. The pair's action selector is already in the workflow as a different pair's where selector
   *    If so, the what part of the pair is added to the pair with the same where selector.
   * 2. The pair's where selector is located on the page at the same time as another pair's where selector,
   * having the same url. This state is called over-shadowing an already existing pair.
   *   If so, the pair is merged with the previous over-shadowed pair - what part is attached and
   *   new selector added to the where selectors. In case the over-shadowed pair is further down the
   *   workflow array, the new pair is added to the beginning of the workflow array.
   *
   * This function also makes sure to add a waitForLoadState and a generated flag
   * action after every new action or pair added. The [waitForLoadState](https://playwright.dev/docs/api/class-frame#frame-wait-for-load-state)
   * action waits for the networkidle event to be fired,
   * and the generated flag action is used for making pausing the interpretation possible.
   *
   * @param pair The pair to add to the workflow.
   * @param page The page to use for the state checking.
   * @private
   * @returns {Promise<void>}
   */
  private addPairToWorkflowAndNotifyClient = async(pair: WhereWhatPair, page: Page) => {
    let matched = false;
    // validate if a pair with the same where conditions is already present in the workflow
    if (pair.where.selectors && pair.where.selectors[0]) {
      const match = selectorAlreadyInWorkflow(pair.where.selectors[0], this.workflowRecord.workflow);
      if (match) {
        // if a match of where conditions is found, the new action is added into the matched rule
        const matchedIndex = this.workflowRecord.workflow.indexOf(match);
        if (pair.what[0].action !== 'waitForLoadState' && pair.what[0].action !== 'press') {
          pair.what.push({
            action: 'waitForLoadState',
            args: ['networkidle'],
          })
        }
        this.workflowRecord.workflow[matchedIndex].what = this.workflowRecord.workflow[matchedIndex].what.concat(pair.what);
        logger.log('info', `Pushed ${JSON.stringify(this.workflowRecord.workflow[matchedIndex])} to workflow pair`);
        matched = true;
      }
    }
    // is the where conditions of the pair are not already in the workflow, we need to validate the where conditions
    // for possible overshadowing of different rules and handle cases according to the recording logic
    if (!matched) {
      const handled = await this.handleOverShadowing(pair, page, this.generatedData.lastIndex || 0);
      if (!handled) {
        //adding waitForLoadState with networkidle, for better success rate of automatically recorded workflows
        if (pair.what[0].action !== 'waitForLoadState' && pair.what[0].action !== 'press') {
          pair.what.push({
            action: 'waitForLoadState',
            args: ['networkidle'],
          })
        }
        if (this.generatedData.lastIndex === 0) {
          this.generatedData.lastIndex = null;
          // we want to have the most specific selectors at the beginning of the workflow
          this.workflowRecord.workflow.unshift(pair);
        } else {
          this.workflowRecord.workflow.splice(this.generatedData.lastIndex || 0, 0, pair);
          if (this.generatedData.lastIndex) {
            this.generatedData.lastIndex = this.generatedData.lastIndex - 1;
          }
        }
        logger.log('info',
          `${JSON.stringify(pair)}: Added to workflow file on index: ${this.generatedData.lastIndex || 0}`);
      } else {
        logger.log('debug',
          ` ${JSON.stringify(this.workflowRecord.workflow[this.generatedData.lastIndex || 0])} added action to workflow pair`);
      }
    }
    this.socket.emit('workflow', this.workflowRecord);
    logger.log('info',`Workflow emitted`);
  };

  /**
   * Generates a pair for the click event.
   * @param coordinates The coordinates of the click event.
   * @param page The page to use for obtaining the needed data.
   * @returns {Promise<void>}
   */
  public onClick = async (coordinates: Coordinates, page: Page) => {
    let where: WhereWhatPair["where"] = { url: this.getBestUrl(page.url()) };
    const selector = await this.generateSelector(page, coordinates, ActionType.Click);
    logger.log('debug', `Element's selector: ${selector}`);
    //const element = await getElementMouseIsOver(page, coordinates);
    //logger.log('debug', `Element: ${JSON.stringify(element, null, 2)}`);
    if (selector) {
      where.selectors = [selector];
    }
    const pair: WhereWhatPair = {
      where,
      what: [{
        action: 'click',
        args: [selector],
      }],
    }
    if (selector) {
      this.generatedData.lastUsedSelector = selector;
      this.generatedData.lastAction = 'click';
    }
    await this.addPairToWorkflowAndNotifyClient(pair, page);
  };

  /**
   * Generates a pair for the change url event.
   * @param newUrl The new url to be changed to.
   * @param page The page to use for obtaining the needed data.
   * @returns {Promise<void>}
   */
  public onChangeUrl = async(newUrl: string, page: Page) => {
    this.generatedData.lastUsedSelector = '';
    const pair: WhereWhatPair = {
      where: { url: this.getBestUrl(page.url()) },
      what: [
        {
        action: 'goto',
        args: [newUrl],
        }
      ],
    }
    await this.addPairToWorkflowAndNotifyClient(pair, page);
  };

  /**
   * Generates a pair for the keypress event.
   * @param key The key to be pressed.
   * @param coordinates The coordinates of the keypress event.
   * @param page The page to use for obtaining the needed data.
   * @returns {Promise<void>}
   */
  public onKeyboardInput = async (key: string, coordinates: Coordinates, page: Page) => {
    let where: WhereWhatPair["where"] = { url: this.getBestUrl(page.url()) };
    const selector = await this.generateSelector(page, coordinates, ActionType.Keydown);
    if (selector) {
      where.selectors = [selector];
    }
    const pair: WhereWhatPair = {
      where,
      what: [{
        action: 'press',
        args: [selector, key],
      }],
    }
    if (selector) {
      this.generatedData.lastUsedSelector = selector;
      this.generatedData.lastAction = 'press';
    }
    await this.addPairToWorkflowAndNotifyClient(pair, page);
  };

  /**
   * Generates a pair for the custom action event.
   * @param action The type of the custom action.
   * @param settings The settings of the custom action.
   * @param page The page to use for obtaining the needed data.
   */
  public customAction = async (action: CustomActions, settings: any, page: Page) => {
    const pair: WhereWhatPair = {
      where: { url: this.getBestUrl(page.url())},
      what: [{
        action,
        args: settings ? Array.isArray(settings) ? settings : [settings] : [],
      }],
    }

    if (this.generatedData.lastUsedSelector) {
      this.socket.emit('decision', {
        pair, actionType: 'customAction',
        lastData: {
          selector: this.generatedData.lastUsedSelector,
          action: this.generatedData.lastAction,
        } });
    } else {
      await this.addPairToWorkflowAndNotifyClient(pair, page);
    }
  };

  /**
   * Returns the currently generated workflow.
   * @returns {WorkflowFile}
   */
  public getWorkflowFile = () => {
    return this.workflowRecord;
  };

  /**
   * Removes a pair from the currently generated workflow.
   * @param index The index of the pair to be removed.
   * @returns void
   */
  public removePairFromWorkflow = (index: number) => {
    if (index <= this.workflowRecord.workflow.length && index >= 0) {
      this.workflowRecord.workflow.splice(this.workflowRecord.workflow.length - (index + 1), 1);
      logger.log('debug', `pair ${index}: Removed from workflow file.`);
    } else {
      logger.log('error', `Delete pair ${index}: Index out of range.`);
    }
  };

  /**
   * Adds a new pair to the currently generated workflow.
   * @param index The index on which the pair should be added.
   * @param pair The pair to be added.
   * @returns void
   */
  public addPairToWorkflow = (index: number, pair: WhereWhatPair) => {
    if (index === this.workflowRecord.workflow.length) {
      this.workflowRecord.workflow.unshift(pair);
      logger.log('debug', `pair ${index}: Added to workflow file.`);
    } else if (index < this.workflowRecord.workflow.length && index >= 0) {
      this.workflowRecord.workflow.splice(
        this.workflowRecord.workflow.length - index , 0, pair);
    } else {
      logger.log('error', `Add pair ${index}: Index out of range.`);
    }
  };

  /**
   * Updates a pair in the currently generated workflow.
   * @param index The index of the pair to be updated.
   * @param pair The pair to be used as a replacement.
   * @returns void
   */
  public updatePairInWorkflow = (index: number, pair: WhereWhatPair) => {
    if (index <= this.workflowRecord.workflow.length && index >= 0) {
      this.workflowRecord.workflow[this.workflowRecord.workflow.length - (index + 1)] = pair;
    } else {
      logger.log('error', `Update pair ${index}: Index out of range.`);
    }
  };

  /**
   * Updates the socket used for communication with the client.
   * @param socket The socket to be used for communication.
   * @returns void
   */
  public updateSocket = (socket: Socket) : void => {
    this.socket = socket;
    this.registerEventHandlers(socket);
  };

  /**
   * Returns the currently generated workflow without all the generated flag actions.
   * @param workflow The workflow for removing the generated flag actions from.
   * @private
   * @returns {WorkflowFile}
   */
  private removeAllGeneratedFlags = (workflow: WorkflowFile): WorkflowFile => {
      for (let i = 0; i < workflow.workflow.length; i++) {
        if (
          workflow.workflow[i].what[0] &&
          workflow.workflow[i].what[0].action === 'flag' &&
          workflow.workflow[i].what[0].args?.includes('generated')) {
          workflow.workflow[i].what.splice(0, 1);
        }
      }
      return workflow;
  };

  
  public AddGeneratedFlags = (workflow: WorkflowFile): WorkflowFile => {
    const copy = JSON.parse(JSON.stringify(workflow));
    for (let i = 0; i < workflow.workflow.length; i++) {
      copy.workflow[i].what.unshift({
        action: 'flag',
        args: ['generated'],
      });
    }
    return copy;
  };

  
}
