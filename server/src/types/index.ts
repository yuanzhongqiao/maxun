import {BrowserType, LaunchOptions} from "playwright";

/**
 * Interpreter settings properties including recording parameters.
 * @category Types
 */
export interface InterpreterSettings {
    maxConcurrency: number;
    maxRepeats: number;
    debug: boolean;
    params?: any;
}


/**
 * Options for the {@link BrowserManagement.launch} method.
 * Wraps the Playwright's launchOptions and adds an extra browser option.
 * The browser option determines which browser to launch as Playwright
 * supports multiple browsers. (chromium, firefox, webkit)
 *  -- Possible expansion for the future of the browser recorder --
 * @category Types
 */
export interface RemoteBrowserOptions {
    browser: BrowserType
    launchOptions: LaunchOptions
};

