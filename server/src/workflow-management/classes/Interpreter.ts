import Interpreter, { WorkflowFile } from "@wbr-project/wbr-interpret";
import logger from "../../logger";
import { Socket } from "socket.io";
import { Page } from "playwright";
import { InterpreterSettings } from "../../types";

/**
 * This class implements the main interpretation functions.
 * It holds some information about the current interpretation process and
 * registers to some events to allow the client (frontend) to interact with the interpreter.
 * It uses the [@wbr-project/wbr-interpret](https://www.npmjs.com/package/@wbr-project/wbr-interpret)
 * library to interpret the workflow.
 * @category WorkflowManagement
 */
export class WorkflowInterpreter {
  /**
   * Socket.io socket instance enabling communication with the client (frontend) side.
   * @private
   */
  private socket : Socket;

  /**
   * True if the interpretation is paused.
   */
  public interpretationIsPaused: boolean = false;

  /**
   * The instance of the {@link Interpreter} class used to interpret the workflow.
   * From @wbr-project/wbr-interpret.
   * @private
   */
  private interpreter: Interpreter | null = null;

  /**
   * An id of the currently interpreted pair in the workflow.
   * @private
   */
  private activeId: number | null = null;

  /**
   * An array of debug messages emitted by the {@link Interpreter}.
   */
  public debugMessages: string[] = [];

  /**
   * An array of all the serializable data extracted from the run.
   */
  public serializableData: string[] = [];

  /**
   * An array of all the binary data extracted from the run.
   */
  public binaryData: {mimetype: string, data: string}[] = [];

  /**
   * An array of id's of the pairs from the workflow that are about to be paused.
   * As "breakpoints".
   * @private
   */
  private breakpoints: boolean[] = [];

  /**
   * Callback to resume the interpretation after a pause.
   * @private
   */
  private interpretationResume: (() => void) | null = null;

  
}
