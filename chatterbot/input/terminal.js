import {InputAdapter} from "./inputAdapter.js"
import {Statement} from "../conversation.js"
import {inputFunction} from "../utils.js"

/**
 * A simple adapter that allows ChatterBot to communicate through the terminal.
 * @type {[type]}
 */
export class TerminalAdapter extends InputAdapter {
  processInput(...args) {
    let userInput = inputFunction()
    return Statement(userInput)
  }
}
