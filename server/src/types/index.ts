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
