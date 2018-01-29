/**
 * ChatterBot utility functions
 */
import {Adapter, whichAdapter} from "./adapters.js"

/**
 * Remove function to use with this binding (array::remove(stuff))
 * @param  {[type]} forDeletion [description]
 * @return {[type]}             [description]
 */
export function remove(...forDeletion) {
  return this.filter(item => !forDeletion.includes(item))
}

/**
 * @param  {[type]} data [A string or dictionary containing a import_path attribute.]
 * @param  {[type]} args [description]
 * @return {[type]}      [description]
 */
export function initializeClass(data, ...args) {}

/**
 * Raise an exception if validateClass is not a subclass of adapterClass
 * @param  {string} validateClass [The class name to be validated.]
 * @param  {Class} adapterClass  [The class type to check against.]
 * @return {[type]}               [description]
 */
export function validateAdapterClass(validateClass, adapterClass) {
  //If an object was passed, we check for the importPath attribute (see documentation)
  if (validateClass instanceof Object) {
    let originalData = Object.assign({}, validateClass)
    if (!validateClass.importPath) {
      throw Adapter.InvalidAdapterTypeException(
        `The object ${originalData} must have a value for importPath.`
      )
    }
  }
  if (!whichAdapter(validateClass) instanceof adapterClass) {
    throw Adapter.InvalidAdapterTypeException(
      `${validateClass} must be a subclass of ${adapterClass.name} `
    )
  }
}

/**
 * Return user input.
 * @return {[type]} [description]
 */
export function inputFunction() {
  process.stdin.setEncoding("utf8")
  process.stdin.on("readable", () => {
    const chunk = process.stdin.read()
    if (chunk !== null) {
      // process.stdout.write(`data: ${chunk}`)
    }
  })

  // process.stdin.on("end", () => {
  //   process.stdout.write("end")
  // })
  return chunk
}
