import {Adapter} from "../adapters.js"
import {LevenshteinDistance} from "../comparisons.js"
import {getFirstResponse} from "../responseSelection.js"

export class LogicAdapter extends Adapter {
  constructor(...args) {
    //Check that this class is not called directly.
    if (new.target === LogicAdapter) {
      throw new TypeError("Cannot construct LogicAdapter instances directly")
    }
    super(...args)
    let sCF = args.statementComparisonFunction
    let rSM = args.responseSelectionMethod
    if (sCF) {
      if (sCF instanceof String) {
        sCF = require(sCF)
      }
    }
    if (rSM) {
      if (rSM instanceof String) {
        rSM = require(rSM)
      }
    }
    //Defaults.
    this.compareStatements = sCF || LevenshteinDistance()
    this.selectResponse = rSM || getFirstResponse()
  }
}
