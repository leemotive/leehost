import './base/leehost.css';

import Vue from 'vue/dist/vue';
import VueRouter from 'vue-router';

import Message from 'iview/src/components/message';

Vue.use(VueRouter);
Vue.prototype.$Message = Message;

import Home from './home';
const About = {template: '<div>About</div>'};

const routes = [
    {path: '/', component: Home},
    {path: '/home', component: Home}
]

const router = new VueRouter({routes});

const app = new Vue({
    router
}).$mount('#app')