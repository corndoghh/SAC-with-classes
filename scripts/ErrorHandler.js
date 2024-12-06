//Errors
const UserError = require("../Errors/UserError")
const UserErrorTypes = require("../Errors/UserErrorTypes")
const BlogError = require("../Errors/BlogError");
const BlogErrorTypes = require("../Errors/BlogErrorTypes");
const ImageError = require("../Errors/ImageError")
const ImageErrorTypes = require("../Errors/ImageErrorTypes")
const FormError = require("../Errors/FormError")
const FormErrorTypes = require("../Errors/FormErrorTypes")


/**
 * 
 * @param {UserError, BlogError} err 
 * @param {*} res 
 * @returns {}
 */
const ErrorHandling = (err, res) => { return res.status(err.statusCode).json({ error: err.message }); }

module.exports = {
    UserError,
    UserErrorTypes,
    BlogError,
    BlogErrorTypes,
    ImageError,
    ImageErrorTypes,
    FormError,
    FormErrorTypes,
    ErrorHandling
};