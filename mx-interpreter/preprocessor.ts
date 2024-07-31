import Joi from 'joi';
import {
  Workflow, WorkflowFile, ParamType, SelectorArray, Where,
} from './types/workflow';
import { operators } from './types/logic';

/**
* Class for static processing the workflow files/objects.
*/
export default class Preprocessor {
  static validateWorkflow(workflow: WorkflowFile) : any {
    const regex = Joi.object({
      $regex: Joi.string().required(),
    });

    const whereSchema = Joi.object({
      url: [Joi.string().uri(), regex],
      selectors: Joi.array().items(Joi.string()),
      cookies: Joi.object({}).pattern(Joi.string(), Joi.string()),
      $after: [Joi.string(), regex],
      $before: [Joi.string(), regex],
      $and: Joi.array().items(Joi.link('#whereSchema')),
      $or: Joi.array().items(Joi.link('#whereSchema')),
      $not: Joi.link('#whereSchema'),
    }).id('whereSchema');

    const schema = Joi.object({
      meta: Joi.object({
        name: Joi.string(),
        desc: Joi.string(),
      }),
      workflow: Joi.array().items(
        Joi.object({
          id: Joi.string(),
          where: whereSchema.required(),
          what: Joi.array().items({
            action: Joi.string().required(),
            args: Joi.array().items(Joi.any()),
          }).required(),
        }),
      ).required(),
    });

    const { error } = schema.validate(workflow);

    return error;
  }

  /**
* Extracts parameter names from the workflow.
* @param {WorkflowFile} workflow The given workflow
* @returns {String[]} List of parameters' names.
*/
  static getParams(workflow: WorkflowFile) : string[] {
    const getParamsRecurse = (object : any) : string[] => {
      if (typeof object === 'object') {
        // Recursion base case
        if (object.$param) {
          return [object.$param];
        }

        // Recursion general case
        return Object.values(object)
          .reduce((p: string[], v : any) : string[] => [...p, ...getParamsRecurse(v)], []);
      }
      return [];
    };

    return getParamsRecurse(workflow.workflow);
  }

 
}