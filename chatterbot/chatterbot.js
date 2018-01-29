import * as Utils from "./utils.js"
import {StorageAdapter} from "./storage/storageAdapter.js"
import {InputAdapter} from "./input/inputAdapter.js"
import {OutputAdapter} from "./output/outputAdapter.js"
import {MultiLogicAdapter} from "./logic/multilogicAdapter.js"
/**
 * A converasational dialog chat bot.
 */
export class ChatBot {
  constructor(name, ...args) {
    this.name = name
    args.name = name
    args.chatbot = this

    this.defaultSession = null

    const storageAdapter = args.storageAdapter || "SQLStorageAdapter"

    const logicAdapters = args.logicAdapters || "BestMatch"

    const inputAdapter = args.inputAdapters || "VariableInputTypeAdapter"

    const outputAdapter = args.outputAdapter || "OutputAdapter"

    Utils.validateAdapterClass(storageAdapter, StorageAdapter)
    Utils.validateAdapterClass(inputAdapter, InputAdapter)
    Utils.validateAdapterClass(outputAdapter, OutputAdapter)

    this.logic = MultiLogicAdapter(...args)
  }
}
