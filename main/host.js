const bridge = require('./bridge');

const Store = require('electron-store');
const store = new Store({ cwd: 'envConfig' });

const fs = require('fs');
const os = require('os');
const ChildProcess = require('child_process');
const { exec } = ChildProcess;

let sudoPwd = undefined;

function tryToApplyHost(pwd, switchName) {
    const hosts = calHost();

    pwd && (sudoPwd = pwd);

    if (sudoPwd) {
        exec(`echo "${sudoPwd}" | sudo -S chmod 777 /etc/hosts && echo "${hosts}" > /etc/hosts && sudo -S chmod 644 /etc/hosts`,
            (error, stdout, stderr) => {
                if (error){
                    if (needRetry(`${stderr}${stdout}`)) {
                        bridge.broadcast('requireSudoPwd', switchName);
                    }
                } else {
                    bridge.broadcast('applyHostSucceed', hosts);
                }
            }
        );
    } else {
        exec(`echo "${hosts}" > /etc/hosts`,
            (error, stdout, stderr) => {
                if (error){
                    if (needRetry(`${stderr}${stdout}`)) {
                        bridge.broadcast('requireSudoPwd', switchName);
                    }
                } else {
                    bridge.broadcast('applyHostSucceed', hosts);
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
    let envlists = store.get('envList');
    const contents = [];

    envlists = envlists.slice(0);
    let [{ content: hostNames }] = envlists.splice(-1, 1);
    let nameArr = hostNames.split(os.EOL).filter(name => !name.trim().startsWith('#'));
    for(let env of envlists) {
        if (env.checked) {
            let envContents = `# ${env.name}${os.EOL}${env.content}`;

            if (env.isSystem || !env.extendNames) {
                contents.push(envContents);
            } else {
                const connectedHost = nameArr.map(name => {
                    name = name.trim();
                    if (name.startsWith('#') || !name.length) {
                        return name;
                    }
                    return `${env.ip} ${name}`;
                }).join(os.EOL);
                contents.push(`${envContents}${os.EOL}${connectedHost}`);
            }
        }
    }
    const common = contents.splice(0, 1);
    contents.push(common);
    return contents.join(`${os.EOL}${os.EOL}`);
}


const tryToBackUp = () => {
    store.set('version', 1);
    if(!store.get('envList')) {
        fs.readFile('/etc/hosts', 'utf8', (err, data) => {
            if (err) {

            }
            store.set('envList', [{
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

exports.tryToApplyHost = tryToApplyHost;
exports.tryToBackUp = tryToBackUp;
