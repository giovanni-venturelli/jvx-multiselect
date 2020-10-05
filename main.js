import Vue from 'vue';
import JvxMultiselect from './jvx-multiselect';
import VueCustomElement from 'vue-custom-element';
Vue.use(VueCustomElement);

Vue.customElement('jvx-multiselect', JvxMultiselect);
