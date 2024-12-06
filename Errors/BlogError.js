module.exports = class BlogError extends Error {
    constructor(type, statusCode = 400, returnLocation = '/blogs') {
        super(type); 
        this.name = "BlogError";
        this.statusCode = statusCode;
        this.returnLocation = returnLocation
        }
    }
    