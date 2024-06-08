/**
 * A group of functions for storing recordings on the file system.
 * Functions are asynchronous to unload the server from heavy file system operations.
 */
import fs from 'fs';
import * as path from "path";

/**
 * Reads a file from path and returns its content as a string.
 * @param path The path to the file.
 * @returns {Promise<string>}
 * @category WorkflowManagement-Storage
 */
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

/**
 * Writes a string to a file. If the file already exists, it is overwritten.
 * @param path The path to the file.
 * @param data The data to write to the file.
 * @returns {Promise<void>}
 * @category WorkflowManagement-Storage
 */
export const saveFile = (path: string, data: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};





