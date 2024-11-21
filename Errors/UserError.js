module.exports = class UserError extends Error {
constructor(type, statusCode = 400) {
    super(type); 
    this.name = "UserError";
    this.statusCode = statusCode;
    }
}
