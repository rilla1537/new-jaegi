// main.js

// import './assets/main.css' // 필요하다면 주석 해제

import { createApp } from 'vue'
import { createPinia } from 'pinia' // 1. Pinia 생성 함수 임포트
import router from '@/router'
import App from './App.vue'

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

app.mount('#app');