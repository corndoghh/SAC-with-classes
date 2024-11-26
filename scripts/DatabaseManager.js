const fs = require('fs/promises')


module.exports = class DatabaseManager {
    
    #jsonPath

    constructor(filePath) {
        this.#jsonPath = __dirname + "/../json/" + filePath

    }

    getIndex = async (entry) => {
        const data = await this.readDatabase()
    
        return (data.map((user, index) => {
            if (JSON.stringify(user) === JSON.stringify(entry)) { return index }
        })).filter((x) => x !== undefined)[0]
    
    }

    doesValueExist = async (key, value) => {
        const data = await this.readDatabase()
    
        return data.map(user => {
            if (user[key] === value) { return true; } 
        }).filter((x) => x !== undefined)[0] ? true : false
    }

    readDatabase = async () => {
        const data = await fs.readFile(this.#jsonPath, "utf-8")
        return JSON.parse(data)
    }
    
    writeDatabase = async (data) => {
        await fs.writeFile(this.#jsonPath, JSON.stringify(data))
    }
    
    addEntry = async (newEntry) => {
        const data = await this.readDatabase()
        data.push(newEntry)
        await this.writeDatabase(data);
    }
    
    deleteEntry = async (entry) => {
        const data = await this.readDatabase()
    
        const index = await this.getIndex(entry)
    
        data.splice(index, 1)
    
        await this.writeDatabase(data)
    
    }
    
    updateEntry = async (oldEntry, newEntry) => {
        const data = await this.readDatabase()
    
        const index = await this.getIndex(oldEntry)
    
        data.splice(index, 1)
    
        data.push(newEntry)
    
        await this.writeDatabase(data);
    }
    
}




