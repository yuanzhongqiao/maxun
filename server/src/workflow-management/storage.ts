/**
 * A group of functions for storing recordings on the file system.
 * Functions are asynchronous to unload the server from heavy file system operations.
 */
import fs from 'fs';
import * as path from "path";

export const readFile = (path: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

