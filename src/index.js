const {app, BrowserWindow, ipcMain, Menu, contextBridge, ipcRenderer, dialog} = require('electron');
const {spawn} = require('child_process');
const path = require('path');
const {ExportScene} = require('./js/MainMenu');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}


const createWindow = () => {





    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'New',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        // Logic for new file action
                        mainWindow.webContents.executeJavaScript("location.reload();");
                    }
                },
                {
                    label: 'Open',
                    accelerator: 'CmdOrCtrl+O',
                    click: () => {
                        // Logic for open file action
                    }
                },
                {
                    label: 'Import',
                    accelerator: 'CmdOrCtrl+I',
                    click: () => {
                        mainWindow.webContents.executeJavaScript(" ImportModel();");
                    }
                },
                {
                    label: 'Export',
                    accelerator: 'CmdOrCtrl+E',
                    click: () => {
                        mainWindow.webContents.executeJavaScript("ExportScene();");
                    }
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Quit',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                {
                    label: 'Cut',
                    accelerator: 'CmdOrCtrl+X',
                    role: 'cut'
                },
                {
                    label: 'Copy',
                    accelerator: 'CmdOrCtrl+C',
                    role: 'copy'
                },
                {
                    label: 'Paste',
                    accelerator: 'CmdOrCtrl+V',
                    role: 'paste'
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Preference',
                    click: () => {
                        mainWindow.webContents.executeJavaScript("OpenPreference();");
                    }
                },
            ]
        },
        {
            label: 'Create',
            submenu: [
                {
                    label: 'New Character',
                    click: () => {
                        mainWindow.webContents.executeJavaScript("OpenAvatarCreator();");
                    }
                },
                {
                    label: 'Cube',
                    click: () => {
                        mainWindow.webContents.executeJavaScript("AddCube();");
                    }
                },
                {
                    label: 'Camera',
                    click: () => {
                        mainWindow.webContents.executeJavaScript("AddCamera();");
                    }
                }
            ]
        },
        {
            label: 'Render',
            submenu: [
                {
                    label: 'Render Video',
                    click: () => {
                        mainWindow.webContents.executeJavaScript("RenderMovie();");
                    }
                },
                {
                    label: 'Render Image',
                    click: () => {

                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    var splash = new BrowserWindow({
        width: 960,
        height: 540,
        transparent: true,
        frame: false,
        alwaysOnTop: true
    });
    splash.loadFile(path.join(__dirname, 'splash.html'));
    splash.center();

    mainWindow.hide();
    splash.show();


    setTimeout(function () {
        splash.close();
        mainWindow.show();
        mainWindow.maximize();
        mainWindow.webContents.openDevTools();
    }, 5000);

    ipcMain.on('run-command', (event, inputAudio) => {

        const command = 'C:\\Rhubarb\\rhubarb.exe';
  //      const inputAudio = 'c:\\starter.wav'; // Replace this with the actual input audio file path
        const args = [inputAudio, '-f', 'json'];

        const process = spawn(command, args);
        let result = '';

        process.stdout.on('data', (data) => {
            result += data.toString();
            console.log(result);
        });

        process.on('close', (code) => {
            event.sender.send('command-done', code, result);
        });


    });


};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
