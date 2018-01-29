import Sequelize from "sequelize"
import Random from "random-js"

import {StorageAdapter} from "./storageAdapter.js"
import * as Models from "../ext/sequelizeApp/models.js"

const fs = require("fs")

function getResponseTable(response) {
  return Models.Response(response.text, response.occurence)
}

/**
 * SQLStorageAdapter allows Chatterbot to store conversation data
 * semi-structured T-SQL database, in any database supported by
 * sequelize.
 *
 * Notes:
 *  -Tables may change (and will), so sae your training data.
 *  There is no data migration (yet).
 *  Performance test not done yet.
 *  Tests using other databases not finished.
 *
 * All parameters are optional, by default a sqlite database is used.
 *
 * It will check if tables are present, if they are not, it will attempt
 * to create the required tables.
 *
 * database : Used for sqlite database. Ignored if databaseUri is specified.
 * databasePath : eg: sqlite:///database_test.db
 * readOnly : false by default, makes all operation read only (create, update, delete
 * won't be executed.)
 *
 */
export class SQLStorageAdapter extends StorageAdapter {
  constructor(...args) {
    super(args)
    //Dialect for sequelize
    let dialect = this.args.dialect || "sqlite"
    //Storage path (for sqlite only)
    let storage = this.args.storage
    //Name for the database
    let databaseName = this.args.database || "ChatterBot"
    //Create a sqlite file if a path isn't specified.

    if (dialect == "sqlite" && storage && storage != ":memory:") {
      fs.writeFile(`path/${databaseName}.sqlite`, "", err => {
        if (err) throw err
        console.log("The database has been created.")
      })
    }
    //Instanciate sequelize.
    //Need to handle user & password?
    this.sequelize = new Sequelize(databaseName, "user", "password", {
      dialect,
      storage
    })

    this.readOnly = this.args.readOnly || false
    //Sequelize ORM should create the statement table from the models
    //even if it doesn't exist.
    this.create()
    //Chatterbot internal query builder is not yet supported for this adapter.
    this.adapterSupportsQueries = false
  }

  getStatementModel() {
    return Models.Statement(this.sequelize)
  }

  getResponseModel() {
    return Models.Response(this.sequelize)
  }

  getConversationModel() {
    return Models.Conversation(this.sequelize)
  }

  getTagModel() {
    return Models.Tag(this.sequelize)
  }

  async count() {
    let Statement = this.getModel("statement")
    return await Statement.count()
  }

  //Shouldn't be necessary with sequelize
  __statementFilter(...args) {}

  /**
   * Returns a statement if it exists.
   * @param  {[type]}  statementText [description]
   * @return {Promise}               [description]
   */
  async find(statementText) {
    // Project.findOne({ where: {title: 'aProject'} }).then(project => {
    let statement = await this.getModel("statement").findOne({
      where: {text: statementText}
    })
    return statement
  }

  /**
   * Removes the statement that match the input text
   * @param  {[type]} statementText [description]
   * @return {[type]}               [description]
   */
  remove(statementText) {
    this.getStatementModel
      .findOne({where: {text: statementText}})
      .then(statement => statement.destroy())
  }

  /**
   * Returns a list of objects from the database.
   * @param  {[type]} args [description]
   * @return {[type]}      [description]
   */
  filter(...args) {
    const Statement = this.getModel("statement")
    const Response = this.getModel("response")
    //Need to see how it works and what are the args.
  }

  /**
   * Modifies an entry in the database.
   * Creates an entry if one does not exist.
   * @param  {[type]}  statement [description]
   * @return {Promise}           [description]
   */
  update(statement) {
    const Statement = this.getModel("statement")
    const Response = this.getModel("response")
    const Tag = this.getModel("tag")

    if (statement) {
      Statement.findOne({
        where: {text: statement.text}
      }).then(record => {
        //Creates a new statement if one does not already exists.
        if (!record) record = Statement(statement.text)
        record.extraData = statement.extraData
        //Handle the tags.
        statement.tags.forEach(t => {
          Tag.findOne({where: {name: t}}).then(tag => {
            //Creates a tag if we don't have one.
            if (!tag) tag = Tag(t)
            record.tags.push(tag)
          })
        })
        //Handle the responses.
        statement.inResponseTo.forEach(response => {
          Response.findOne({
            where: {text: response.text, statementText: statement.text}
          }).then(res => {
            if (res) {
              res.occurence += 1
            } else {
              //Create the record.
              res = Response(response.text, statement.text, response.occurence)
            }
            record.inResponseTo.push(res)
          })
        })
        record.save()
      })
    }
  }

  /**
   * Create a new conversation.
   * @return {Promise} [description]
   */
  createConversation() {
    const Conversation = this.getModel("conversation")
    //Should return a sequelize model
    let conversation = new Conversation()
    let id
    conversation.save().then(c => {
      id = c.id
    })
    return id
  }

  /**
   * Add the statement and response to the conversation.
   */
  async addToConversation(conversationId, statement, response) {
    const Statement = this.getModel("statement")
    const Conversation = this.getModel("conversation")

    let conversation = await Conversation.get(conversationId)
    let statementQuery = await Statement.findOne({where: {text: statement.text}})
    let responseQuery = await Statement.findOne({where: {text: response.text}})

    if (!statementQuery) {
      this.update(statement)
      let statementQuery = await Statement.findOne({where: {text: statement.text}})
    }

    if (!responseQuery) {
      this.update(response)
      let responseQuery = await Statement.findOne({where: {text: response.text}})
    }

    conversation.statements.push(statementQuery)
    conversation.statements.push(reponseQuery)
  }

  /**
   * Return the latest response in a conversation if it exists.
   * Returns null if a matching type conversation cannot be found.
   * @param  {[type]}  conversationId [description]
   * @return {Promise}                [description]
   */
  async getLatestResponse(conversationId) {
    const Statement = this.getModel("statement")
    const Conversation = this.getModel("conversation")

    Statement.findOne({
      include: [
        {
          model: Conversation,
          where: {id: conversationId},
          order: this.sequelize.col("id"),
          limit: 2
        }
      ]
    }).then(statementQuery => {
      if (statementQuery) {
        let statement = statementQuery.getStatement()
        return statement || null
      }
    })
  }

  /**
   * Returns a random statement from the database.
   * @return {Promise} [description]
   */
  async getRandom() {
    const Statement = this.getModel("statement")
    let count = await this.count()
    if (count < 1) {
      throw this.EmptyDatabaseException()
    }
    // create a Mersenne Twister-19937 that is auto-seeded based on time and other random values
    let engine = Random.engines.mt19937().autoSeed()
    // create a distribution that will consistently produce integers within inclusive range [0, 99].
    let rand = Random.integer(0, count)
    // generate a number that is guaranteed to be within [0, 99] without any particular bias.
    let stmt = await Statement.findById(rand(engine))
    return stmt
  }

  /**
   * Drop the database attached to a given adapter.
   * @return {[type]} [description]
   */
  drop() {
    this.sequelize.drop()
  }

  /**
   * Populate the database with the tables.
   * @return {[type]} [description]
   */
  create() {
    this.sequelize.sync()
  }
}
