const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');

// Path to the zip file and the destination folder
const zipFilePath = path.join(__dirname, 'Rhubarb.zip');
const destinationFolder = 'C:\\';

// Create destination folder if it doesn't exist
if (!fs.existsSync(destinationFolder)) {
    fs.mkdirSync(destinationFolder);
}

// Unzip the file
fs.createReadStream(zipFilePath)
    .pipe(unzipper.Extract({ path: destinationFolder }))
    .on('close', () => {
        console.log('some.zip has been extracted to C:\\Rhubarb');
    });
