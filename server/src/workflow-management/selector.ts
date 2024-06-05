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

/**
 * Checks the basic info about an element and returns a {@link BaseActionInfo} object.
 * If the element is not found, returns undefined.
 * @param page The page instance.
 * @param coordinates Coordinates of an element.
 * @category WorkflowManagement-Selectors
 * @returns {Promise<BaseActionInfo|undefined>}
 */
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

/**
 * Returns the best and unique css {@link Selectors} for the element on the page.
 * Internally uses a finder function from https://github.com/antonmedv/finder/blob/master/finder.ts
 * available as a npm package: @medv/finder
 *
 * The finder needs to be executed and defined inside a browser context. Meaning,
 * the code needs to be available inside a page evaluate function.
 * @param page The page instance.
 * @param coordinates Coordinates of an element.
 * @category WorkflowManagement-Selectors
 * @returns {Promise<Selectors|null|undefined>}
 */
export const getSelectors = async (page: Page, coordinates: Coordinates) => {
  try {
     const selectors : any = await page.evaluate(async ({ x, y }) => {

       type Options = {
         root: Element;
         idName: (name: string) => boolean;
         className: (name: string) => boolean;
         tagName: (name: string) => boolean;
         attr: (name: string, value: string) => boolean;
         seedMinLength: number;
         optimizedMinLength: number;
         threshold: number;
         maxNumberOfTries: number;
       };


       function finder(input: Element, options?: Partial<Options>) {

         const defaults: Options = {
           root: document.body,
           idName: (name: string) => true,
           className: (name: string) => true,
           tagName: (name: string) => true,
           attr: (name: string, value: string) => false,
           seedMinLength: 1,
           optimizedMinLength: 2,
           threshold: 1000,
           maxNumberOfTries: 10000,
         };

       }


}





