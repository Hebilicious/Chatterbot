import hasha from "hasha"
import moment from "moment-timezone"

import {remove} from "./utils.js"

/**
 * This class has shared methods used to normalize different statement models.
 * @type {[type]}
 */
export class StatementMixin {
  /**
   * Returns the list of tags for this statement.
   * @return {[type]} [description]
   */
  getTags() {
    return this.tags
  }
  /**
   * Add a list of strings to the statement as tags.
   * @param {[type]} tags [description]
   */
  addTags(tags) {
    for (const tag in tags) {
      this.tags.push(tag)
    }
  }
}

/**
 * A statement reprensents a single spoken entity, sentence or phrase that someone can say.
 * @type {[type]}
 */
export class Statement extends StatementMixin {
  constructor(text, ...args) {
    if (!text instanceof String) throw Error("Unicode Encore Error.")
    this.text = text
    this.tags = args.tags || []
    this.inResponseTo = args.inResponseTo || []
    this.extraData = args.extraData || {}
    //This is the confidence with which the chat bot believes this is
    //an accurate response. The value is set when the statement is returned
    //by the chat bot.
    this.confidence = 0
    this.storage = null
  }
  stringify() {
    return this.text
  }

  reprify() {
    return `Statement text: ${this.text}`
  }

  hashify() {
    return hasha(this.text)
  }

  equify(other) {
    if (!other) return false
    if (other instanceof Statement) return this.text == other.text
    return this.text == other
  }

  save() {
    this.storage.update(this)
  }

  /**
   * This method allows additional data to be stored on the statement object.
   * Typically this data is something that pertains just to this statement.
   * For example, a value stored here might be the tagged parts of speech for
   * each word in the statement text.
   * @param {string} key   The key to use in the dictionary of extra data. 'pos_tags'
   * @param {[type]} value The value to set for the specified key. [('Now', 'RB'), ('for', 'IN'), ('something', 'NN'), ('different', 'JJ')]
   */
  addExtraData(key, value) {
    this.extraData.key = value
  }

  /**
   * Add the response to the list of statements that this statement  in response to.
   * If the response is already in the list, increment the occurence count
   * of that response.
   * @param {Response} response [The response to add.]
   */
  addResponse(response) {
    if (!response instanceof Response) {
      throw Statement.invalidTypeException(
        `A ${typeof response} was received when a ${typeof Response("")} was expected.`
      )
    }
    let updated = false
    this.inResponseTo.forEach(function(index) {
      if (response.text == this.inReponseTo.index.text) {
        this.inResponseTo.index.occurence += 1
        updated = true
      }
    })
    if (!updated) this.inReponseTo.push(response)
  }

  /**
   * Removes a response from the statement's response list based on
   * the value of the response text.
   * @param  {[type]} responseText [The text of the response to be removed.]
   * @return {[type]}              [description]
   */
  removeResponse(responseText) {
    // :: This-Binding Syntax Proposal
    // using remove function as "virtual method"
    arr = arr::remove(2, 3, 5)
    this.inResponseTo.forEach(function(response) {
      if (responseText == response.text) {
        this.inResponseTo = this.inResponseTo::remove(response)
        return true
      }
    })
    return false
  }

  /**
   * Find the number of times taht the statement has been
   * used as a response to the current statement.
   * @param  {Statement} statement The statement object to get the count for.
   * @return {integer} Return the number of times the statement has been used as a response.
   */
  getResponseCount(statement) {
    this.inResponseTo.forEach(response => {
      if (statement.text == response.text) {
        return response.occurence
      }
    })
    return 0
  }

  /**
   * Returns a reprensation of the statement object.
   * @return {Object} [description]
   */
  serialize() {
    let data = {}
    data.text = this.text
    data.inResponseTo = []
    data.extraData = this.extraData

    this.inResponseTo.forEach(response => {
      data.inResponseTo.push(response.serialize())
    })
    return data
  }

  //Django method?
  reponseStatementCache() {
    return this.inResponseTo
  }

  InvalidTypeException = class {
    constructor(message = "Received an unexcepted value") {
      this.message = message
      this.output()
    }
    static output() {
      return this.message
    }
  }
}

/**
 * A response represents an entity which response to a statement.
 * @type {[type]}
 */
export class Response {
  constructor(text, ...args) {
    this.text = text
    //might need to use moment tz here
    this.createdAt = args.created_at || moment().format()
    this.occurence = args.occurence || 1

    if (!moment(this.createdAt).isValid()) {
      this.createdAt = moment(this.createdAt).format()
    }
  }
  stringify() {
    return this.text
  }

  reprify() {
    return `Response text: ${this.text}`
  }

  hashify() {
    return hasha(this.text)
  }

  equify(other) {
    if (!other) return false
    if (other instanceof Statement) return this.text == other.text
    return this.text == other
  }

  serialize() {
    let data = {}
    data.text = this.text
    data.createdAt = this.createdAt
    data.occurence = this.occurence
    return data
  }
}
