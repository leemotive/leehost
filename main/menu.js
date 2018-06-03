import { Menu } from 'electron';

const template = [{
    label: 'LeeHost',
    submenu: [{
        label: 'About',
        click: () => {
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
    }]
}]

export default function initMenu(app) {
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}