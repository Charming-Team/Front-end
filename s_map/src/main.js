import { createApp } from 'vue'
import './styles/style.css'
import './components/common/button.css'
import App from './App.vue'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'
import router from './router.js'

createApp(App).use(router).mount('#app')
