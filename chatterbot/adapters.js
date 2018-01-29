import logging from "plogging"

import {SQLStorageAdapter} from "./sqlStorage.js"
import {MongoDatabaseAdapter} from "./mongodbStorage.js"

const adapters = {SQLStorageAdapter, MongoDatabaseAdapter}
export function whichAdapter(name) {
  return adapters[name]
}

export class Adapter {
  constructor(...args) {
    this.name = "Adapter"
    this.logger = args.logger || logging.getLogger(this.name)
    this.chatbot = args.chatbot
  }
  /**
   * Gives the adapter access to an instance of the ChatBot class.
   * @param {[Chatbot]} chatbot [A chatbot instance]
   */
  setChatbot(chatbot) {
    this.chatbot = chatbot
  }

  /**
   * An exception to be raised when an adapter method hasnot been implemented.
   * Typically this indicates that the developer is expected to implement the
   * method in a subclass.
   * @type {Error}
   */
  AdapterMethodNotImplementedError = class {
    constructor(message = null) {
      if (!message) {
        this.message = "This method must be overridden in a subclass method."
        this.output()
      }
    }
    output() {
      return this.message
    }
  }

  /**
   * An exception to be raised when an adapter of an unexpected class
   * type is received.
   * @type {Error}
   */
  InvalidAdapterTypeException = class {
    //pass ?
    constructor(message) {
      this.message = message
      this.output()
    }
    output() {
      return this.message
    }
  }
}
