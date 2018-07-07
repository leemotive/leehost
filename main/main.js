const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');


const bridge = require('./bridge');
require('./event');
const menu = require('./menu');
const ImExport = require('./imexport');

const host = require('./host');

let win;
function createWindow() {
    win = new BrowserWindow({ width: 800, height: 600 });
    win.loadURL(url.format({
        pathname: path.join(__dirname, '../render/index.html'),
        protocol: 'file:',
        slashes: true
    }));

    win.on('closed', () => {
        win = null;
    });

    bridge.registerSender(win.webContents);
}

app.on('ready', () => {
    createWindow();
    ImExport.init(app);
    menu.initMenu();
});


app.on('window-all-closed', () => {
    if (process.platform != 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (win === null) {
        createWindow();
    }
});


host.tryToBackUp();
