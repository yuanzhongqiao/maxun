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
       // version @medv/finder
        // https://github.com/antonmedv/finder/blob/master/finder.ts

       type Node = {
         name: string;
         penalty: number;
         level?: number;
       };

       type Path = Node[];

       enum Limit {
         All,
         Two,
         One,
       }

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

       let config: Options;

       let rootDocument: Document | Element;

       function finder(input: Element, options?: Partial<Options>) {
         if (input.nodeType !== Node.ELEMENT_NODE) {
           throw new Error(`Can't generate CSS selector for non-element node type.`);
         }

         if ('html' === input.tagName.toLowerCase()) {
           return 'html';
         }

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

         config = { ...defaults, ...options };

         rootDocument = findRootDocument(config.root, defaults);

         let path = bottomUpSearch(input, Limit.All, () =>
           bottomUpSearch(input, Limit.Two, () => bottomUpSearch(input, Limit.One))
         );

         if (path) {
           const optimized = sort(optimize(path, input));

           if (optimized.length > 0) {
             path = optimized[0];
           }

           return selector(path);
         } else {
           throw new Error(`Selector was not found.`);
         }
       }

       function findRootDocument(rootNode: Element | Document, defaults: Options) {
         if (rootNode.nodeType === Node.DOCUMENT_NODE) {
           return rootNode;
         }
         if (rootNode === defaults.root) {
           return rootNode.ownerDocument as Document;
         }
         return rootNode;
       }

       function bottomUpSearch(
         input: Element,
         limit: Limit,
         fallback?: () => Path | null
       ): Path | null {
         let path: Path | null = null;
         let stack: Node[][] = [];
         let current: Element | null = input;
         let i = 0;

         while (current && current !== config.root.parentElement) {
           let level: Node[] = maybe(id(current)) ||
             maybe(...attr(current)) ||
             maybe(...classNames(current)) ||
             maybe(tagName(current)) || [any()];

           const nth = index(current);

           if (limit === Limit.All) {
             if (nth) {
               level = level.concat(
                 level.filter(dispensableNth).map((node) => nthChild(node, nth))
               );
             }
           } else if (limit === Limit.Two) {
             level = level.slice(0, 1);

             if (nth) {
               level = level.concat(
                 level.filter(dispensableNth).map((node) => nthChild(node, nth))
               );
             }
           } else if (limit === Limit.One) {
             const [node] = (level = level.slice(0, 1));

             if (nth && dispensableNth(node)) {
               level = [nthChild(node, nth)];
             }
           }

           for (let node of level) {
             node.level = i;
           }

           stack.push(level);

           if (stack.length >= config.seedMinLength) {
             path = findUniquePath(stack, fallback);
             if (path) {
               break;
             }
           }

           current = current.parentElement;
           i++;
         }

         if (!path) {
           path = findUniquePath(stack, fallback);
         }

         return path;
       }

       function findUniquePath(
         stack: Node[][],
         fallback?: () => Path | null
       ): Path | null {
         const paths = sort(combinations(stack));

         if (paths.length > config.threshold) {
           return fallback ? fallback() : null;
         }

         for (let candidate of paths) {
           if (unique(candidate)) {
             return candidate;
           }
         }

         return null;
       }

       function selector(path: Path): string {
         let node = path[0];
         let query = node.name;
         for (let i = 1; i < path.length; i++) {
           const level = path[i].level || 0;

           if (node.level === level - 1) {
             query = `${path[i].name} > ${query}`;
           } else {
             query = `${path[i].name} ${query}`;
           }

           node = path[i];
         }
         return query;
       }

       function penalty(path: Path): number {
         return path.map((node) => node.penalty).reduce((acc, i) => acc + i, 0);
       }

       
};








