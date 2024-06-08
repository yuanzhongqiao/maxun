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

/**
 * A wrapper function for handling user input.
 * This function gets the active browser instance from the browser pool
 * and passes necessary arguments to the appropriate handlers.
 * e.g. {@link Generator}, {@link RemoteBrowser.currentPage}
 *
 * Also ignores any user input while interpretation is in progress.
 *
 * @param handleCallback The callback handler to be called
 * @param args - arguments to be passed to the handler
 * @category HelperFunctions
 */
const handleWrapper = async (
  handleCallback: (
    generator: WorkflowGenerator,
    page: Page,
    args?: any
  ) => Promise<void>,
  args?: any
) => {
    const id = browserPool.getActiveBrowserId();
    if (id) {
        const activeBrowser = browserPool.getRemoteBrowser(id);
        if (activeBrowser?.interpreter.interpretationInProgress() && !activeBrowser.interpreter.interpretationIsPaused) {
            logger.log('debug', `Ignoring input, while interpretation is in progress`);
            return;
        }
        const currentPage = activeBrowser?.getCurrentPage();
        if (currentPage && activeBrowser) {
            if (args) {
                await handleCallback(activeBrowser.generator, currentPage, args);
            } else {
                await handleCallback(activeBrowser.generator, currentPage);
            }
        } else {
            logger.log('warn', `No active page for browser ${id}`);
        }
    } else {
        logger.log('warn', `No active browser for id ${id}`);
    }
}

/**
 * An interface for custom action description.
 * @category Types
 */
interface CustomActionEventData {
    action: CustomActions;
    settings: any;
}

/**
 * A wrapper function for handling custom actions.
 * @param customActionEventData The custom action event data
 * @category HelperFunctions
 */
const onGenerateAction = async (customActionEventData: CustomActionEventData) => {
    logger.log('debug', `Generating ${customActionEventData.action} action emitted from client`);
    await handleWrapper(handleGenerateAction, customActionEventData);
}

/**
 * Handles the generation of a cutom action workflow pair.
 * @param generator The workflow generator
 * @param page The active page
 * @param action The custom action
 * @param settings The custom action settings
 * @category BrowserManagement
 */
const handleGenerateAction =
  async (generator: WorkflowGenerator, page: Page, {action, settings}: CustomActionEventData) => {
    await generator.customAction(action, settings, page);
}

/**
 * A wrapper function for handling mousedown event.
 * @param coordinates - coordinates of the mouse click
 * @category HelperFunctions
 */
const onMousedown = async (coordinates: Coordinates) => {
    logger.log('debug', 'Handling mousedown event emitted from client');
    await handleWrapper(handleMousedown, coordinates);
}

/**
 * A mousedown event handler.
 * Reproduces the click on the remote browser instance
 * and generates pair data for the recorded workflow.
 * @param generator - the workflow generator {@link Generator}
 * @param page - the active page of the remote browser
 * @param x - the x coordinate of the mousedown event
 * @param y - the y coordinate of the mousedown event
 * @category BrowserManagement
 */
const handleMousedown = async (generator: WorkflowGenerator, page: Page, { x, y }: Coordinates) => {
    await generator.onClick({ x, y }, page);
    const previousUrl = page.url();
    const tabsBeforeClick = page.context().pages().length;
    await page.mouse.click(x, y);
    // try if the click caused a navigation to a new url
    try {
        await page.waitForNavigation({ timeout: 2000 });
        const currentUrl = page.url();
        if (currentUrl !== previousUrl) {
            generator.notifyUrlChange(currentUrl);
        }
    } catch (e) {
        const {message} = e as Error;
    } //ignore possible timeouts

    // check if any new page was opened by the click
    const tabsAfterClick = page.context().pages().length;
    const numOfNewPages = tabsAfterClick - tabsBeforeClick;
    if (numOfNewPages > 0) {
        for (let i = 1; i <= numOfNewPages; i++) {
            const newPage = page.context().pages()[tabsAfterClick - i];
            if (newPage) {
                generator.notifyOnNewTab(newPage, tabsAfterClick - i);
            }
        }
    }
    logger.log('debug', `Clicked on position x:${x}, y:${y}`);
};

/**
 * A wrapper function for handling the wheel event.
 * @param scrollDeltas - the scroll deltas of the wheel event
 * @category HelperFunctions
 */
const onWheel = async (scrollDeltas: ScrollDeltas) => {
    logger.log('debug', 'Handling scroll event emitted from client');
    await handleWrapper(handleWheel, scrollDeltas);
};

/**
 * A wheel event handler.
 * Reproduces the wheel event on the remote browser instance.
 * Scroll is not generated for the workflow pair. This is because
 * Playwright scrolls elements into focus on any action.
 * @param generator - the workflow generator {@link Generator}
 * @param page - the active page of the remote browser
 * @param deltaX - the delta x of the wheel event
 * @param deltaY - the delta y of the wheel event
 * @category BrowserManagement
 */
const handleWheel = async (generator: WorkflowGenerator, page: Page, { deltaX, deltaY }: ScrollDeltas) => {
    await page.mouse.wheel(deltaX, deltaY);
    logger.log('debug', `Scrolled horizontally ${deltaX} pixels and vertically ${deltaY} pixels`);
};

