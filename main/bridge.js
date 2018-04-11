import {ipcMain} from 'electron';
import fs from 'fs';
import os from 'os';
import ChildProcess from 'child_process';

const {exec} = ChildProcess;

import Store from 'electron-store';
const store = new Store({cwd: 'envConfig'});

let sudoPwd = undefined;
let sender = null;

ipcMain.on('sudoPwdCancel', (event, args) => {
    sender = null;
});

ipcMain.on('sudoPwdApply', (event, args) => {
    sudoPwd = args.pwd;

    sender = event.sender;
    tryToApplyHost();
});

ipcMain.on('applyHost', (event, args) => {
    sender = event.sender;
    tryToApplyHost();
});

ipcMain.on('callSystemHost', (event, args) => {
    event.returnValue = fs.readFileSync('/etc/hosts', 'utf8');
});

function tryToApplyHost() {
    const hosts = calHost();

    if (sudoPwd) {
        exec(`echo "${sudoPwd}" | sudo -S chmod 777 /etc/hosts && echo "${hosts}" > /etc/hosts && sudo -S chmod 644 /etc/hosts`,
            (error, stdout, stderr) => {
                if (error){
                    if (needRetry(`${stderr}${stdout}`)) {
                        sender.send('requireSudoPwd', '');
                    }
                } else {
                    sender.send('applyHostSucceed', hosts);
                }
            }
        );
    } else {
        exec(`echo "${hosts}" > /etc/hosts`,
            (error, stdout, stderr) => {
                if (error){
                    if (needRetry(`${stderr}${stdout}`)) {
                        sender.send('requireSudoPwd', '');
                    }
                } else {
                    sender.send('applyHostSucceed', hosts);
                }
            }
        );
    }
}

function needRetry(msg) {
    const lowerMsg = msg.toLowerCase();
    let keys = ['permission denied', 'incorrect password', 'Password:Sorry, try again.'];
    return !!keys.find(k => lowerMsg.includes(k));
}

function calHost() {
    let envlists = store.get('env-list');
    const contents = [];

    envlists = envlists.slice(0);
    let [{content: hostNames}] = envlists.splice(-1, 1);
    let nameArr = hostNames.split(os.EOL).filter(name => !/^\s*#/.test(name));
    for(let env of envlists) {
        if (env.showCheck !== false && env.checked !== false) {
            if (env.isSystem || !env.extendNames) {
                contents.push(env.content);
            } else {
                let hosts = env.content.split(os.EOL);
                let index = 0, len = hosts.length;
                for (; index < len; index++) {
                    if (hosts[index].includes('extends from Host Names')) {
                        break;
                    }
                    if (/^\s*\w/.test(hosts[index])) {
                        break;
                    }
                }

                hosts.splice(++index, 0, nameArr.map(name => {
                    if (/^\s*#/.test(name)) {
                        return name;
                    }
                    return `${env.ip} ${name}`;
                }).join(os.EOL));
                contents.push(hosts.join(os.EOL));
            }
        }
    }

    return contents.join(`${os.EOL}${os.EOL}`);
}

