import {OutputAdapter} from "./outputAdapter.js"

/**
 * A simple adapter that allows Chatterbot to communicate through
 * the terminal.
 * @type {[type]}
 */
export class TerminalAdapter extends OutputAdapter {
  /**
   * Print the response to the user input.
   * @param  {[type]} statement        [description]
   * @param  {[type]} [sessionId=null] [description]
   * @return {[type]}                  [description]
   */
  processResponse(statement, sessionId = null) {
    console.log(`ChatterBot : "${statement.text}."`)
    return statement.text
  }
}
