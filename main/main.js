// import {app, BrowserWindow} from 'electron';
// import path from 'path';
// import url from 'url';
// import fs from 'fs';

const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');

// import Store from 'electron-store';
const Store = require('electron-store');
const store = new Store({ cwd: 'envConfig' });

// import './bridge';
require('./bridge');


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
}

app.on('ready', () => {
    createWindow();
    initMenu();
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

{
    if(!store.get('env-list')) {
        fs.readFile('/etc/hosts', 'utf8', (err, data) => {
            if (err) {

            }
            store.set('env-list', [{
                name: 'COMMON',
                checked: true,
                content: `# COMMON`,
                isSystem: true,
                canDelete: false
            }, {
                name: 'My hosts',
                checked: true,
                content: `# My hosts
${data}`
            }, {
                name: 'backup',
                checked: false,
                canEdit: false,
                canDelete: false,
                isSystem: true,
                content: `# backup
${data}`,
            }, {
                name: 'Host Names',
                showCheck: false,
                canDelete: false,
                checked: true,
                isSystem: true,
                content: `# Host Names`
            }]);
        })
    }
}


const template = [{
    label: 'LeeHost',
    submenu: [{
        label: 'About',
        click: () => {
            win.webContents.send('showAbout');
        }
    }]
}, {
    label: 'Edit',
    submenu: [{
        label: 'Cut',
        role: 'cut'
    }, {
        label: 'Copy',
        role: 'copy'
    }, {
        label: 'Paste',
        role: 'paste'
    }, {
        label: 'Select All',
        role: 'selectall'
    }/* , {
        label: 'DevTool',
        role: 'toggledevtools'
    } */]
}];

function initMenu() {
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}
