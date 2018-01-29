import {Adapter} from "./adapters.js"

/**
 * A generic class that can be overridden by a sublass to provide extended
 * functionality, such as delivering a response to an API endpoint.
 * @type {[type]}
 */
export class OutputAdapter extends Adapter {
  /**
   * Override this method in a subclass to implement customized functionalities.
   * @param  {[type]} statement        [The statement that the chat bot has produced in response to some input]
   * @param  {[type]} [sessionId=null] [The unique id of the current chat session.]
   * @return {[type]}                  [The response statement.]
   */
  processResponse(statement, sessionId = null) {
    return statement
  }
}
