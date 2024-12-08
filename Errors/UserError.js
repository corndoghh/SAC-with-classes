module.exports = class UserError extends Error {
constructor(type, statusCode = 400, returnLocation = '/') {
    super(type); 
    this.name = "UserError";
    this.statusCode = statusCode;
    this.returnLocation = returnLocation
    }
}
