const fs = require('fs/promises')

module.exports = class ImageManager {

    #directory

    static isImage = (buffer) => {
        if (!Buffer.isBuffer(buffer)) {
            throw new Error('Input is not a buffer');
        }
        return (
            buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) ||
            buffer.subarray(0, 3).equals(Buffer.from([0xFF, 0xD8, 0xFF])) ||
            buffer.subarray(0, 6).equals(Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61])) ||
            buffer.subarray(0, 6).equals(Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]))
        ) ? true : false
    }

    constructor(directory) {
        this.#directory = __dirname + "/../" + directory
        fs.stat(this.#directory).catch(async () => await fs.mkdir(this.#directory))
    }

    uploadImage = async (image) => {
        if (!ImageManager.isImage(image.buffer)) { return false }
        console.log(image)
        await fs.writeFile(this.#directory + '/' + image.filename.filename, image.buffer)
    }

    doesImageExist = async (filename) => {
        return (await this.getFileFromName(filename)) === false ? false : true
    }

    getFileFromName = async (filename) => {
        const files = await fs.readdir(this.#directory)
        const file = (files.filter((file) => file.split('.')[0] === filename))[0]
        return file === undefined ? false : file
    }


    getImage = async (filename) => {
        const file = await this.getFileFromName(filename)
        return file === false ? false : {
            buffer: await fs.readFile(this.#directory + '/' + file),
            filename: file
        }
    }

    deleteImage = async (filename) => {
        const file = await this.getFileFromName(filename)
        if (!file) { return }
        await fs.unlink(this.#directory + '/' + file)
    }

}

