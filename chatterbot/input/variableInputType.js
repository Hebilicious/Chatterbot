import {InputAdapter} from "./inputAdapter.js"
import {Statement} from "../conversation.js"

import isJSON from "is-json"

export class VariableInputTypeAdapter extends InputAdapter {
  constructor() {
    this.JSON = "json"
    this.TEXT = "text"
    this.OBJECT = "object"
    this.VALID_FORMATS = [this.JSON, this.TEXT, this.OBJECT]
  }

  detectType(statement) {
    if (statement.hasOwnProperty("text")) return this.OBJECT
    if (isJSON(statement)) return this.JSON
    if (statement instanceof String) return this.TEXT
    throw this.UnrecognizedInputFormatException(
      `The type ${typeof statement} is not recognized as a valid input type.`
    )
  }

  processInput(statement) {
    let inputType = this.detectType(statement)
    //Return the statement object as is
    if (inputType == this.OBJECT) return statement
    //Convert the string into a statement object.
    if (inputType == this.TEXT) return Statement(statement)
    //Convert JSON into a statement object.
    if (inputType == this.JSON) {
      let data = JSON.parse(statement)
      let text = data.text
      delete data.text
      return Statement(text, ...data)
    }
  }

  UnrecognizedInputFormatException = class {
    constructor(message = "The input format was not recognized.") {
      this.message = message
      this.output()
    }
    output() {
      return this.message
    }
  }
}
