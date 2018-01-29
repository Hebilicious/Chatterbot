import Sequelize from "sequelize"
import mixin from "mixin"

import {StatementMixin} from "../../conversation.js"

/**
 * An augmented base class for the sequelize models.
 */
class Base {
  constructor(sequelize) {
    this.sequelize = sequelize
    if (!this.sequelized.isDefined(this.name)) {
      this.defineModels()
    } else {
      this.getModel()
    }
  }
  static defineModels() {
    Tag.defineModel()
    Statement.defineModel()
    Response.defineModel()
    Conversation.defineModel()

    this.sequelize.sync().then(() => {
      this.getModel()
    })
  }
  static getModel() {
    return this.sequelize.models[this.name]
  }
}

/**
 * A tag that describes a statement.
 * @type {String}
 */
export class Tag extends Base {
  constructor(sequelize) {
    super(sequelize)
    this.name = "tag"
  }

  static defineModel() {
    const Tag = this.sequelize.define(this.name, {name: Sequelize.TEXT})
  }
}

/**
 * A statement represents a sentence or phrase.
 * @type {String}
 */
export class Statement extends mixin(Base, StatementMixin) {
  constructor(sequelize) {
    super(sequelize)
    this.name = "statement"
  }

  static defineModel() {
    const Statement = this.sequelize.define(this.name, {
      text: {
        type: Sequelize.TEXT,
        unique: true
      },
      extraData: Sequelize.TEXT,
      inResponseTo: Sequelize.INTEGER
    })
    Statement.belongsToMany(Tag, {through: "StatementTag"})

    Statement.belongsToMany(Conversation, {through: "ResponseConversation"})

    Statement.hasMany(Response, {foreignKey: "inResponseTo"})
  }

  /**
   * Return a list of tags for this statement.
   * @return {[type]} [description]
   */
  static getTags() {
    return this.getModel().tags.map(tag => tag.name)
  }

  static getStatement() {
    //=> conversation.js
  }
}

/**
 * Response, contains response related to a given statement.
 * @type {String}
 */
export class Response extends Base {
  constructor(sequelize) {
    super(sequelize)
    this.name = "response"
  }

  static defineModel() {
    const Response = this.sequelize.define(this.name, {
      text: Sequelize.TEXT,
      occurence: {type: Sequelize.INTEGER, defaultValue: 1},
      statementText: {
        type: Sequelize.TEXT,
        references: {model: this.sequelize.models.statement, key: "text"}
      }
    })
    Response.belongsTo(Statement, {foreignKey: "inResponseTo"})
  }
}

/**
 * A conversation.
 * @type {String}
 */
export class Conversation extends Base {
  constructor(sequelize) {
    super(sequelize)
    this.name = "conversation"
  }
  static defineModel() {
    const Conversation = this.sequelize.define(this.name, {})
    Conversation.belongsToMany(Statement, {through: "ResponseConversation"})
  }
}
