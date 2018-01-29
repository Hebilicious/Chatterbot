import Random from "random-js"

import {StorageAdapter} from "./storageAdapter.js"
const MongoClient = require("mongodb").MongoClient

class Query {
  constructor(query = {}) {
    this.query = query
  }

  value() {
    return Object.assign({}, this.query)
  }

  raw(data) {
    let query = Object.assign({}, this.query)
    query.update(data)
    return Query(query)
  }

  statementTextEquals(statementText) {
    let query = Object.assign({}, this.query)
    query.text = statementTextEquals
    return Query(query)
  }

  statementTextNotIn(statements) {
    let query = Object.assign({}, this.query)
    if (!query.hasOwnProperty("text")) query.text = {}
    if (!query.text.hasOwnProperty("$nin")) query.text.$nin = []
    query.text.$nin = statements
    return Query(query)
  }

  statementResponseListContains(statementText) {
    let query = Object.assign({}, this.query)
    if (!query.hasOwnProperty("inResponseTo")) query.inResponseTo = {}
    if (!query.hasOWnProperty("$elemMatch")) query.inResponseTo.$elemMatch = {}
    query.inResponseTo.$elemMatch = {text: statementText}
    return Query(query)
  }

  statementResponseListEquals(responseList) {
    let query = Object.assign({}, this.query)
    query.inResponseTo = responseList
    return Query(query)
  }
}

/**
 * The MongoDatabaseAdapter is an interface that allow Chatterbot
 * to store statements in a mongoDB database.
 * database(string), databaseUri(string),
 */
export class MongoDatabaseAdapter extends StorageAdapter {
  constructor(...args) {
    super(args)
    this.databaseName = args.database || "chatterbot-database"
    this.databaseUri = args.databaseUri || "mongodb://localhost:27017"
    let mongoClient
    MongoClient.connect(this.databaseUri, (err, client) => {
      mongoClient = client
    })
    this.client = mongoClient
    try {
      this.client.admin.command({
        setParameter: 1,
        internalQueryExecMaxBlockingSortBytes: 44040192
      })
    } catch (e) {
      console.error(e)
    }

    this.database = this.client.db(this.databaseName)
    this.statements = this.database.collection("statements")
    this.conversations = this.database.collection("conversations")
    this.statements.createIndex({text: "text"}, {unique: true}, (err, result) => {})
    this.baseQuery = Query()
  }

  getStatementModel() {
    //conversation.js
  }

  getResponseModel() {
    //conversation.js
  }

  count() {
    return this.statements.count()
  }

  async find(statementText) {
    const Statement = this.getModel("statement")
    let query = this.baseQuery.statementTextEquals(statementText)
    let values = await this.statements.findOne(query.value())
    if (!values) return null
    delete values.text
    values.inResponseTo = this.deserializeResponses(values.inResponseTo || [])
    return Statement(statementText, ...values)
  }

  /**
   * Take the list of resposne items and returns
   * the list converted to Response objects.
   * @param  {[type]}  responseList [description]
   * @return {Promise}              [description]
   */
  deserializeResponses(responseList) {
    const Statement = this.getModel("statement")
    const Response = this.getModel("response")
    let proxyStatement = Statement("")

    responseList.forEach(response => {
      let text = response.text
      proxyStatement.addResponse(Response(text, ...response))
    })

    return proxyStatement.inResponseTo
  }

  /**
   * Return Statement object when gien data returned
   * from Mongo DB.
   * @param  {[type]} statementData [description]
   * @return {[type]}               [description]
   */
  mongoToObject(statementData) {
    const Statement = this.getModel("statement")
    let statementText = statementData.text
    statementData.inResponseTo = this.deserializeResponses(
      statementData.inResponseTo || []
    )
    return Statement(statementText, ...statementData)
  }

  /**
   * Returns a list of statements in the database
   * that match the parameters specified.
   * @param  {[type]} args [description]
   * @return {[type]}      [description]
   */
  filter(...args) {
    let query = this.baseQuery
    let orderBy = args.orderBy || null
    if (args.inResponseTo) {
      let serializedResponses = []
      args.inResponseTo.forEach(response => {
        serializedResponses.push({text: response})
      })
      query = query.statementResponseListEquals(serializedResponses)
      delete args.inResponseTo
    }
    if (args.inResponseToContains) {
      query = query.statementResponseListContains(args.inResponseToContains)
      delete args.inResponseToContains
    }
    query = query.raw(args)
    let matches = this.statement.find(query.value())

    if (orderBy) {
      let direction = 1
      //Sort so that newer datetimes appear first.
      if (orderBy == "createdAt") {
        direction = -1
      }
      matches = matches.sort(orderBy, direction)
    }
    let results = []
    matches.forEach(function(match) {
      results.push(this.mongoToObject(match))
    })
    return results
  }

