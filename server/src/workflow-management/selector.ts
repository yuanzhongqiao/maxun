import { Page } from "playwright";
import { Action, ActionType, Coordinates, TagName } from "../types";
import { WhereWhatPair, WorkflowFile } from "@wbr-project/wbr-interpret";
import logger from "../logger";
import { getBestSelectorForAction } from "./utils";

type Workflow = WorkflowFile["workflow"];

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
        // Match the logic in recorder.ts for link clicks
        const element = parentElement?.tagName === 'A' ? parentElement : el;
        const rectangle =  element?.getBoundingClientRect();
        // @ts-ignore
        if (rectangle) {
          return {
            x: rectangle.x,
            y: rectangle.y,
            width: rectangle.width,
            height: rectangle.height,
            top: rectangle.top,
            right: rectangle.right,
            bottom: rectangle.bottom,
            left: rectangle.left,
          };
        }
      }},
      { x: coordinates.x, y: coordinates.y },
    );
    return rect;
  } catch (error) {
    const { message, stack } = error as Error;
    logger.log('error', `Error while retrieving selector: ${message}`);
    logger.log('error', `Stack: ${stack}`);
  }
}


export const getElementInformation = async (
  page: Page,
  coordinates: Coordinates
) => {
  try {
    const elementInfo = await page.evaluate(
      async ({ x, y }) => {
        const el = document.elementFromPoint(x, y) as HTMLElement;
        if ( el ) {
          const { parentElement } = el;
          // Match the logic in recorder.ts for link clicks
          const element = parentElement?.tagName === 'A' ? parentElement : el;
          return {
            tagName: element?.tagName ?? '',
            hasOnlyText: element?.children?.length === 0 &&
              element?.innerText?.length > 0,
          }
        }
      },
      { x: coordinates.x, y: coordinates.y },
    );
    return elementInfo;
  } catch (error) {
    const { message, stack } = error as Error;
    logger.log('error', `Error while retrieving selector: ${message}`);
    logger.log('error', `Stack: ${stack}`);
  }
}






