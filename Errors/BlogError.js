module.exports = class BlogError extends Error {
    constructor(type, statusCode = 400) {
        super(type); 
        this.name = "BlogError";
        this.statusCode = statusCode;
        }
    }
    