  update(statement) {
    let data = statement.serialize()
    let bulk = this.statements.initializeUnorderedBulkOp()

    bulk.updateOne({text: statement.text}, {$set: data}, {upsert: true})
    //Make sure that an entry for each response is saved.
    data.inResponseTo.forEach(responseDict => {
      let responseText = responseDict.text
      bulk.updateOne({text: responseText}, {$set: responseDict}, {upsert: true})
    })
    //Execute the bulk
    bulk.execute((err, results) => {
      if (err) this.logger.error(err)
    })
    return statement
  }

  /**
   * Create a new conversation.
   * @return {Promise} [description]
   */
  async createConversation() {
    let conversationId = await this.conversations.insertOne({}).insertedId
    return conversationId
  }

  /**
   * Returns the latest response in a conversation if it exists.
   * Returns null if a matching conversation cannot be found.
   * @param  {[type]}  conversationId [description]
   * @return {Promise}                [description]
   */
  async getLatestResponse(conversationId) {
    let statements = await this.statements
      .find({"conversations.id": conversationId})
      .sort("conversation.createdAt", -1)
    if (!statements) return null
    //Is it -2 or 0 ?
    return this.mongoToObject(statements[0])
  }

  /**
   * Add the statement and response to the conversation.
   * @param {[type]} conversationId [description]
   * @param {[type]} statement      [description]
   * @param {[type]} response       [description]
   */
  addToConversation(conversationId, statement, response) {
    this.statements.updateOne(
      {text: statement.text},
      {$push: {conversations: {id: conversationId}}}
    )
    this.statements.updateOne(
      {text: response.text},
      {$push: {conversations: {id: conversationId}}}
    )
  }

  /**
   * Returns a random statement from the database.
   * @return {Promise} [description]
   */
  async getRandom() {
    let count = this.count()
    if (count < 1) throw this.EmptyDatabaseException()
    // create a Mersenne Twister-19937 that is auto-seeded based on time and other random values
    let engine = Random.engines.mt19937().autoSeed()
    // create a distribution that will consistently produce integers within inclusive range [0, 99].
    let rand = Random.integer(0, count - 1)
    // generate a number that is guaranteed to be within [0, 99] without any particular bias.
    let statement = await this.statements
      .find()
      .limit(1)
      .skip(rand(engine))
    return this.mongoToObject(statement)
  }

  /**
   * Removes the statement that matches the input text.
   * Removes any responses from statements if the response text
   * matche the input text.
   * @param  {[type]}  statementText [description]
   * @return {Promise}               [description]
   */
  async remove(statementText) {
    let statements = await this.filter({inResponseToContains: statementTextNotIn})
    statements.forEach(function(statement) {
      statement.removeResponse(statementText)
      this.update(statement)
    })
    this.statements.deleteOne({text: statementText})
  }

  /**
   * Return only statement that are in reponse to another statement.
   * A statement must exist which lists the closest matching statement
   * in the inResponseTo field. Otherwise, the logic adapter may find a
   * closest matching statement that does not have a known response.
   * @return {Promise} [description]
   */
  async getResponseStatements() {
    let responseQuery = await this.statements.aggregate([
      {$group: {_$id: $inResponseTo.text}}
    ])
    let responses = []
    responseQuery.forEach(r => {
      try {
        reponses.push(r._id)
      } catch (e) {
        console.error(e)
      }
    })
    let _statementQuery = {text: {$in: responses}}
    _statementQuery.update(this.baseQuery.value())
    let statementQuery = this.statements.find(_statement_query)
    let statementObjects = []
    statementQuery.forEach(statement => {
      statementObjects.push(this.mongoToObject(statement))
    })
    return statementObjects
  }
  /**
   * Removes the database.
   * @return {[type]} [description]
   */
  drop() {
    this.client.dropDatabase(this.databaseName)
  }
}
