import { RemoteBrowser } from "./RemoteBrowser";
import logger from "../../logger";


interface BrowserPoolInfo {
   
    browser: RemoteBrowser,
    
    active: boolean,
}


interface PoolDictionary {
    [key: string]: BrowserPoolInfo,
}

