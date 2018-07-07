const { dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const bridge = require('./bridge');

const Store = require('electron-store');
const store = new Store({ cwd: 'envConfig' });


let lastImExportPath = null;
let systemDownloadPath = null;
let homeDir = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];

exports.init = (app) => {
    systemDownloadPath = app.getPath('downloads');
};

const resolveDefaultPath = () => {
    return path.resolve(lastImExportPath || systemDownloadPath || homeDir, 'leehost.json');
};
const filters = [
    { name: 'JSON', extensions: ['json'] },
    { name: 'All Files', extensions: ['*'] }
];

const importConfig = (filePath, win) => {
    fs.readFile(filePath, { encoding: 'utf8' }, (err, data) => {
        if (err) {
            bridge.broadcast('importError');
            return;
        }
        let config = null;
        try {
            config = JSON.parse(data);
            const newConfig = versionImport[config.version || 0](config);

            for(let [key, value] of Object.entries(newConfig)) {
                store.set(key, value);
            }
            bridge.broadcast('importSuccess');
            win.reload();
        } catch (e) {
            bridge.broadcast('importError');
        }
    });
};

exports.import = (...args) => {
    dialog.showOpenDialog({
        title: 'Import',
        defaultPath: resolveDefaultPath(),
        filters,
    }, ([filePath] = []) => {
        if (filePath) {
            importConfig(filePath, args[1]);
            lastImExportPath = path.dirname(filePath);
        }
    });
};


const exportConfig = (filePath) => {
    const data = JSON.stringify(store.store, null, 4);
    fs.writeFile(filePath, data, { encoding: 'utf8' }, (err) => {
        if (err) {
            bridge.broadcast('exportError');
        }
        bridge.broadcast('exportSuccess');
    });

}

exports.export = () => {
    dialog.showSaveDialog({
        title: 'Export',
        defaultPath: resolveDefaultPath(),
        filters,
    }, (filePath) => {
        if (filePath) {
            exportConfig(filePath);
            lastImExportPath = path.dirname(filePath);
        } else {
            bridge.broadcast('noExportFile');
        }
    });
}




const versionImport = {
    0(data) {
        const oldEnvList = data['env-list'];
        const newEnvList = oldEnvList.map(item => {
            const newDomains = [];
            const domains = item.content.split(/\r?\n/);
            for(let domain of domains) {
                console.log(domain);
                if (!domain) {
                    continue;
                }
                if (/^[#\s]*$/.test(domain.replace(item.name, ''))) {
                    continue;
                }
                if (domain.includes('extends from Host Names')) {
                    continue;
                }
                console.log('push');
                newDomains.push(domain);
            }
            item.content = newDomains.join(os.EOL);
            console.log(item.content);
            return item;
        });
        return { envList: newEnvList };
    },
    1(data) {
        return data;
    }
}

