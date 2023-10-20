const path = require('path');
const fs = require('fs');
const unzipper = require('unzipper');

module.exports = {
    packagerConfig: {
        "reloadable": true,
    },
    rebuildConfig: {},
    makers: [
        {
            name: '@electron-forge/maker-squirrel',
            config: {},
        },
        {
            name: '@electron-forge/maker-zip',
            platforms: ['darwin'],
        },
        {
            name: '@electron-forge/maker-deb',
            config: {},
        },
        {
            name: '@electron-forge/maker-rpm',
            config: {},
        },
    ],
    hooks: {
        /*
        packageAfterCopy: async (config, buildPath, electronVersion, platform, arch) => {
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
        }
         */
    }
};
