import { Action, ActionType, TagName } from "../types";

/**
 * A helper function to get the best selector for the specific user action.
 * @param action The user action.
 * @returns {string|null}
 * @category WorkflowManagement-Selectors
 */
export const getBestSelectorForAction = (action: Action) => {
  switch (action.type) {
    case ActionType.Click:
    case ActionType.Hover:
    case ActionType.DragAndDrop: {
      const selectors = action.selectors;
      // less than 25 characters, and element only has text inside
      const textSelector =
        selectors?.text?.length != null &&
        selectors?.text?.length < 25 &&
        action.hasOnlyText
          ? `text=${selectors.text}`
          : null;

    }
}
