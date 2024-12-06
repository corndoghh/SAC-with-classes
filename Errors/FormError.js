module.exports = class FormError extends Error {
    constructor(type, statusCode = 400) {
        super(type); 
        this.name = "FormError";
        this.statusCode = statusCode;
        }
    }
    