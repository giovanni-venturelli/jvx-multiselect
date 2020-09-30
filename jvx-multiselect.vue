<template>

  <div>
    <link rel="stylesheet" href="../material-design-icons.css" type="text/css">
    <div :class="[
      'jvx-multiselect',
      { 'jvx-multiselect-error': hasErrors === true},
      { 'jvx-multiselect-isFocused': isOpen === true || isFocused === true },
      { 'jvx-multiselect-isOpen': isOpen === true },
      { 'jvx-multiselect-has-state': isOpen || hasErrors === true || disabled },
      { 'jvx-multiselect-disabled': disabled }
    ]"
         :key="key"
         ref="container">
      <v-menu :close-on-content-click="false"
              :close-on-click="closeOnClick"
              max-height="312px"
              offset-y
              :data-cy="'menu-'+dataCy"
              origin="top center"
              ref="menu"
              v-model="isOpen">
        <template v-slot:activator="{ on }">
          <div :class="[
            { 'input-container': true },
            {'menu-is-open': isOpen},
            { 'selection-active': model != null && model.length > 0 }
          ]">
            <!-- Placeholder -->
            <v-label>{{ placeholder }}</v-label>

            <!-- Selected Options -->
            <div @click="_onActivatorClick" :data-cy="dataCy"
                 class="input-container__selected-container">
              <div class="input-container__selected">
                <v-chip :key="'multi-selected-' + item[itemValue]"
                        @click:close="_removeItem(item)"
                        class="mr-1 mb-1 input__item"
                        close
                        color="primary"
                        small
                        v-for="item in multiModel">
                  {{ item[itemText] }}
                </v-chip>
                <div :key="'selected-' + item[itemValue]"
                     v-for="item in singleModel">
                  {{ item[itemText] }}

                </div>
              </div>
              <div v-on="on"></div>
              <v-icon @click.stop="_removeItem(model[0])"
                      v-if="model !== null && model.length > 0 && multi === false && clearable === true">
                close
              </v-icon>
              <div class="input-container__arrow">
                <v-icon :disabled="disabled"
                        v-if="isLoading === false">arrow_drop_down
                </v-icon>

                <div class="lds-ring"
                     v-if="isLoading === true">
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>

              </div>
            </div>
          </div>

          <!-- Hidden input for validation -->
          <v-text-field :disabled="disabled"
                        :error="hasErrors"
                        :rules="rules"
                        :validate-on-blur="true"
                        class="hidden-input"
                        ref="hiddenInput"
                        v-model="inputModel"/>
        </template>

        <!-- Search -->
        <div :class="[
          'menu-container',
          { 'has-search-bar': searchInput },
          { 'has-footer': footer }
        ]">
          <div>
            <v-text-field :placeholder="searchLabel"
                          @keyup="_onSearch" background-color="transparent"
                          class="ma-0 pa-0 jvx-multiselect-search-field"
                          dense
                          flat
                          @click="_onClick"
                          @click:append="$emit('showAdvancedSearch')"
                          @click:clear="_onSearch"
                          hide-details
                          ref="inputField"
                          solo
                          v-if="searchInput"
                          v-model="searchValue">

              <template v-slot:append>
                <v-btn @click="$emit('showAdvancedSearch')" icon v-if="advancedSearch">
                  <v-icon>
                    more_vert
                  </v-icon>
                </v-btn>

                <v-tooltip left
                           v-if="dirtyAdvancedSearch">
                  <template v-slot:activator="{ on }">
                    <v-btn @click="_handleAdvancedSearchClean" absolute right
                           class="accent justify-center SearchButton__clean-btn" icon width="13" height="13"
                           v-on="on">
                      <v-icon :size="$vuetify.breakpoint.smAndDown ? 6 : 13"
                              class="SearchButton__clean-icon"
                              color="white">clear
                      </v-icon>
                    </v-btn>
                  </template>
                  <span>{{ resources.cleanAdvancedSearch }}</span>
                </v-tooltip>
              </template>


            </v-text-field>


          </div>

          <!-- Selectable Items -->
          <div :class="[
            'menu-content',
            { 'menu-content-prevent-scroll': isLoading }
          ]"
               @scroll="_infiniteScroll"
               ref="scrollable">
            <div>
              <v-list :data-cy="dataCy" v-if="!noData">
                <v-list-item :class="[
                  { 'item-selected primary lighten-2': item.jvxSelected }
                ]"
                             :key="'selectable-' + item[itemValue]"
                             @click="_addItem(item)"
                             v-for="item in selectableItems">
                  <v-list-item-title v-if="!_hasSlot('default')">{{ item[itemText] }}</v-list-item-title>
                  <v-list-item-title v-if="_hasSlot('default')">
                    <slot :name="'default'" v-bind:item="item"/>
                  </v-list-item-title>
                  <v-list-item-subtitle v-if="$scopedSlots['subtitle']">
                    <slot :name="'subtitle'" v-bind:item="item"/>
                  </v-list-item-subtitle>
                </v-list-item>

              </v-list>
              <v-list v-else>
                <v-list-item>
                  <v-list-item-title>{{
                      resources.noDataAvailable
                    }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </div>
          </div>

          <!-- Footer -->
          <div class="menu-footer"
               v-if="footer">
            <div class="menu-footer__info">
              {{ selectableItems.length }}/{{ totalRows }}
            </div>
            <div class="menu-footer__buttons-container">
              <div class="buttons">
                <slot :items="selectableItems"
                      name="buttons"/>
              </div>
            </div>
          </div>
        </div>
      </v-menu>
    </div>
  </div>
</template>
<script>

/**
 * Select and multiselect input with server side call and pagination.
 * @displayName JVX Multiselect
 */
import _cloneDeep from 'lodash/cloneDeep';
import Axios from 'axios';
import resources from './resources';
import vuetify from './plugins/vuetify';
import {VLabel, VChip, VMenu, VIcon, VTextField, VBtn, VTooltip} from 'vuetify/lib';

export default {
  name: 'jvx-multiselect',
  vuetify,
  components: {
    VLabel,
    VChip,
    VMenu,
    VIcon,
    VTextField,
    VBtn,
    VTooltip
  },
  props: {
    /**
     * True if the footer is shown
     */
    footer: {
      type: Boolean,
      default: false
    },
    dataCy: {
      type: String,
      default: ''
    },

    /**
     * True if the search bar is shown
     */
    searchInput: {
      type: Boolean,
      default: false
    },


    /**
     * True if it's possible to clear the selection via clear button
     */
    clearable: {
      type: Boolean,
      default: false
    },

    /**
     * If is set, it's used in the mapping function to translate the text property of the options.
     */
    labels: {
      type: Object,
      default: () => (
          {}
      )
    },

    /**
     * If the select is disabled.
     */
    disabled: {
      type: Boolean,
      default: false
    },

    /**
     * The validation rules.
     */
    rules: {
      type: Array,
      default: () => []
    },

    /**
     * The property of the response object which has to be translated to the value property of the options.
     */
    itemValue: {
      type: String,
      default: 'value'
    },

    /**
     * The property of the response object which has to be translated to the text property of the options.
     */
    itemText: {
      type: String,
      default: 'text'
    },
    /**
     *  The url for the server call.
     */
    url: {
      type: String,
      default: ''
    },

    /**
     * The filter for the server call.
     */
    filter: {
      default: null
    },

    /**
     * Additional custom post parameters for the server call.
     */
    postParameters: {
      type: Object,
      default: () => (
          {}
      )
    },

    /**
     * Force to use ONLY post parameters.
     */
    useOnlyPostParameters: {
      type: Boolean,
      default: false
    },

    /**
     * The selected options.
     */
    model: {
      type: Array,
      default: () => []
    },

    /**
     * The options of the select.
     */
    options: {
      type: Array,
      default: () => []
    },

    /**
     * The mode of the select (default: multi===false)
     */
    multi: {
      type: Boolean,
      default: false
    },

    /**
     * The placeholder.
     */
    placeholder: {
      type: String,
      default: ''
    },

    /**
     *
     */
    isDeselectionable: {
      type: Boolean,
      default: true
    },

    /**
     * Advanced Search in the search input
     */
    advancedSearch: {
      type: Boolean,
      default: false
    },

    /**
     * Advanced Search in the search input
     */
    dirtyAdvancedSearch: {
      type: Boolean,
      default: false
    },


    /**
     * The placeholder of the search input field.
     */
    searchLabel: {
      type: String,
      default: ''
    },

    /**
     * If true the options list closes when click outside the list
     */
    closeOnClick: {
      type: Boolean,
      default: true
    }
  },

  model: {
    prop: 'model',
    event: 'input'
  },

  data() {
    return {
      key: 0,
      selectableItems: [],
      isOpen: false,
      pagination: {
        page: 1,
        pageSize: 15
      },
      totalRows: 0,
      noData: false,
      isLoading: false,
      searchValue: '',
      isSearching: false,
      hasErrors: false,
      inputModel: [],
      isFocused: false,
      resources: resources
    };
  },
  computed: {
    singleModel() {
      return this.model.filter(() => {
        return this.multi
      });
    },
    multiModel() {
      return this.model.filter(() => {
        return !this.multi
      });
    }
  },

  created() {

    this._mapOptions();
    this.$watch('options', () => {
      this._mapOptions();
    });

    this.$watch('isOpen', val => {
      if (val === false) {
        this.$refs.scrollable.scrollTop = 0;
        if (this.$refs.hiddenInput.hasError) {
          this.hasErrors = true;
        }
        this.isFocused = false;
        if (this.searchInput) {
          setTimeout(() => {
            this.key++;
            this.searchValue = '';
          }, 50);
        }
      } else {
        if (this.searchInput && this.dirtyAdvancedSearch === false) {
          setTimeout(() => {
            const inp = this.$refs.inputField;
            if (inp) {
              inp.focus();
            }
          }, 150);

          this.isFocused = true;
        }
      }
    });

    this.$watch('model', val => {
      this.inputModel = _cloneDeep(val);
    }, {
      deep: true,
      immediate: true
    });


  },

  destroyed() {
  },

  mounted() {
    this.$watch('$refs.hiddenInput.shouldValidate', () => {
      this.hasErrors = this.$refs.hiddenInput.hasError && this.$refs.hiddenInput.shouldValidate;
    }, {deep: true});
    this.$watch('$refs.hiddenInput.hasError', () => {
      this.hasErrors = this.$refs.hiddenInput.hasError && this.$refs.hiddenInput.shouldValidate;
    }, {deep: true});

    this.$watch('inputModel', () => {
      this.hasErrors = false;
    }, {deep: true});

  },
  methods: {
    /**
     * check if slot is set
     * @param {string} name
     * @returns {boolean}
     **/
    _hasSlot(name) {
      return !!this.$slots[name] || !!this.$scopedSlots[name]
    },
    _onBlur() {
      this.isFocused = false;
    },
    /**
     * Adds an item to the selected options (model).
     * @param {Object} v
     * @private
     */
    _addItem(v) {
      let mod = [];
      if (this.multi) {
        if (v.jvxSelected === false) {
          mod = _cloneDeep(this.model);
          mod.push(v);
          this.$emit('input', mod);
          v.jvxSelected = true;
        } else {
          this._removeItem(v);
        }
      } else {
        if (this.isDeselectionable && v.jvxSelected === false) {
          this.selectableItems.forEach(si => {
            si.jvxSelected = false;
            if (si[this.itemValue] === v[this.itemValue]) {
              si.jvxSelected = true;
            }
          });

          if (v[this.itemValue] !== null) {
            mod.push(v);
            this.$emit('input', mod);
          }
        } else {
          this._removeItem(v);
        }

        this.isOpen = false;
      }
    },

    /**
     * Remove an item from the selected options (model).
     * @param {Object} item
     * @private
     */
    _removeItem(item) {
      const mod = _cloneDeep(this.model);
      const ind = mod.findIndex(l => l[this.itemValue] === item[this.itemValue]);
      if (ind !== -1) {
        item.jvxSelected = false;
        mod.splice(ind, 1);
        this.$emit('input', mod);
      }
    },

    _onSearch() {
      if (this.isOpen) {
        this.$refs.scrollable.scrollTop = 0;
        const timeout = setTimeout(() => {
          if (!this.isSearching) {
            this.isSearching = true;
            this.pagination.page = 1;
            this.selectableItems = [];
            this._getList();
          } else {
            clearTimeout(timeout);
          }
        }, 1000);
      }
    },

    /**
     * attiva la ricerca avanzata se è dirty
     *
     * @param ev
     * @private
     */
    _onClick(ev) {
      if (this.dirtyAdvancedSearch === true) {
        ev.preventDefault();
        ev.stopPropagation();
        this.$emit('showAdvancedSearch');
        ev.target.blur();
      }
    },

    /**
     * Maps the options to make them consistent with the selected options (model).
     * @private
     */
    _mapOptions() {
      if (this.options && this.options.length > 0) {
        const newOptions = [];
        for (let option of this.options) {
          const it = this.selectableItems.find(v => v[this.itemValue] === option[this.itemValue]);
          if (it) {
            newOptions.push(_cloneDeep(it));
          } else {
            option.jvxSelected = this.model ? !!this.model.map(m => m[this.itemValue]).includes(option[this.itemValue]) : false;
            newOptions.push(_cloneDeep(option));
          }
          this.selectableItems = [];
          this.selectableItems.push(...newOptions);
        }
      }
    },

    /**
     *
     * @param $var
     * @returns {boolean}
     */
    _isset($var) {
      return typeof $var !== 'undefined' && $var !== null;
    },

    /**
     *
     * @param $var
     * @returns {boolean}
     */
    _isNotEmptyOrWhiteSpace($var) {
      return this._isset($var) && $var.toString().trim() !== '';
    },

    /**
     * Chiamata backend
     * @private
     */
    _getList() {
      this.noData = false;
      let headers = {
        Accept: 'application/json',
        'Access-Control-Allow-Origin': '*', // cors
        'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS', // cors
        'Content-Type': 'application/json',
        Authorization: window.sessionStorage.getItem('trusted')
      };

      let data = this.postParameters;

      if (!this.useOnlyPostParameters) {
        Object.assign(data, {
          name: this.searchValue,
          page: this.pagination.page,
          pageSize: this.pagination.pageSize,
          filter: this._isNotEmptyOrWhiteSpace(this.filter) ? JSON.stringify(this.filter) : null
        });
      }

      return new Promise((resolve, reject) => {
        this.isLoading = true;
        if (typeof this.url === 'undefined' || this.url === null) {
          reject();
        }

        Axios({
          url: this.url,
          method: 'POST',
          mode: 'no-cors', // cors
          headers,
          withCredentials: true,
          credentials: 'same-origin', // cache: 'default',
          data: data
        })
            .then(response => {
              if (typeof response.data.invalidJwt === 'undefined') {
                this.$emit('response', response.data);
                if (this._isArrayNotEmpty(response.data.message)) {
                  this._mapResponse(response.data.message);
                } else {
                  this.noData = true;
                }
                this.pagination.page++;
                this.totalRows = response.data.totalRows;
                this._openMenu();
                resolve(response.data);
              } else {
                this.$emit(EVENTS.INVALIDJWT);
                reject();
              }
            })
            .catch(e => {
              this.$emit(EVENTS.ERROR);
              reject(e);
            })
            .finally(() => {
              setTimeout(() => {
                this.isSearching = false;
                this.isLoading = false;
              }, 1000);
            });
      });

    },
    /**
     *
     * @param $var
     * @returns {boolean}
     */
    _isArrayNotEmpty($var) {
      return Array.isArray($var) && $var.length > 0;
    },
    _mapResponse(newItems) {
      for (const tempItem of newItems) {
        const item = JSON.parse(JSON.stringify(tempItem));
        if (Object.keys(this.labels).length > 0) {

          if (item[this.itemText]) {
            item[this.itemText] = this.labels[item[this.itemText]];

          }
        }

        item.jvxSelected = this.model.findIndex(m => m[this.itemValue] === item[this.itemValue]) !== -1;
        this.selectableItems.push(item);
      }
    },

    _openMenu() {
      this.isOpen = true;
    },

    open() {
      this._onActivatorClick({open: true});
    },

    close() {
      this._onActivatorClick({open: false});
    },

    _onActivatorClick({open = null}) {
      if (typeof open !== 'undefined' && open !== null) {
        if (open === true) {
          if (!this.options || this.options.length === 0) {
            this.pagination.page = 1;
            this.selectableItems = [];
            this._getList();
          } else {
            this._openMenu();
          }
        } else {
          this.isOpen = false;
        }
      } else {
        if (!this.isOpen && !this.isLoading) {
          if (!this.options || this.options.length === 0) {
            this.pagination.page = 1;
            this.selectableItems = [];
            this._getList();
          } else {
            this._openMenu();
          }
        } else {
          this.isOpen = false;
        }
      }

    },

    _infiniteScroll(event) {
      if (this.isLoading) {
        event.preventDefault();
        event.stopPropagation();
      } else if (event.target.scrollHeight - event.target.scrollTop - event.target.clientHeight < 1) {
        if (this.selectableItems.length < this.totalRows) {
          this._getList();
        }
        /**
         * ScrollEnd event.
         *
         * @type {object}
         */
        this.$emit(EVENTS.SCROLLEND);
      }
    },

    /**
     * emette l'evento "adv:clean" per la pulizia della ricerca avanzata
     *
     * @private
     */
    _handleAdvancedSearchClean() {
      this.$emit('adv:clean');
    },

  }
};

export const EVENTS = {
  INVALIDJWT: 'JVXEVENTS:INVALIDJWT',
  ERROR: 'JVXEVENTS:ERROR',
  SCROLLEND: 'JVXEVENTS:SCROLLEND'
};
</script>

<style lang="scss"
       scoped>
.jvx-multiselect {

  padding-top: 12px;
  margin-top: 4px;
  position: relative;
  color: var(--v-text-darken2);

  .input-container {
    min-height: 32px;
    position: relative;
    -webkit-transition: 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
    -moz-transition: 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
    -ms-transition: 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
    -o-transition: 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
    transition: 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);

    &::before,
    &::after {
      bottom: -1px;
      content: "";
      left: 0;
      position: absolute;
      transition: 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
      width: 100%;
    }

    &::before {
      border-color: rgba(0, 0, 0, 0.42);
      border-style: solid;
      border-width: thin 0 0;
    }

    &::after {
      transform: scaleX(0);
      border-style: solid;
      border-width: thin 0;
    }

    label {
      position: absolute !important;
      -webkit-transition: all 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
      -moz-transition: all 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
      -ms-transition: all 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
      -o-transition: all 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
      line-height: 2.3;
      color: currentColor;
    }

    .input-container__arrow > * {
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
    }

    &.selection-active, &.menu-is-open {
      label {
        transform: translateY(-18px) scale(0.75) translateX(-6px);
        transform-origin: 20px;
        display: inline;
        line-height: 21px;
        color: var(--v-primary-base);
      }
    }

    .input-container__selected-container {
      display: flex;
      width: 100%;
      position: relative;
      left: 0;
      top: 0;
      min-height: 32px;


      .input-container__selected {
        color: var(--v-text-base);
        flex: 1 1 100%;
        left: 0;
        min-height: 100%;
        display: flex;
        align-items: center;
        max-height: 100%;
        flex-wrap: wrap;

        .input__item {
          opacity: 1;
        }
      }

      .input-container__arrow {
        width: 24px;
        height: 100%;
        display: flex;
        align-self: center;
        align-items: center;
        transition: 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);

        .lds-ring {
          display: inline-block;
          position: relative;
          width: 24px;
          height: 24px;

          div {
            box-sizing: border-box;
            display: block;
            position: absolute;
            width: 16px;
            height: 16px;
            margin: 4px;
            border: 2px solid var(--v-primary-base);
            border-radius: 50%;
            animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
            border-color: var(--v-primary-base) transparent transparent transparent;

            &:nth-child(1) {
              animation-delay: -0.45s;
            }

            &:nth-child(2) {
              animation-delay: -0.3s;
            }

            &:nth-child(3) {
              animation-delay: -0.15s;
            }
          }

        }
      }
    }
  }

  &.jvx-multiselect-error {
    color: var(--v-warning-base);
  }

  &.jvx-multiselect-isFocused {
    color: var(--v-primary-base);

    .input-container {
      &::after {
        transform: scaleX(1);
      }
    }
  }

  &.jvx-multiselect-isOpen {
    .input-container__arrow {
      transform: rotate(180deg);
    }
  }

  &.jvx-multiselect-has-state {
    .input-container {
      &::before {
        border-color: currentColor;
      }

      label,
      .input-container__arrow > * {
        color: currentColor;
      }
    }
  }

  &:not(.jvx-multiselect-has-state) {
    .input-container:hover {
      &::before {
        border-color: rgba(0, 0, 0, 0.87);
      }
    }
  }

  &.jvx-multiselect-disabled {
    pointer-events: none;
    color: rgba(0, 0, 0, 0.42);

    .input-container {
      &::before {
        border-image: repeating-linear-gradient(
                90deg,
                rgba(0, 0, 0, 0.38) 0,
                rgba(0, 0, 0, 0.38) 2px,
                transparent 0,
                transparent 4px
        ) 1 repeat;
      }
    }
  }
}

