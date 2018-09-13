const { Menu, shell } = require('electron');
const ImExport = require('./imexport');

const bridge = require('./bridge');
const version = require('../package.json').version

const template = [{
    label: 'LeeHost',
    submenu: [{
        label: 'About',
        click: () => {
            bridge.broadcast('showAbout', version);
        }
    }, {
        type: 'separator'
    }, {
        label: 'Hide',
        role: 'hide'
    }, {
        label: 'Hide Others',
        role: 'hideothers'
    }, {
        label: 'Unhide',
        role: 'unhide'
    }, {
        type: 'separator'
    }, {
        label: 'Quit',
        role: 'quit'
    }]
}, {
    label: 'File',
    submenu: [{
        label: 'New',
        accelerator: 'CommandOrControl+N',
        click() {
            bridge.broadcast('addNewEnv');
        }
    }, {
        type: 'separator'
    }, {
        label: 'Import',
        click(...args) {
            ImExport.import(...args);
        }
    }, {
        label: 'Export',
        click(...args) {
            ImExport.export(...args);
        }
    }]
}, {
    label: 'Edit',
    submenu: [{
        label: 'Undo',
        role: 'undo'
    }, {
        label: 'Redo',
        role: 'redo'
    }, {
        type: 'separator'
    }, {
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
    }, {
        label: 'Reload',
        role: 'reload'
    }, {
        label: 'ForceReload',
        role: 'forcereload'
    }, {
        label: 'DevTool',
        role: 'toggledevtools'
    }]
}, {
    label: 'View',
    submenu: [{
        label: 'Reset Zoom',
        role: 'resetzoom'
    }, {
        label: 'Zoom In',
        role: 'zoomin'
    }, {
        label: 'Zoom Out',
        role: 'zoomout'
    }, {
        type: 'separator'
    }, {
        label: 'Toggle Full Screen',
        role: 'togglefullscreen'
    }]
}, {
    label: 'Window',
    submenu: [{
        label: 'Minimize',
        role: 'minimize'
    }, {
        label: 'Close',
        role: 'close'
    }, {
        label: 'Zoom',
        role: 'zoom'
    }]
}, {
    label: 'Help',
    submenu: [{
        label: 'Feedback',
        click() {
            shell.openExternal('https://github.com/leemotive/leehost/issues')
        }
    }, {
        label: 'Homepage',
        click() {
            shell.openExternal('https://github.com/leemotive/leehost')
        }
    }]
}];

exports.initMenu = () => {
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

