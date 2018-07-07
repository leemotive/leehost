const { ipcMain } = require('electron');
const fs = require('fs');
const host = require('./host');

ipcMain.on('sudoPwdCancel', (event, args) => {
});

ipcMain.on('sudoPwdApply', (event, args) => {
    host.tryToApplyHost(args.pwd, args.switchEnvName);
});

ipcMain.on('applyHost', (event, args) => {
    host.tryToApplyHost('', args.switchEnvName);
});

ipcMain.on('callSystemHost', (event, args) => {
    const sender = event.sender;

    fs.readFile('/etc/hosts', { encoding: 'utf8' }, (err, data) => {
        if (err) {
            sender.send('callSystemHostError');
        }
        sender.send('currentSystemHost', data);
    });
});