$contentHeight: 205px;

.menu-container {
  background-color: var(--v-background-base);
  max-height: 300px;
  display: flex;
  flex-direction: column;

  &:not(has-footer) {
    $contentHeight: $contentHeight + 40;
  }

  &:not(has-search-bar) {
    $contentHeight: $contentHeight + 48;
  }

  .menu-content {
    max-height: $contentHeight;
    overflow: auto;
    // height: $contentHeight;
    // flex: 1 1 auto;
    // overflow: auto;

    &.menu-content-prevent-scroll {
      overflow: hidden;
    }
  }

  .menu-footer {
    height: 40px;
    display: flex;
    justify-content: space-between;
    width: 100%;
    padding: 0 10px;

    .menu-footer__info {
      flex: 1 1 auto;
      display: flex;
      align-items: center;
      font-size: 14px;
    }

    .menu-footer__buttons-container {
      height: 100%;
      display: inline-block;
      flex: 1 1 auto;

      .buttons {
        display: flex;
        height: 100%;
        align-items: center;
        justify-content: flex-end;
        width: 100%;
      }
    }
  }
}

.hidden-input {
  padding: 0;
  margin: 7px 0 0 0;

  ::v-deep .v-input__slot {
    display: none;
  }
}

@keyframes lds-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

::v-deep .v-input__append-inner {
  margin-left: -32px !important;
}

.SearchButton__clean-btn {
  top: -4px;
}

.SearchButton__clean {
  cursor: pointer;
  position: absolute;
  top: 4px;
  right: 0px;
  border-radius: 50%;
  padding: 2px;
  height: 20px;
  width: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}
/*# sourceMappingURL=vuetify.css.map*/
</style>
