<template lang="pug">
    .home.full-height
        .side-list
            env-list(ref="envList" v-on:changeSwitch="changeSwitch")
        .host-edit.full-height
            i.leefont.leeicon-lock(v-if="activeHost.canEdit === false")
            codemirror(v-model="activeHost.content" :options="cmOptions" @gutterClick="onGutterClick")
            .operator(v-if="activeHost.canApply !== false")
                i-button(type="primary" size="small" @click="applyCurrentHost")
                    i.leefont.leeicon-check
                    | {{activateText}}

        modal(v-model="sudoPwdModel.visible" title="Input your sudo password" @on-ok="inputSudoPwdOk" @on-cancel="inputSudoPwdCancel" width="400" class="sudo-pwd-modal")
            |Password
            i-input(v-model="sudoPwdModel.pwd" class="sudo-pwd-input" type="password")
        modal(v-model="showAbout" v-bind:closable="false" width="250")
            .about
                img.logo(:src="logoSrc")
                div LeeHost(1.0.0)
            div(slot="footer")
                i-button(type="ghost" @click="hideAbout") Close
</template>


<script>
import EnvList from '../env-list';
import { codemirror } from 'vue-codemirror';
import 'codemirror/addon/selection/active-line';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/lib/codemirror.css';

import IButton from 'iview/src/components/button';
import IInput from 'iview/src/components/input';
import Modal from 'iview/src/components/modal';
import 'iview/dist/styles/iview.css';
import '../resources/fonts/iconfont.css';

import { ipcRenderer } from 'electron';


export default {
    components: {
        EnvList,
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
            showAbout: false,
            logoSrc: require('../../assets/app.png'),
        }
    },
    computed: {
        activateText() {
            return this.activeHost.checked ? 'Apply' : 'Activate';
        },
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
        ipcRenderer.on('applyHostSucceed', (event, args) => {
            console.log(args, 'hahha');
        });

        ipcRenderer.on('requireSudoPwd', () => {
            this.sudoPwdModel = {
                visible: true
            }
        });

        ipcRenderer.on('showAbout', () => {
            this.showAbout = true;
        });
    },
    methods: {
        changeSwitch(host) {
            this.activeHost = host;
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
            this.$refs.envList.storeEnvList();
        },

        inputSudoPwdOk() {
            ipcRenderer.send('sudoPwdApply', {
                pwd: this.sudoPwdModel.pwd
            });
        },
        inputSudoPwdCancel() {
            ipcRenderer.send('sudoPwdCancel');
        },
        hideAbout() {
            this.showAbout = false;
        }
    }
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

