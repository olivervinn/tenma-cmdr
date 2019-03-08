import './assets/style/main.sass'
import './assets/style/animations.sass'
import './assets/fontawesome/css/fontawesome-all.css'
import 'element-ui/lib/theme-chalk/index.css'

import Vue from 'vue'
import VueElectron from 'vue-electron'
import VueI18n from 'vue-i18n'
import ElementUI from 'element-ui'
import enApp from './i18n/en'
import deApp from './i18n/de'
import esApp from './i18n/es'
import frApp from './i18n/fr'

import App from './App'
import router from './router'
import store from './store'

Vue.config.productionTip = false
Vue.config.devtools = true

Vue.use(VueI18n)
Vue.use(VueElectron)

const messages = {
  en: {
    ...enApp
  },
  es: {
    ...esApp
  },
  fr: {
    ...frApp
  },
  de: {
    ...deApp
  }
}

const i18n = new VueI18n({
  locale: 'en',
  messages
})

Vue.use(ElementUI, {
  i18n: (key, value) => i18n.t(key, value)
})

/* eslint-disable no-new */
new Vue({
  components: {
    App
  },
  i18n,
  router,
  store,
  template: '<App/>'
}).$mount('#app')

/* Enable webpack hot reloading */
if (module.hot) {
  module.hot.accept()
}
