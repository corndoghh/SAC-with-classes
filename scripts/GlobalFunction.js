const busboy = require("busboy");



const formatFormData = (req) => {
    const bb = busboy({ headers: req.headers });
    return new Promise((resolve, reject) => {
        const files = [];
        const jsonObjects = [];

        bb.on('file', (fieldname, file, filename, encoding, mimetype) => {
            let fileData = [];

            file.on('data', (chunk) => {
                fileData.push(chunk);
            });

            file.on('end', () => {
                const buffer = Buffer.concat(fileData);

                files.push({
                    fieldname,
                    filename,
                    mimetype,
                    buffer
                });
            });
        });

        bb.on('field', (fieldname, value) => {
            if (fieldname === 'json') {
                try {
                    jsonObjects.push(JSON.parse(value));
                } catch (err) {
                    reject(new Error('Invalid JSON data'));
                }
            }
        });

        bb.on('finish', () => { resolve({ files, jsonObjects }); });

        bb.on('error', (err) => { reject(err); });

        req.pipe(bb);
    });

}


module.exports = {
    formatFormData
}