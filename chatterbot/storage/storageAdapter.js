import logging from "plogging"

/**
 * This is an abstract class that represents the interface
 * that all storage adapters should implement.
 */
export class StorageAdapter {
  constructor(...args) {
    //Check that this class is not called directly.
    if (new.target === StorageAdapter) {
      throw new TypeError("Cannot construct StorageAdapter instances directly")
    }
    this.name = "StorageAdapter"
    this.args = args
    this.logger = args.logger || logging.getLogger(this.name)
    this.adapterSupportQueries = true
    this.baseQuery = null
  }

  getModel(modelName) {
    let modelName = modelName.toLowerCase()
    let key = `${modelName}Model`
    if (key in this.args) {
      return this.args.key
    }
    //Example : getStatementModel
    let modelMethodName = "get" + key.charAt(0).toUpperCase() + key.slice(1)
    return this[modelMethodName]
    //     get_model_method = getattr(self, 'get_%s_model' % (model_name, ))
    //
    // return get_model_method()
  }

  /**
   * Create a base query for the storage adapter.
   * @param  {[type]} chatterbot [description]
   * @param  {[type]} sessionId  [description]
   * @return {[type]}            [description]
   */
  generateBaseQuery(chatterbot, sessionId) {
    if (this.adapterSupportQueries) {
      chatterbot.filters.forEach(function(filterInstance) {
        this.baseQuery = filterInstance.filterSelection(chatterbot, sessionId)
      })
    }
  }

  /**
   * Return the number of entries in the database.
   * @return {[type]} [description]
   */
  count() {
    throw this.AdapterMethodNotImplementedError(
      "The count method is not implemented by this adapter"
    )
  }

  /**
   * Returns an object from the databse if it exists.
   * @param  {[type]} statementText [description]
   * @return {[type]}               [description]
   */
  find(statementText) {
    throw this.AdapterMethodNotImplementedError(
      "The find method is not implemented by this adapter"
    )
  }

  /**
   * Removes the statement that matches the input text.
   * Removes any response from statements where the response
   * text matches the input text
   * @param  {[type]} statementText [description]
   * @return {[type]}               [description]
   */
  remove(statementText) {
    throw this.AdapterMethodNotImplementedError(
      "The remove method is not implemented by this adpater."
    )
  }

  /**
   * Return a list of objects from the databse. The quantity of
   * arguments is variable. Only objects which contains the all
   * listed attributes and in which all values match for all listed
   * attributes will be returned.
   * @param  {[type]} args [description]
   * @return {[type]}      [description]
   */
  filter(...args) {
    throw this.AdapterMethodNotImplementedError(
      "The filter method is not implemented by this adpater"
    )
  }
  /**
   * Modifies an entry in the database. Creates an entry if one does not exists.
   * @param  {[type]} statement [description]
   * @return {[type]}           [description]
   */
  update(statement) {
    throw this.AdapterMethodNotImplementedError(
      "The update method is not implemented by this adapter."
    )
  }

  /**
   * Returns the latests response in a conversation if it exists.
   * Returns null if a matching conversation cannot be found.
   * @param  {[type]} conversationId [description]
   * @return {[type]}                [description]
   */
  getLatestResponse(conversationId) {
    throw this.AdapterMethodNotImplementedError(
      "The getLatestResponse method is not implemented by this adapter."
    )
  }

  /**
   * Creates a new conversation.
   * @return {[type]} [description]
   */
  createConversation() {
    throw this.AdapterMethodNotImplementedError(
      "The createConversation method is not implemented by this adapter."
    )
  }

  /**
   * Add the statement and response to the conversation.
   * @param {[type]} conversationId [description]
   * @param {[type]} statement      [description]
   * @param {[type]} response       [description]
   */
  addToConversation(conversationId, statement, response) {
    throw this.AdapterMethodNotImplementedError(
      "The addToConversation method is not implemented by this adapter."
    )
  }

  /**
   * Returns a random statement from the database.
   * @return {[type]} [description]
   */
  getRandom() {
    throw this.AdapterMethodNotImplementedError(
      "The getRandom method is not implemented by this adapter."
    )
  }

  /**
   * Drop the database attached to a given adapter.
   * @return {[type]} [description]
   */
  drop() {
    throw this.AdapterMethodNotImplementedError(
      "The drop method is not implemented by this adapter."
    )
  }

  /**
   * Return only statements that are in response to another statement.
   * A statement must exist which lists the closest matching statement in
   * the inResponseTo field. Otherwise, the logic adapter may find a closest
   * matching statement that does not have a known response.
   *
   * This method may be overriden by a child class to provide a more efficient
   * method to get thsese results.
   * @return {[type]} [description]
   */
  getResponseStatement() {
    let statementList = this.filter()
    let responses = []
    let toRemove = []

    statementList.forEach(statement => {
      statement.inResponseTo.forEach(response => responses.push(response.text))
    })

    statementList.forEach(statement => {
      if (!responses.includes(statement.text)) {
        toRemove.push(statement)
      }
    })

    toRemove.forEach(statement => {
      statementList = statementList.filter(s => s !== statementt)
    })

    return statementList
  }

  EmptyDatabaseException = class {
    constuctor(
      message = "The database currently contains no entries. At least one entry is expected. You may need to train your chat bot to populate your database."
    ) {
      this.message = message
      this.output()
    }
    static output() {
      return this.message
    }
  }

  /**
   * An exception to be raised when a storage adapter method
   * has not been implemented. Typically this indicates that the method
   * should be implemented in a subclass.
   * @type {[type]}
   */
  AdapterMethodNotImplementedError = class {
    constructor(message) {
      this.message = message
      this.output()
    }
    static output() {
      return this.message
    }
  }
}
