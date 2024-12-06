const busboy = require('busboy');
const fs = require('fs/promises')


//============= TODO maybe move to DatabaseManager.js =============

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         // Set upload directory
//         cb(null, 'uploads/');
//     },
//     filename: (req, file, cb) => {
//         // Set unique file name
//         cb(null, req.session.UUID + path.extname(file.originalname));
//     }
// });

// const fileFilter = (req, file, cb) => {
//     if (file.mimetype.startsWith('image/')) {
//         cb(null, true);
//     } else {
//         cb(new Error('File is not an image'), false);
//     }
// };

// const upload = multer({
//     storage: storage,
//     fileFilter: fileFilter
// });

//============= TODO maybe move to DatabaseManager.js =============



module.exports = class ImageManager {

    #directory

    static isImage = (buffer) => {
        if (!Buffer.isBuffer(buffer)) {
            throw new Error('Input is not a buffer');
        }

        const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
        if (buffer.slice(0, 8).equals(pngSignature)) {
            return true;
        }

        const jpegSignature = Buffer.from([0xFF, 0xD8, 0xFF]);
        if (buffer.slice(0, 3).equals(jpegSignature)) {
            return true;
        }

        const gifSignature1 = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]); 
        const gifSignature2 = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]); 
        if (buffer.slice(0, 6).equals(gifSignature1) || buffer.slice(0, 6).equals(gifSignature2)) {
            return true;
        }

        return false;
    }

    constructor(directory) {
        this.#directory = __dirname + "/../" + directory
        fs.stat(this.#directory).catch(async () => await fs.mkdir(this.#directory))
    }

    uploadImage = async (image) => {
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

