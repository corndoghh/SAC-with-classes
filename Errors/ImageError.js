module.exports = class ImageError extends Error {
    constructor(type, statusCode = 400) {
        super(type); 
        this.name = "ImageError";
        this.statusCode = statusCode;
        }
    }
    