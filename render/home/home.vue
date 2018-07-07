<template lang="pug">
    .home.full-height
        .side-list
            env-list(ref="envList" v-on:changeSwitch="changeSwitch")
        .host-edit.full-height
            i.leefont.leeicon-lock(v-if="activeHost.canEdit === false")
            view-header(:host="activeHost")
            codemirror(v-model="activeHost.content" :options="cmOptions" @gutterClick="onGutterClick")
            .operator(v-if="activeHost.canApply !== false")
                i-button(v-if="activeHost.canEdit !== false" type="info" size="small" @click="sortDomain")
                    i.leefont.leeicon-sort
                    | Sort
                i-button(v-if="activeHost.canEdit !== false" type="primary" size="small" @click="saveCurrentHost")
                    i.leefont.leeicon-save
                    | Save

        modal(v-model="sudoPwdModel.visible" title="Input your sudo password" @on-ok="inputSudoPwdOk" @on-cancel="inputSudoPwdCancel" width="400" class="sudo-pwd-modal")
            |Password
            i-input(v-model="sudoPwdModel.pwd" class="sudo-pwd-input" type="password")
        modal(v-model="showAbout" v-bind:closable="false" width="250")
            .about
                img.logo(:src="logoSrc")
                div LeeHost(1.0.0)
                div.project-home
                    i.leefont.leeicon-github
                    a(href="javascript:;")
                        span.github-address(@click="goSourceCode") Source Code
            div(slot="footer")
                i-button(type="ghost" @click="hideAbout") Close
</template>


<script>
import EnvList from '../env-list';
import ViewHeader from '../view-header';
import { codemirror } from 'vue-codemirror';
import 'codemirror/addon/selection/active-line';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/search/search';
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/search/jump-to-line';
import 'codemirror/addon/dialog/dialog'
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/dialog/dialog.css'
import 'codemirror/lib/codemirror.css';

import _ from 'lodash';

import IButton from 'iview/src/components/button';
import IInput from 'iview/src/components/input';
import Modal from 'iview/src/components/modal';
import 'iview/dist/styles/iview.css';
import '../resources/fonts/iconfont.css';

import { ipcRenderer, shell } from 'electron';


export default {
    components: {
        EnvList,
        ViewHeader,
        codemirror,
        IButton,
        IInput,
        Modal
    },
    data() {
        return {
            activeHost: {
                canApply: false,
            },
            sudoPwdModel: {
                visible: false,
                pwd: ''
            },
            asc: true,
            showAbout: false,
            logoSrc: require('../../assets/app.png'),
        }
    },
    computed: {
        cmOptions() {
            return {
                tabSize: 4,
                lineNumbers: true,
                styleActiveLine: true,
                matchBrackets: true,
                readOnly: this.activeHost.canEdit === false
            }
        }
    },
    mounted() {
        ipcRenderer.on('requireSudoPwd', (event, switchName) => {
            this.sudoPwdModel = {
                visible: true,
                switchName
            };
        });

        ipcRenderer.on('showAbout', () => {
            this.showAbout = true;
        });

        ipcRenderer.on('importError', () => {
            this.$Message.error({ content: 'Import Error' });
        });
        ipcRenderer.on('importSuccess', () => {
            this.$Message.success({ content: 'Import Success' });
        });
        ipcRenderer.on('noImportFile', () => {
            this.$Message.warning({ content: 'Please select file path' });
        });
        ipcRenderer.on('exportError', () => {
            this.$Message.error({ content: 'Export Error' });
        });
        ipcRenderer.on('exportSuccess', () => {
            this.$Message.success({ content: 'Export Success' });
        });
        ipcRenderer.on('noExportFile', () => {
            this.$Message.warning({ content: 'Please select file path' });
        });
    },
    methods: {
        goSourceCode() {
            shell.openExternal('https://github.com/leemotive/leehost');
        },
        changeSwitch(host) {
            this.activeHost = _.cloneDeep(host);
        },
        onCmReady(cm) {
            console.log(`editor is ready`);
        },
        onCmCodeChange(newCode) {
            console.log(newCode);
        },
        onGutterClick(cm, line) {
            if (this.activeHost.canEdit === false) {
                return;
            }
            let lineContent = cm.getLine(line);
            if (this.activeHost.name !== 'Host Names' && !/((\d{1,3}\.){3}\d{1,3}|(([A-F\d]{0,4})?\:){1,5}[A-F\d]{1,4})(\s+[a-zA-Z\d]+(\.[a-zA-Z\d]+)*)+/.test(lineContent)) {
                return;
            }
            if ('# Host Names' === lineContent) {
                return;
            }

            if (/^\s*#/.test(lineContent)) {
                lineContent = lineContent.replace(/^[\s#]+/, '');
            } else {
                lineContent = `# ${lineContent}`;
            }
            cm.replaceRange(lineContent, { line, ch: 0 }, { line });
        },
        applyCurrentHost() {
            this.activeHost.checked = true;
            this.$refs.envList.storeEnvList(this.activeHost);
        },
        saveCurrentHost() {
            this.$refs.envList.storeEnvList(this.activeHost);
        },
        inputSudoPwdOk() {
            ipcRenderer.send('sudoPwdApply', {
                pwd: this.sudoPwdModel.pwd,
                switchName: this.sudoPwdModel.switchName
            });
        },
        inputSudoPwdCancel() {
            ipcRenderer.send('sudoPwdCancel');
            if (this.sudoPwdModel.switchName) {
                this.activeHost.checked = !this.activeHost.checked;
                this.$refs.envList.storeEnvList(this.activeHost, false);
            }
            this.$Message.error({ content: 'Cancelled' })
        },
        hideAbout() {
            this.showAbout = false;
        },
        sortDomain() {
            const { content } = this.activeHost;
            const domains = content.split(/\r?\n/);
            this.activeHost.content = domains.sort((a, b) => {
                const aname = resolveDomain(a);
                const bname = resolveDomain(b);
                return this.asc ? aname > bname : aname < bname;
            }).join('\n');
            this.asc = !this.asc;
            this.saveCurrentHost();
        }
    }
}

function resolveDomain(config) {
    const matches = config.match(/\s*#*\s*[\d.]*\s+([\w.]+)/);
    return matches ? matches[1] : config;
}
</script>


<style lang="postcss" scoped>
    .home {
        display: flex;

        .side-list {
            width: 240px;
        }

        .host-edit {
            flex: 1;
            display: flex;
            flex-direction: column;

            .vue-codemirror {
                flex: 1;
                overflow: auto;
            }

            .operator {
                height: 45px;
                line-height: 45px;
                background: #f3f3f3;
                text-align: right;

                button {
                    margin-right: 15px;
                }

                .leefont {
                    font-size: 14px;
                    margin-right: 10px;
                }
            }
        }

        .leeicon-lock {
            position: absolute;
            top: 0;
            right: 10px;
            z-index: 1;
        }
    }

    .sudo-pwd-modal {
        width: 400px;
    }

    .ivu-modal-body {
        display: flex;
    }

    .sudo-pwd-input {
        margin-left: 15px;
    }

    .about {
        text-align: center;

        .logo {
            width: 100px;
            height: 100px;
        }

        .project-home {
            .leeicon-github {
                vertical-align: middle;
            }

            .github-address {
                vertical-align: middle;
                padding-left: 5px;
            }
        }
    }
</style>
<style lang="postcss">
    .home {
        .CodeMirror {
            height: 100%;
        }
    }

    .sudo-pwd-modal {
        width: 400px;

        .ivu-modal-body {
            display: flex;
            line-height: 32px;
        }
    }
</style>

