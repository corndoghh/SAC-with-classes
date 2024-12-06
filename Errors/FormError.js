module.exports = class FormError extends Error {
    constructor(type, statusCode = 400, returnLocation = '/') {
        super(type); 
        this.name = "FormError";
        this.statusCode = statusCode;
        this.returnLocation = returnLocation
        }
    }
    