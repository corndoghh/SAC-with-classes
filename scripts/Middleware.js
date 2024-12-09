const { ErrorHandling, UserError, UserErrorTypes, BlogError, BlogErrorTypes, ImageError, ImageErrorTypes, FormError, FormErrorTypes } = require('./ErrorHandler')

const UserManager = require("./UserManager")
const BlogManager = require("./BlogManager")
const { formatFormData } = require("./GlobalFunction")


const blogManager = new BlogManager()
const userManager = new UserManager()

const handleFormData = async (req, _res, next) => {
    try {
        const { jsonObjects: [json], files: [image] } = await formatFormData(req);
        if (!json) {
            throw new FormError(FormErrorTypes.MISSING_REQUIRED_FIELD, 400);
        }
        req.body = json
        req.image = image
        next()
    } catch (error) {
        return { undefined, undefined }
    }
}

const returnURL = (req, res, next) => {
    let { return_url } = req.method === "GET" ? req.query : req.body;
    req.return_url = return_url === undefined ? "/" : return_url
    next()
}

const reqNoAuth = (req, res, next) => {
    return !req.session.loggedIn ?
    next() :
    ErrorHandling(new UserError(UserErrorTypes.ALREADY_LOGGED_IN, 409), req, res)
}

const reqAuth = async (req, res, next) => {
    if (req.session.loggedIn) { next(); return }
    res.redirect(`/login?return_url=${req.originalUrl}`)
}


const reqData = (req, res, next) => {
    return !(req.method === 'GET' ?
    Object.keys(req.query).length > 0 :
    Object.keys(req.body).length > 0) ?
    ErrorHandling(new FormError(FormErrorTypes.NO_DATA_SENT, 400), req, res) :
    next()
}

const reqUser = async (req, res, next) => {
    if ((await Promise.all((Object.values(req.body).length !== 0 ? Object.values(req.body) : Object.values(req.query).length !== 0 ? Object.values(req.query) : [req.session.UUID]).map(async (x) => {
        if (await userManager.doesUserExist(x)) { return true }
    }))).filter((x) => x !== undefined)[0]) { next(); return }
    return ErrorHandling(new UserError(UserErrorTypes.USER_NOT_EXIST, 404), req, res);
}



const reqBlog = async (req, res, next) => {
    const { UUID } = req.method === 'GET' ? req.query : req.body;

    // ===== Data Validation ===== 
    if (UUID === undefined) { return ErrorHandling(new BlogError(BlogErrorTypes.INVALID_REQUEST, 409), req, res) }
    if (!(await blogManager.doesBlogExist(UUID))) { return ErrorHandling(new BlogError(BlogErrorTypes.INVALID_BLOG_UUID, 404), req, res) }
    // ===== Data Validation ===== 
    next()
}

const ownBlog = async (req, res, next) => {
    const { UUID } = req.method === 'GET' ? req.query : req.body;

    const blog = await blogManager.getBlog(UUID)
    // ===== Ownership verification =====
    if (blog.getAuthor() !== req.session.UUID) { return ErrorHandling(new BlogError(BlogErrorTypes.INVALID_BLOG_OWNERSHIP, 403), req, res) }
    // ===== Ownership verification =====
    next()
}


module.exports = {
    reqNoAuth,
    reqAuth,
    reqData,
    reqUser,
    reqBlog,
    ownBlog,
    handleFormData,
    returnURL
}