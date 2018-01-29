import leven from "leven"

//???????
function ObjectCallable(cls) {
  var f = function() {
    return f.__call__.apply(f, arguments)
  }
  Object.setPrototypeOf(f, cls)
  return f
}

class Comparator {
  constructor(statementA, statementB) {
    this.call(statementA, statementB)
  }
  //????????????
  call(statementA, statementB) {
    ObjectCallable(this)
    return this.compare(statementA, statementB)
  }

  compare(statementA, statementB) {
    return 0
  }

  getInitializationFunctions() {
    //     """
    // Return all initialization methods for the comparison algorithm.
    // Initialization methods must start with 'initialize_' and
    // take no parameters.
    // """
    // initialization_methods = [
    //     (
    //         method,
    //         getattr(self, method),
    //     ) for method in dir(self) if method.startswith('initialize_')
    // ]
    //
    // return {
    //     key: value for (key, value) in initialization_methods
    // }
  }
}

/**
 * Compare two statements based on the LevenshteinDistance of each
 * statement's text.
 * @type {[type]}
 */
export class LevenshteinDistance extends Comparator {
  static compare(statement, otherStatement) {
    if (!statement.text || !otherStatement.text) return 0
    let text = statement.text.toLowerCase()
    let otherText = otherStatement.text.toLowerCase()
    // leven('cat', 'supercow') --> 7;
    let similarity = leven(text, otherText)
    let bigger = Math.max(otherText.length, text.length)
    let percent = (bigger - similarity) / bigger
    return percent.toFixed(2)
  }
}
