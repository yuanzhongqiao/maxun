import { Page } from "playwright";
import { Action, ActionType, Coordinates, TagName } from "../types";
import { WhereWhatPair, WorkflowFile } from "@wbr-project/wbr-interpret";
import logger from "../logger";
import { getBestSelectorForAction } from "./utils";

/**
 * Returns a {@link Rectangle} object representing
 * the coordinates, width, height and corner points of the element.
 * If an element is not found, returns null.
 * @param page The page instance.
 * @param coordinates Coordinates of an element.
 * @category WorkflowManagement-Selectors
 * @returns {Promise<Rectangle|undefined|null>}
 */
export const getRect = async (page: Page, coordinates: Coordinates) => {
  try {
    const rect = await page.evaluate(
      async ({ x, y }) => {
        const el = document.elementFromPoint(x, y) as HTMLElement;
        if (el) {
        const { parentElement } = el;
        
      }},
    
    );
    
  } catch (error) {
    const { message, stack } = error as Error;
    logger.log('error', `Error while retrieving selector: ${message}`);
    logger.log('error', `Stack: ${stack}`);
  }
}






