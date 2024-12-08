const Crypto = require("crypto")
const DatabaseManager = require("./DatabaseManager")
const ImageManager = require("./ImageManager")

const imageManager = new ImageManager('pfp')

class User {

    #data
    static databaseManager = new DatabaseManager('users.json')

    constructor(userData) { 
        this.#data = userData
    }

    hasAccount = () => { return this.#data.HasAccount }

    hasVerified = () => { return this.#data.IsEmailVerified }

    createAccount = async (username, password) => {
        if (this.hasAccount()) { return }
        await this.#setValue("Username", username)
        await this.setPassword(password)
        await this.#setValue("HasAccount", true)
        await this.#setValue("TwoFactor", "off")
        await this.#setValue("Language", "en")
    }

    delete = async () => {
        await User.databaseManager.deleteEntry(this.#data)
        this.#data = undefined
    }

    hasProperty = (key) => { return this.#data.hasOwnProperty(key) }
    addProperty = async (key) => {
        if (this.hasProperty(key)) { return }

        await this.#setValue(key, null)
    }

    removeProperty = async (key) => {
        if (!this.hasProperty(key)) { return }

        const oldEntry = {...this.#data}
        delete this.#data[key]
        await User.databaseManager.updateEntry(oldEntry, this.#data)
    }

    #setValue = async (key, value) => {
        const oldEntry = {...this.#data}
        this.#data[key] = value
        await User.databaseManager.updateEntry(oldEntry, this.#data)
    }

    setValue = async (key, value) => { if (this.hasProperty(key)) { await this.#setValue(key, value) } }

    getValue = (key) => { return this.#data[key] }

    setPassword = async (password) => {
        if (this.#data.Salt === undefined) { await this.#setValue("Salt", Crypto.randomBytes(128).toString('base64')) }
        await this.#setValue("HashedPassword", Crypto.pbkdf2Sync(password, this.#data.Salt, 10000, 64, 'sha512').toString("base64"))
    }

    comparePasswordHash = (password) => {
        return this.#data.HashedPassword === Crypto.pbkdf2Sync(password, this.#data.Salt, 10000, 64, 'sha512').toString("base64")
    }

    deletePFP = async () => {
        if (await this.hasPFP()) { await imageManager.deleteImage(this.#data.UUID) }
    }

    setPFP = async (image) => {
        await this.deletePFP()
        image.filename.filename = this.#data.UUID  + '.' + image.filename.filename.split('.').pop()
        await imageManager.uploadImage(image)
    }

    hasPFP = async () => { return imageManager.doesImageExist(this.#data.UUID) }

    getPFP = async () => {
        const filename = (await this.hasPFP()) ? this.#data.UUID : 'empty-pfp'
        return (await imageManager.getImage(filename)).buffer
    }

    setUpFIDO = async () => {

    }




    login = async (req) => {
        req.session.loggedIn = true
        req.session.Language = this.getValue("Language")
        req.session.UUID = this.getValue("UUID")
        return
    }

}

module.exports = class UserManager {

    /**
    * 
    * @param {string} Email
    * @param {string} FirstName
    * @param {string[]} MiddleNames
    * @param {string} LastName
    * @param {string} Comment
    * @returns {User}
    */
    addUser = async (Email, FirstName, MiddleNames, LastName, Comment) => {
        //TO DO Error handeling    
        const user = { FirstName, MiddleNames, LastName, Email, "UUID": Crypto.randomUUID(), Comment, "IsEmailVerified": false, "TimeCreated": Date.now(), "HasAccount": false }
    
        await User.databaseManager.addEntry(user)
        return await this.getUser(Email)
    }

    /**
    * 
    * @param {*} identifier 
    * @returns {User}
    */
    getUser = async (identifier) => {
        const users = await ((new DatabaseManager('users.json')).readDatabase())
    
        const user = users.filter((user) => (
            user["Email"] === identifier ||
            user["Username"] === identifier ||
            user["UUID"] === identifier  
        ))[0]
    
        return user !== undefined ? new User(user) : undefined
    }

    /**
     * 
     * @param {*;} identifier 
     * @returns {boolean}
     */

    doesUserExist = async (identifier) => { return await this.getUser(identifier) === undefined ? false : true }

}
