import {
  ONE_PERCENT_OF_VIEWPORT_H,
  ONE_PERCENT_OF_VIEWPORT_W,
  VIEWPORT_W,
  VIEWPORT_H,
} from "../constants/const";
import { Coordinates } from '../components/atoms/canvas';

export const throttle = (callback: any, limit: number) => {
  let wait = false;
  return (...args: any[]) => {
    if (!wait) {
      callback(...args);
      wait = true;
      setTimeout(function () {
        wait = false;
      }, limit);
    }
  }
}

