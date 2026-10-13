import { createApp } from 'vue'
import App from './App.vue'
import { loadFromStorage, useBureau } from './state/bureau'
import './style.css'

loadFromStorage()

const app = createApp(App)
const { reportCrash } = useBureau()

app.config.errorHandler = error => reportCrash(error)
window.addEventListener('unhandledrejection', event => reportCrash(event.reason))

app.mount('#app')
