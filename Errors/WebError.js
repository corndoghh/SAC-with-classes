module.exports = class WebError extends Error {
    constructor(type, statusCode = 404) {
        super(type); 
        this.name = "WebError";
        this.statusCode = statusCode;
        }
    }
    