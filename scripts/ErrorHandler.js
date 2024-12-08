//Errors
const UserError = require("../Errors/UserError")
const UserErrorTypes = require("../Errors/UserErrorTypes")
const BlogError = require("../Errors/BlogError");
const BlogErrorTypes = require("../Errors/BlogErrorTypes");
const ImageError = require("../Errors/ImageError")
const ImageErrorTypes = require("../Errors/ImageErrorTypes")
const FormError = require("../Errors/FormError")
const FormErrorTypes = require("../Errors/FormErrorTypes");
const WebError = require("../Errors/WebError");
const WebErrorTypes = require("../Errors/WebErrorTypes");


/**
 * 
 * @param {UserError, BlogError} err 
 * @param {*} res 
 * @returns {}
 */
const ErrorHandling = (err, req, res) => {
    req.headers['embedded'] = req.headers['embedded'] || false;
    if (err instanceof WebError && !req.headers.embedded) {
        return res.render('404.ejs')
    }
    if (err instanceof WebError || req.headers.embedded) {
        return res.status(err.statusCode).json({ error: err.message });
    }
    res.redirect(`${err.returnLocation}?error=${encodeURIComponent(err.message)}`);
}

module.exports = {
    UserError,
    UserErrorTypes,
    BlogError,
    BlogErrorTypes,
    ImageError,
    ImageErrorTypes,
    FormError,
    FormErrorTypes,
    WebError,
    WebErrorTypes,
    ErrorHandling
};