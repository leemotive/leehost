<template lang="pug">
    .env-wrap
        .env-list
            ul
                li(v-for="(env, index) in preEnv" @click="checkHost(env)" :class="{active: env.name === activeName}")
                    i(:class="['env-icon leefont', index === 0 ? 'leeicon-computer' : 'leeicon-file']")
                    span.env-name {{env.name}}
                    span.op(v-if="env.showCheck !== false")
                        i.leefont.leeicon-edit(v-if="env.isSystem !== true" @click="editEnv(env)")
                        i-switch(v-model="env.checked" size="small" @on-change="envSwitch(env)" :disabled="env.canCheck === false")
            ul
                draggable(v-model="userEnv" :options="{name: 'env'}" @end="dragend()")
                    li(v-for="(env, index) in userEnv" @click="checkHost(env)" :class="{active: env.name === activeName}")
                        i(:class="['env-icon leefont', 'leeicon-file']")
                        span.env-name {{env.name}}
                        span.op(v-if="env.showCheck !== false")
                            i.leefont.leeicon-edit(v-if="env.isSystem !== true" @click="editEnv(env)")
                            i-switch(v-model="env.checked" size="small" @on-change="envSwitch(env)" :disabled="env.canCheck === false")
            ul
                li(v-for="(env, index) in sufEnv" @click="checkHost(env)" :class="{active: env.name === activeName}")
                    i(:class="['env-icon leefont', 'leeicon-file']")
                    span.env-name {{env.name}}
                    span.op(v-if="env.showCheck !== false")
                        i.leefont.leeicon-edit(v-if="env.isSystem !== true" @click="editEnv(env)")
                        i-switch(v-model="env.checked" size="small" @on-change="envSwitch(env)" :disabled="env.canCheck === false")
        .env-bar
            i.leefont.leeicon-plus(@click="addEnv")
            i.leefont.leeicon-sort(@click="sortEnv")
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

import draggable from 'vuedraggable';
import _ from 'lodash';

import 'iview/dist/styles/iview.css';
import '../resources/fonts/iconfont.css';

function storeEnv(envs, { switchEnv, writeSystemHost = true }) {
    store.set('envList', envs);
    writeSystemHost && ipcRenderer.send('applyHost', {
        switchEnvName: switchEnv && switchEnv.name,
    });
}


export default {
    components: {
        draggable,
        ISwitch,
        Modal,
        Checkbox,
        IInput,
        Button,
    },
    data() {
        const envs = store.get('envList');
        envs.unshift({
            name: 'System Hosts',
            showCheck: false,
            canEdit: false,
            canApply: false,
        });

        return {
            preEnv: envs.slice(0, 2),
            userEnv: envs.slice(2, -2),
            sufEnv: envs.slice(-2),
            asc: true,
            activeName: 'System Hosts',
            hostModal: {
                visible: false,
            }
        }
    },
    mounted() {
        this.$emit('changeSwitch', this.preEnv[0]);

        ipcRenderer.send('callSystemHost');
        ipcRenderer.on('currentSystemHost', (event, data) => {
            console.log(data);
            this.preEnv[0].content = data;
            this.$emit('changeSwitch', this.preEnv[0]);
        });
        ipcRenderer.on('callSystemHostError', (event, data) => {
            this.$Message.error({ content: 'Read System Host File Error' });
        });


        ipcRenderer.on('applyHostSucceed', (event, args) => {
            this.preEnv[0].content = args;
            this.$Message.success({ content: 'Succeeded' })
        });
        ipcRenderer.on('addNewEnv', (envent, args) => {
            this.addEnv();
        });
    },
    methods: {
        envSwitch(env) {
            storeEnv([...this.preEnv.slice(1), ...this.userEnv, ...this.sufEnv], { switchEnv: env });
        },
        dragend() {
            storeEnv([...this.preEnv.slice(1), ...this.userEnv, ...this.sufEnv]);
        },
        storeEnvList(env, writeSystemHost = true) {
            const allEnv = [...this.preEnv.slice(1), ...this.userEnv, ...this.sufEnv];
            if (!env) {
                storeEnv(allEnv, { writeSystemHost });
            } else if (env.name) {
                const index = allEnv.findIndex(c => c.name === env.name);
                if (~index) {
                    allEnv.splice(index, 1, _.merge(allEnv[index], env));
                    storeEnv(allEnv, { writeSystemHost });
                }
            } else {
                storeEnv(env, { writeSystemHost });
            }
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
        sortEnv() {
            this.userEnv = this.userEnv.sort((a, b) => {
                const aname = a.name.toLowerCase();
                const bname = b.name.toLowerCase();
                return this.asc ? aname > bname : aname < bname;
            });
            this.asc = !this.asc;
            this.storeEnvList();
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
            const allEnv = [...this.preEnv, ...this.userEnv, ...this.sufEnv];
            if (this.hostModal.editMode) {
                let [env1, env2] = allEnv.filter(({ name }) => name === this.hostModal.name || name === this.hostModal.originalName);
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
                    this.storeEnvList(allEnv.slice(1));
                }
            } else {
                const env = allEnv.find(({ name }) => name === this.hostModal.name);
                if (env) {
                    this.$Message.error({
                        content: `${this.hostModal.name}已经存在，名字不可重复`,
                        duration: 3
                    });
                } else {
                    let content = '';
                    const newEnv = {
                        name: this.hostModal.name,
                        ip: this.hostModal.ip,
                        extendNames: this.hostModal.extendNames,
                        content
                    };
                    allEnv.splice(-2, 0, newEnv);
                    this.userEnv.push(newEnv);
                    this.hostModal = {
                        visible: false,
                    };
                    this.storeEnvList(allEnv.slice(1));
                }
            }
        },
        deleteHost() {
            this.userEnv = this.userEnv.filter(({ name }) => name !== this.hostModal.name);
            this.hostModal = {
                visible: false
            };
            this.storeEnvList();
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
        padding: 0 12px 0 15px;

        .leefont {
            cursor: pointer;
            margin-right: 10px;
        }

        .op {
            float: right;
            margin-right: 12px;
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

