import { RemoteBrowser } from "./RemoteBrowser";
import logger from "../../logger";

/**
 * @category Types
 */
interface BrowserPoolInfo {
    /**
     * The instance of remote browser.
     */
    browser: RemoteBrowser,
    /**
     * States if the browser's instance is being actively used.
     * Helps to persist the progress on the frontend when the application has been reloaded.
     * @default false
     */
    active: boolean,
}

/**
 * Dictionary of all the active remote browser's instances indexed by their id.
 * The value in this dictionary is of type BrowserPoolInfo,
 * which provides additional information about the browser's usage.
 * @category Types
 */
interface PoolDictionary {
    [key: string]: BrowserPoolInfo,
}

/**
 * A browser pool is a collection of remote browsers that are initialized and ready to be used.
 * Adds the possibility to add, remove and retrieve remote browsers from the pool.
 * It is possible to manage multiple browsers for creating or running a recording.
 * @category BrowserManagement
 */
export class BrowserPool {

    /**
     * Holds all the instances of remote browsers.
     */
    private pool : PoolDictionary = {};

    /**
     * Adds a remote browser instance to the pool indexed by the id.
     * @param id remote browser instance's id
     * @param browser remote browser instance
     * @param active states if the browser's instance is being actively used
     */
    public addRemoteBrowser = (id: string, browser: RemoteBrowser, active: boolean = false): void => {
        this.pool = {
            ...this.pool,
            [id]: {
                browser,
                active,
            },
        }
        logger.log('debug', `Remote browser with id: ${id} added to the pool`);
    };
}
