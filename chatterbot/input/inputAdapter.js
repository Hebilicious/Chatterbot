import {Adapter} from "./adapters.js"

/**
 * This is an abstract class that represents the interface that all
 * input adapters should implement.
 * @type {[type]}
 */
export class InputAdapter {
  constructor() {
    if (new.target === InputAdapter) {
      throw new TypeError("Cannot construct InputAdapter instances directly")
    }
  }

  processInput(...args) {
    throw this.AdapterMethodNotImplementedError()
  }

  async processInputStatement(...args) {
    let inputStatement = this.processInput(...args)
    this.logger.info = `Received input statement ${inputStatement.text}`
    let existingStatement = await this.chatbot.storage.find(inputStatement.text)
    if (existingStatement) {
      this.logger.info(`"${inputStatement.text} is a known statement."`)
      inputStatement = existingStatement
    } else {
      this.logger.info(`"${inputStatement.text}" is not a known statement.`)
    }
    return inputStatement
  }
}
