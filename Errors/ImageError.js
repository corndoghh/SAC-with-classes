module.exports = class ImageError extends Error {
    constructor(type, statusCode = 400, returnLocation = '/') {
        super(type); 
        this.name = "ImageError";
        this.statusCode = statusCode;
        this.returnLocation = returnLocation
        }
    }
    