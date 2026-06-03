import { createApp } from 'vue'
import './styles/style.css'
import './components/common/button.css'
import App from './App.vue'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'
import router from './router.js'
import AppButton from './components/common/AppButton.vue'
import AppCard from './components/common/AppCard.vue'

const app = createApp(App)
app.component('AppButton', AppButton)
app.component('AppCard', AppCard)
app.use(router).mount('#app')
