<template lang="pug">
    .env-wrap
        ul.env-list
            li(v-for="(env, index) in envs" @click="checkHost(env)" :class="{active: env.name === activeName}")
                i(:class="['env-icon leefont', index === 0 ? 'leeicon-computer' : 'leeicon-file']")
                span.env-name {{env.name}}
                span.op(v-if="env.showCheck !== false")
                    i.leefont.leeicon-edit(v-if="env.isSystem !== true" @click="editEnv(env)")
                    i-switch(v-model="env.checked" size="small" :disabled="env.canCheck === false")
        .env-bar
            i.leefont.leeicon-plus(@click="addEnv")
            span.op

        modal(ref="hostModal" v-model="hostModal.visible" width="450" :title="hostModal.title" @on-ok="saveHost" :mask-closable="false" :loading="true")
            .name
                |Host name
                i-input(v-model="hostModal.name" class="host-name")
            checkbox(v-model="hostModal.extendNames") Host Names继承所有域名,并设定IP
            i-input(v-if="hostModal.extendNames" class="host-ip" v-model="hostModal.ip" placeholder="input ip for this environment")

            .delete-host(v-if="hostModal.editMode")
                Button(type="dashed" class="delete-btn" @click="deleteHost")
                    i.leefont.leeicon-delete
                    | delete this host

</template>

<script>
import Store from 'electron-store';
const store = new Store({ cwd: 'envConfig' });

import { ipcRenderer } from 'electron';

import ISwitch from 'iview/src/components/switch';
import IInput from 'iview/src/components/input';
import Modal from 'iview/src/components/modal';
import Checkbox from 'iview/src/components/checkbox';
import Button from 'iview/src/components/button';
import 'iview/dist/styles/iview.css';
import '../resources/fonts/iconfont.css';

function storeEnv(envs, tryToApply) {
    store.set('env-list', envs);
    ipcRenderer.send('applyHost');
}

function debounce(fn, delay) {
    let ti = 0;
    return function(...args) {
        clearTimeout(ti);
        ti = setTimeout(() => {
            fn.apply(this, args);
        }, delay);
    }
}

const deStore = debounce(storeEnv, 500);

export default {
    components: {
        ISwitch,
        Modal,
        Checkbox,
        IInput,
        Button,
    },
    data() {
        const envs = store.get('env-list');
        envs.unshift({
            name: 'System Hosts',
            showCheck: false,
            canEdit: false,
            canApply: false,
        });
        return {
            envs,
            activeName: 'System Hosts',
            hostModal: {
                visible: false,
            }
        }
    },
    watch: {
        envs: {
            handler(val) {
                this.storeEnvList({ val });
            },
            deep: true
        }

    },
    mounted() {
        this.$emit('changeSwitch', this.envs[0]);

        const content = ipcRenderer.sendSync('callSystemHost');
        this.envs[0].content = content;

        ipcRenderer.on('applyHostSucceed', (event, args) => {
            this.envs[0].content = args;
        });
    },
    methods: {
        storeEnvList({ val = this.envs } = {}) {
            deStore(val.slice(1));
        },
        checkHost(env) {
            this.activeName = env.name;
            this.$emit('changeSwitch', env);
        },
        editEnv(env) {
            this.hostModal = {
                visible: true,
                title: `Edit ${env.name}`,
                name: env.name,
                extendNames: env.extendNames,
                ip: env.ip,
                editMode: true,
                originalName: env.name
            };
        },
        addEnv() {
            this.hostModal = {
                visible: true,
                title: 'Add new host',
                name: '',
                extendNames: false,
                ip: '',
                editMode: false,
            }
        },
        saveHost() {
            this.$refs.hostModal.buttonLoading = false;
            if (this.hostModal.editMode) {
                let [env1, env2] = this.envs.filter(({ name }) => name === this.hostModal.name || name === this.hostModal.originalName);
                if (env2) {
                    this.$Message.error({
                        content: `${this.hostModal.name}已经存在，名字不可重复`,
                        duration: 3
                    });
                } else {
                    Object.assign(env1, {
                        name: this.hostModal.name,
                        extendNames: this.hostModal.extendNames,
                        ip: this.hostModal.ip,
                    });
                    this.hostModal = {
                        visible: false,
                    };
                    this.storeEnvList();
                }
            } else {
                const env = this.envs.find(({ name }) => name === this.hostModal.name);
                if (env) {
                    this.$Message.error({
                        content: `${this.hostModal.name}已经存在，名字不可重复`,
                        duration: 3
                    });
                } else {
                    let content = `# ${this.hostModal.name}`;
                    if (this.hostModal.extendNames) {
                        content = `${content}
# ${this.hostModal.ip} extends from Host Names
`
                    }
                    this.envs.splice(-2, 0, {
                        name: this.hostModal.name,
                        ip: this.hostModal.ip,
                        extendNames: this.hostModal.extendNames,
                        content
                    });
                    this.hostModal = {
                        visible: false,
                    };
                    this.storeEnvList();
                }
            }
        },
        deleteHost() {
            this.envs = this.envs.filter(({ name }) => name !== this.hostModal.name);
            this.hostModal = {
                visible: false
            };
        }
    }
}
</script>

<style lang="postcss" scoped>
    .env-wrap {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: #373c47;
    }

    .env-list {
        width: 100%;
        flex: 1;
        list-style: none;
        overflow: auto;

        li {
            height: 35px;
            line-height: 35px;
            font-size: 16px;
            color: #979ca7;
            cursor: pointer;

            .leeicon-edit {
                display: none;
                margin: 0 10px;
            }

            &.active {
                background: #2d3038;
                color: #fff;
            }

            &:hover {
                .leeicon-edit {
                    display: inline;
                }
            }
        }

        .op {
            float: right;
            margin-right: 12px;
        }

        .env-icon {
            margin: 0 10px 0 15px;
        }
    }

    .env-bar {
        bottom: 0;
        cursor: default;
        width: 100%;
        height: 35px;
        color: #979ca7;
        line-height: 35px;
        font-size: 16px;

        .op {
            float: right;
            margin-right: 12px;
        }

        .leeicon-plus {
            margin: 0 10px 0 15px;
        }
    }

    .name {
        display: flex;
        line-height: 32px;
        margin-bottom: 15px;

        .host-name {
            flex: 1;
            margin-left: 15px;
        }
    }

    .host-ip {
        margin-top: 5px;
    }

    .delete-host {
        margin-top: 10px;

        .delete-btn {
            color: #ed3f14;
            border-color: #ed3f14;

            &:hover {
                border-color: #ed3f14;
            }
        }
    }
</style>

<style lang="postcss">

</style>

