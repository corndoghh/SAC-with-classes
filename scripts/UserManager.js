const { readDatabase, deleteEntry, updateEntry, addEntry } = require("./DatabaseManager")
const Crypto = require("crypto")

class User {

    #data

    constructor(userData) { this.#data = userData }

    hasAccount = () => { return this.#data.HasAccount }

    createAccount = async (username, password) => {
        if (this.hasAccount()) { return }
        this.#setValue("username", username)
        this.setPassword(password)
        this.#setValue("HasAccount", true)
    }

    delete = async () => {
        await deleteEntry(this.#data)
        this.#data = undefined
    }

    hasProperty = (key) => { return this.#data.hasOwnProperty(key) }
    addProperty = async (key) => {
        if (this.hasProperty(key)) { return }

        this.#setValue(key, null)
    }

    removeProperty = async (key) => {
        if (!this.hasProperty(key)) { return }

        const oldEntry = {...this.#data}
        delete this.#data[key]
        await updateEntry(oldEntry, this.#data)
    }

    #setValue = async (key, value) => {
        const oldEntry = {...this.#data}
        this.#data[key] = value
        await updateEntry(oldEntry, this.#data)
    }

    setValue = async (key, value) => { if (this.hasProperty(key)) { await this.#setValue(key, value) } }

    getValue = (key) => { return this.#data[key] }

    setPassword = async (password) => {
        if (this.#data.Salt === undefined) { this.#setValue("Salt", Crypto.randomBytes(128).toString('base64')) }
        await this.#setValue("HashedPassword", Crypto.pbkdf2Sync(password, this.#data.Salt, 10000, 64, 'sha512').toString("base64"))
    }

    comparePasswordHash = (password) => {
        return this.#data.HashedPassword === Crypto.pbkdf2Sync(password, this.#data.Salt, 10000, 64, 'sha512').toString("base64")

    }

}

module.exports.addUser = async (Email, FirstName, MiddleNames, LastName, Comment) => {
    //TO DO Error handeling 
    if (this.doesUserExist(Email)) { console.log("no"); return }

    const user = { FirstName, MiddleNames, LastName, Email, "UUID": Crypto.randomUUID(), Comment, "IsEmailVerified": false, "TimeCreated": Date.now(), "HasAccount": false }

    await addEntry(user)
}

module.exports.getUser = async (identifier) => {
    const users = await readDatabase()

    const user = users.filter((user) => (
        user["Email"] === identifier ||
        user["Username"] === identifier ||
        user["UUID"] === identifier  
    ))[0]

    return user !== undefined ? new User(user) : undefined
}

module.exports.doesUserExist = async (identifier) => { return await this.getUser(identifier) === undefined ? false : true }