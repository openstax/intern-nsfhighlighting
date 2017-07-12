(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require('../util/dom'),
    findRefs = _require.findRefs;

/*
 * @typedef {Object} ControllerOptions
 * @property {Function} [reload] - A function that replaces the content of
 *           the current element with new markup (eg. returned by an XHR request
 *           to the server) and returns the new root Element.
 */

/**
 * Base class for controllers that upgrade elements with additional
 * functionality.
 *
 * - Child elements with `data-ref="$name"` attributes are exposed on the
 *   controller as `this.refs.$name`.
 * - The element passed to the controller is exposed via the `element` property
 * - The controllers attached to an element are accessible via the
 *   `element.controllers` array
 *
 * The controller maintains internal state in `this.state`, which can only be
 * updated by calling (`this.setState(changes)`). Whenever the internal state of
 * the controller changes, `this.update()` is called to sync the DOM with this
 * state.
 */


var Controller = function () {
  /**
   * Initialize the controller.
   *
   * @param {Element} element - The DOM Element to upgrade
   * @param {ControllerOptions} [options] - Configuration options for the
   *        controller. Subclasses extend this interface to provide config
   *        specific to that type of controller.
   */
  function Controller(element) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Controller);

    if (!element) {
      throw new Error('Controllers require an element passed to the constructor');
    } else if (!element.controllers) {
      element.controllers = [this];
    } else {
      element.controllers.push(this);
    }

    this.state = {};
    this.element = element;
    this.options = options;
    this.refs = findRefs(element);
  }

  /**
   * Set the state of the controller.
   *
   * This will merge `changes` into the current state and call the `update()`
   * method provided by the subclass to update the DOM to match the current state.
   */


  _createClass(Controller, [{
    key: 'setState',
    value: function setState(changes) {
      var prevState = this.state;
      this.state = Object.freeze(Object.assign({}, this.state, changes));
      this.update(this.state, prevState);
    }

    /**
     * Calls update() with the current state.
     *
     * This is useful for controllers where the state is available in the DOM
     * itself, so doesn't need to be maintained internally.
     */

  }, {
    key: 'forceUpdate',
    value: function forceUpdate() {
      this.update(this.state, this.state);
    }

    /**
     * Listen for events dispatched to the root element passed to the controller.
     *
     * This a convenience wrapper around `this.element.addEventListener`.
     */

  }, {
    key: 'on',
    value: function on(event, listener, useCapture) {
      this.element.addEventListener(event, listener, useCapture);
    }

    /**
     * Handler which is invoked when the controller's element is about to be
     * removed.
     *
     * This can be used to clean up subscriptions, timeouts etc.
     */

  }, {
    key: 'beforeRemove',
    value: function beforeRemove() {}
  }]);

  return Controller;
}();

module.exports = Controller;

},{"../util/dom":22}],2:[function(require,module,exports){
'use strict';

/**
 * This module configures Raven for reporting crashes
 * to Sentry.
 *
 * Logging requires the Sentry DSN and Hypothesis
 * version to be provided via the app's settings object.
 */

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

require('core-js/fn/object/assign');

var Raven = require('raven-js');

function init(config) {
  Raven.config(config.dsn, {
    release: config.release
  }).install();

  if (config.userid) {
    Raven.setUserContext({ id: config.userid });
  }

  installUnhandledPromiseErrorHandler();
}

/**
 * Report an error to Sentry.
 *
 * @param {Error} error - An error object describing what went wrong
 * @param {string} when - A string describing the context in which
 *                        the error occurred.
 * @param {Object} [context] - A JSON-serializable object containing additional
 *                             information which may be useful when
 *                             investigating the error.
 */
function report(error, when, context) {
  if (!(error instanceof Error)) {
    // If the passed object is not an Error, raven-js
    // will serialize it using toString() which produces unhelpful results
    // for objects that do not provide their own toString() implementations.
    //
    // If the error is a plain object or non-Error subclass with a message
    // property, such as errors returned by chrome.extension.lastError,
    // use that instead.
    if ((typeof error === 'undefined' ? 'undefined' : _typeof(error)) === 'object' && error.message) {
      error = error.message;
    }
  }

  var extra = Object.assign({ when: when }, context);
  Raven.captureException(error, { extra: extra });
}

/**
 * Installs a handler to catch unhandled rejected promises.
 *
 * For this to work, the browser or the Promise polyfill must support
 * the unhandled promise rejection event (Chrome >= 49). On other browsers,
 * the rejections will simply go unnoticed. Therefore, app code _should_
 * always provide a .catch() handler on the top-most promise chain.
 *
 * See https://github.com/getsentry/raven-js/issues/424
 * and https://www.chromestatus.com/feature/4805872211460096
 *
 * It is possible that future versions of Raven JS may handle these events
 * automatically, in which case this code can simply be removed.
 */
function installUnhandledPromiseErrorHandler() {
  window.addEventListener('unhandledrejection', function (event) {
    if (event.reason) {
      report(event.reason, 'Unhandled Promise rejection');
    }
  });
}

module.exports = {
  init: init,
  report: report
};

},{"core-js/fn/object/assign":33,"raven-js":"raven-js"}],3:[function(require,module,exports){
'use strict';

require('core-js/fn/object/assign');

/**
 * Return application configuration information from the host page.
 *
 * Exposes shared application settings, read from script tags with the
 * class `settingsClass` which contain JSON content.
 *
 * If there are multiple such tags, the configuration from each is merged.
 *
 * @param {Document|Element} document - The root element to search for
 *                                      <script> settings tags.
 * @param {string} settingsClass - The class name to match on <script> tags.
 */
function settings(document, settingsClass) {
  if (!settingsClass) {
    settingsClass = 'js-hypothesis-settings';
  }
  var settingsElements = document.querySelectorAll('script.' + settingsClass);

  var config = {};
  for (var i = 0; i < settingsElements.length; i++) {
    Object.assign(config, JSON.parse(settingsElements[i].textContent));
  }
  return config;
}

module.exports = settings;

},{"core-js/fn/object/assign":33}],4:[function(require,module,exports){
'use strict';

/**
 * Mark an element as having been upgraded.
 */

function markReady(element) {
  var HIDE_CLASS = 'is-hidden-when-loading';
  var hideOnLoad = Array.from(element.querySelectorAll('.' + HIDE_CLASS));
  hideOnLoad.forEach(function (el) {
    el.classList.remove(HIDE_CLASS);
  });
  element.classList.remove(HIDE_CLASS);
}

// List of all elements which have had upgrades applied
var upgradedElements = [];

/**
 * Remove all of the controllers for elements under `root`.
 *
 * This clears the `controllers` list for all elements under `root` and notifies
 * the controllers that their root element is about to be removed from the
 * document.
 */
function removeControllers(root) {
  upgradedElements = upgradedElements.filter(function (el) {
    if (root.contains(el)) {
      el.controllers.forEach(function (ctrl) {
        return ctrl.beforeRemove();
      });
      el.controllers = [];
      return false;
    } else {
      return true;
    }
  });
}

/**
 * Upgrade elements on the page with additional functionality
 *
 * Controllers attached to upgraded elements are accessible via the `controllers`
 * property on the element.
 *
 * @param {Element} root - The root element to search for matching elements
 * @param {Object} controllers - Object mapping selectors to controller classes.
 *        For each element matching a given selector, an instance of the
 *        controller class will be constructed and passed the element in
 *        order to upgrade it.
 */
function upgradeElements(root, controllers) {
  // A helper which replaces the content (including the root element) of
  // an upgraded element with new markup and re-applies element upgrades to
  // the new root element
  function reload(element, html) {
    removeControllers(element);

    if (typeof html !== 'string') {
      throw new Error('Replacement markup must be a string');
    }
    var container = document.createElement('div');
    container.innerHTML = html;
    upgradeElements(container, controllers);

    var newElement = container.children[0];
    element.parentElement.replaceChild(newElement, element);
    return newElement;
  }

  Object.keys(controllers).forEach(function (selector) {
    var elements = Array.from(root.querySelectorAll(selector));
    elements.forEach(function (el) {
      var ControllerClass = controllers[selector];
      try {
        new ControllerClass(el, {
          reload: reload.bind(null, el)
        });
        upgradedElements.push(el);
        markReady(el);
      } catch (err) {
        console.error('Failed to upgrade element %s with controller', el, ControllerClass, ':', err.toString());

        // Re-raise error so that Raven can capture and report it
        throw err;
      }
    });
  });
}

module.exports = upgradeElements;

},{}],5:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Controller = require('../base/controller');
var setElementState = require('../util/dom').setElementState;
var updateHelper = require('../util/update-helpers.js');

var ENTER = 13;
var UP = 38;
var DOWN = 40;

/**
 * Controller for adding autosuggest control to a piece of the page
 */

var AutosuggestDropdownController = function (_Controller) {
  _inherits(AutosuggestDropdownController, _Controller);

  /*
   * @typedef {Object} ConfigOptions
   * @property {Function} renderListItem - called with every item in the list
   *   after the listFilter function is called. The return value will be the final
   *   html that is set in the list item DOM.
   * @property {Function} listFilter - called at initialization, focus of input,
   *   and input changes made by user. The function will receieve the full list
   *   and the current value of the input. This is meant to be an pure function
   *   that will return a filtered list based on the consumer's domain needs.
   * @property {Function} onSelect - called once the user has made a selection of an
   *   item in the autosuggest. It will receive the item selected as the only argument.
   * @property {Object} [classNames] - this is the enumerated list of class name
   *   overrides for consumers to customize the UI.
   *   Possible values: { container, list, item, activeItem, header }
   * @property {String} [header] - value of the header label at top of suggestions
   */

  /**
   * @param {HTMLInputElement} inputElement that we are responding to in order to provide
   *    suggestions. Note, we will add the suggestion container as a sibling to this
   *    element.
   * @param {ConfigOptions} configOptions are used to set the initial set of items and the header
   *    as well as providing the hooks for updates and callbacks
   *
   */
  function AutosuggestDropdownController(inputElement, configOptions) {
    _classCallCheck(this, AutosuggestDropdownController);

    var _this = _possibleConstructorReturn(this, (AutosuggestDropdownController.__proto__ || Object.getPrototypeOf(AutosuggestDropdownController)).call(this, inputElement, configOptions));

    if (!configOptions.renderListItem) {
      throw new Error('Missing renderListItem callback in AutosuggestDropdownController constructor');
    }

    if (!configOptions.listFilter) {
      throw new Error('Missing listFilter function in AutosuggestDropdownController constructor');
    }

    if (!configOptions.onSelect) {
      throw new Error('Missing onSelect callback in AutosuggestDropdownController constructor');
    }

    // set up our element class attribute enum values
    // Note, we currently are not doing anything with the default
    // classes, but we have them if we wanted to give something for a default
    // styling.
    if (configOptions.classNames) {
      _this.options.classNames.container = configOptions.classNames.container || 'autosuggest__container';
      _this.options.classNames.list = configOptions.classNames.list || 'autosuggest__list';
      _this.options.classNames.item = configOptions.classNames.item || 'autosuggest__list-item';
      _this.options.classNames.activeItem = configOptions.classNames.activeItem || 'autosuggest__list-item--active';
      _this.options.classNames.header = configOptions.classNames.header || 'autosuggest__header';
    }

    // renaming simply to make it more obvious what
    // the element is in other contexts of the controller
    _this._input = _this.element;

    // initial state values
    _this.setState({
      visible: false,
      header: configOptions.header || '',

      // working list that are displayed to use
      list: [],

      // rootList is the original set that the filter
      // will receive to determine what should be shown
      rootList: []
    });

    _this._setList(configOptions.list);

    // Public API
    _this.setHeader = _this._setHeader;
    return _this;
  }

  _createClass(AutosuggestDropdownController, [{
    key: 'update',
    value: function update(newState, prevState) {

      // if our prev state is empty then
      // we assume that this is the first update/render call
      if (!('visible' in prevState)) {

        // create the elements that make up the component
        this._renderContentContainers();
        this._addTopLevelEventListeners();
      }

      if (newState.visible !== prevState.visible) {
        // updates the dom to change the class which actually updates visibilty
        setElementState(this._suggestionContainer, { open: newState.visible });
      }

      if (newState.header !== prevState.header) {
        this._header.innerHTML = newState.header;
      }

      var listChanged = updateHelper.listIsDifferent(newState.list, prevState.list);

      if (listChanged) {
        this._renderListItems();
      }

      // list change detection is needed to persist the
      // currently active elements over to the new list
      if (newState.activeId !== prevState.activeId || listChanged) {

        var currentActive = this._getActiveListItemElement();

        if (prevState.activeId && currentActive) {
          currentActive.classList.remove(this.options.classNames.activeItem);
        }

        if (newState.activeId && newState.list.find(function (item) {
          return item.__suggestionId === newState.activeId;
        })) {
          this._listContainer.querySelector('[data-suggestion-id="' + newState.activeId + '"]').classList.add(this.options.classNames.activeItem);
        }
      }
    }

    /**
     * sets what would be the top header html
     *  to give context of what the suggestions are for
     *
     * @param  {string} header Html to place in header. You can pass plain text
     *  as well.
     */

  }, {
    key: '_setHeader',
    value: function _setHeader(header) {
      this.setState({
        header: header
      });
    }

    /**
     * update the current list
     *
     * @param  {Array} list The new list.
     */

  }, {
    key: '_setList',
    value: function _setList(list) {

      if (!Array.isArray(list)) {
        throw new TypeError('setList requires an array first argument');
      }

      this.setState({
        rootList: list.map(function (item) {
          return Object.assign({}, item, {
            // create an id that lets us direction map
            // selection to arbitrary item in list.
            // This allows lists to pass more than just the required
            // `name` property to know more about what the list item is
            __suggestionId: Math.random().toString(36).substr(2, 5)
          });
        })
      });

      this._filterListFromInput();
    }

    /**
     * we will run the consumer's filter function
     *  that is expected to be a pure function that will receive the
     *  root list (the initial list or list made with setList) and
     *  the input's current value. that function will return the array items,
     *  filtered and sorted, that will be set the new working list state and
     *  be rerendered.
     */

  }, {
    key: '_filterListFromInput',
    value: function _filterListFromInput() {
      this.setState({
        list: this.options.listFilter(this.state.rootList, this._input.value) || []
      });
    }

    /**
     * hit the consumers filter function to determine
     *   if we still have list items that need to be shown to the user.
     */

  }, {
    key: '_filterAndToggleVisibility',
    value: function _filterAndToggleVisibility() {
      this._filterListFromInput();

      this._toggleSuggestionsVisibility( /*show*/this.state.list.length > 0);
    }

    /**
     * lookup the active element, get item from
     *  object from list that was passed in, and invoke the onSelect callback.
     *  This is process to actually make a selection
     */

  }, {
    key: '_selectCurrentActiveItem',
    value: function _selectCurrentActiveItem() {

      var currentActive = this._getActiveListItemElement();
      var suggestionId = currentActive && currentActive.getAttribute('data-suggestion-id');
      var selection = this.state.list.filter(function (item) {
        return item.__suggestionId === suggestionId;
      })[0];

      if (selection) {
        this.options.onSelect(selection);
        this._filterAndToggleVisibility();
        this.setState({
          activeId: null
        });
      }
    }

    /**
     * update the list item dom elements with
     *  their "active" state when the user is hovering.
     *
     * @param  {bool} hovering are we hovering on the current element
     * @param  {Event} event    event used to pull the list item being targeted
     */

  }, {
    key: '_toggleItemHoverState',
    value: function _toggleItemHoverState(hovering, event) {

      var currentActive = this._getActiveListItemElement();
      var target = event.currentTarget;

      if (hovering && currentActive && currentActive.contains(target)) {
        return;
      }

      this.setState({
        activeId: hovering ? target.getAttribute('data-suggestion-id') : null
      });
    }

    /**
     * this function piggy backs on the setElementState
     *  style of defining element state in its class. Used in combination with the
     *  this.options.classNames.container the consumer has easy access to what the visibility state
     *  of the container is.
     *
     * @param  {bool} show should we update the state to be visible or not
     */

  }, {
    key: '_toggleSuggestionsVisibility',
    value: function _toggleSuggestionsVisibility(show) {

      // keeps the internal state synced with visibility
      this.setState({
        visible: !!show
      });
    }

    /**
     * @returns {HTMLElement}  the active list item element
     */

  }, {
    key: '_getActiveListItemElement',
    value: function _getActiveListItemElement() {
      return this._listContainer.querySelector('.' + this.options.classNames.activeItem);
    }

    /**
     * navigate the list, toggling the active item,
     *  based on the users arrow directions
     *
     * @param  {bool} down is the user navigating down the list?
     */

  }, {
    key: '_keyboardSelectionChange',
    value: function _keyboardSelectionChange(down) {

      var currentActive = this._getActiveListItemElement();
      var nextActive = void 0;

      // we have a starting point, navigate on siblings of current
      if (currentActive) {

        if (down) {
          nextActive = currentActive.nextSibling;
        } else {
          nextActive = currentActive.previousSibling;
        }

        // we have no starting point, let's navigate based on
        // the directional expectation of what the first item would be
      } else if (down) {
        nextActive = this._listContainer.firstChild;
      } else {
        nextActive = this._listContainer.lastChild;
      }

      this.setState({
        activeId: nextActive ? nextActive.getAttribute('data-suggestion-id') : null
      });
    }

    /**
     * build the DOM structure that makes up
     *  the suggestion box and content containers.
     */

  }, {
    key: '_renderContentContainers',
    value: function _renderContentContainers() {

      // container of all suggestion elements
      this._suggestionContainer = document.createElement('div');
      this._suggestionContainer.classList.add(this.options.classNames.container);

      // child elements that will be populated by consumer
      this._header = document.createElement('h4');
      this._header.classList.add(this.options.classNames.header);
      this._setHeader(this.state.header);
      this._suggestionContainer.appendChild(this._header);

      this._listContainer = document.createElement('ul');
      this._listContainer.setAttribute('role', 'listbox');
      this._listContainer.classList.add(this.options.classNames.list);
      this._suggestionContainer.appendChild(this._listContainer);

      // put the suggestions adjacent to the input element
      // firefox does not support insertAdjacentElement
      if (HTMLElement.prototype.insertAdjacentElement) {
        this._input.insertAdjacentElement('afterend', this._suggestionContainer);
      } else {
        this._input.parentNode.insertBefore(this._suggestionContainer, this._input.nextSibling);
      }
    }

    /**
     * updates the content of the list container and builds
     *  the new set of list items.
     */

  }, {
    key: '_renderListItems',
    value: function _renderListItems() {
      var _this2 = this;

      // Create the new list items, render their contents
      // and update the dom with the new elements.

      this._listContainer.innerHTML = '';

      this.state.list.forEach(function (listItem) {
        var li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.classList.add(_this2.options.classNames.item);
        li.setAttribute('data-suggestion-id', listItem.__suggestionId);

        // this should use some sort of event delegation if
        // we find we want to expand this to lists with *a lot* of items in it
        // But for now this binding has no real affect on small list perf
        li.addEventListener('mouseenter', _this2._toggleItemHoverState.bind(_this2, /*hovering*/true));
        li.addEventListener('mouseleave', _this2._toggleItemHoverState.bind(_this2, /*hovering*/false));
        li.addEventListener('mousedown', function (event) {
          // for situations like mobile, hovering might not be
          // the first event to set the active state for an element
          // so we will mimic that on mouse down and let selection happen
          // at the top level event
          _this2._toggleItemHoverState( /*hovering*/true, event);
          _this2._selectCurrentActiveItem();
        });

        li.innerHTML = _this2.options.renderListItem(listItem);

        _this2._listContainer.appendChild(li);
      });
    }

    /**
     * The events that can be set on a "global" or top
     *  level scope, we are going to set them here.
     */

  }, {
    key: '_addTopLevelEventListeners',
    value: function _addTopLevelEventListeners() {
      var _this3 = this;

      // we need to use mousedown instead of click
      // so we can beat the blur event which can
      // change visibility/target of the active event
      document.addEventListener('mousedown', function (event) {

        var target = event.target;

        // when clicking the input itself or if we are
        // or a global click was made while we were not visible
        // do nothing
        if (!_this3.state.visible || target === _this3._input) {
          return;
        }

        // see if inside interaction areas
        if (_this3._suggestionContainer.contains(target)) {

          event.preventDefault();
          event.stopPropagation();
        }

        // not in an interaction area, so we assume they
        // want it to go away.
        _this3._toggleSuggestionsVisibility( /*show*/false);
      });

      // Note, keydown needed here to properly prevent the default
      // nature of navigating keystrokes - like DOWN ARROW at the end of an
      // input takes the cursor to the beginning of the input value.
      this._input.addEventListener('keydown', function (event) {

        var key = event.keyCode;

        // only consume the ENTER event if
        // we have an active item
        if (key === ENTER && !_this3._getActiveListItemElement()) {
          return;
        }

        // these keys are going to be consumed and not propagated
        if ([ENTER, UP, DOWN].indexOf(key) > -1) {

          if (key === ENTER) {
            _this3._selectCurrentActiveItem();
          } else {
            _this3._keyboardSelectionChange( /*down*/key === DOWN);
          }

          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
        }

        // capture phase needed to beat any other listener that could
        // stop propagation after inspecting input value
      }, /*useCapturePhase*/true);

      this._input.addEventListener('keyup', function (event) {

        if ([ENTER, UP, DOWN].indexOf(event.keyCode) === -1) {
          _this3._filterAndToggleVisibility();
        }

        // capture phase needed to beat any other listener that could
        // stop propagation after inspecting input value
      }, /*useCapturePhase*/true);

      this._input.addEventListener('focus', function () {
        _this3._filterAndToggleVisibility();
      });

      this._input.addEventListener('blur', function () {
        _this3._toggleSuggestionsVisibility( /*show*/false);
      });
    }
  }]);

  return AutosuggestDropdownController;
}(Controller);

module.exports = AutosuggestDropdownController;

},{"../base/controller":1,"../util/dom":22,"../util/update-helpers.js":27}],6:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Controller = require('../base/controller');

var _require = require('../util/dom'),
    setElementState = _require.setElementState;

var CharacterLimitController = function (_Controller) {
  _inherits(CharacterLimitController, _Controller);

  function CharacterLimitController(element) {
    _classCallCheck(this, CharacterLimitController);

    var _this = _possibleConstructorReturn(this, (CharacterLimitController.__proto__ || Object.getPrototypeOf(CharacterLimitController)).call(this, element));

    _this.refs.characterLimitInput.addEventListener('input', function () {
      _this.forceUpdate();
    });
    _this.forceUpdate();
    return _this;
  }

  _createClass(CharacterLimitController, [{
    key: 'update',
    value: function update() {
      var input = this.refs.characterLimitInput;
      var maxlength = parseInt(input.dataset.maxlength);
      var counter = this.refs.characterLimitCounter;
      counter.textContent = input.value.length + '/' + maxlength;
      setElementState(counter, { tooLong: input.value.length > maxlength });
      setElementState(this.refs.characterLimitCounter, { ready: true });
    }
  }]);

  return CharacterLimitController;
}(Controller);

module.exports = CharacterLimitController;

},{"../base/controller":1,"../util/dom":22}],7:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Controller = require('../base/controller');

/* Turn a normal submit element into one that shows a confirm dialog.
 *
 * The element's form will only be submitted if the user answers the
 * confirmation dialog positively.
 *
 */

var ConfirmSubmitController = function (_Controller) {
  _inherits(ConfirmSubmitController, _Controller);

  function ConfirmSubmitController(element, options) {
    _classCallCheck(this, ConfirmSubmitController);

    var _this = _possibleConstructorReturn(this, (ConfirmSubmitController.__proto__ || Object.getPrototypeOf(ConfirmSubmitController)).call(this, element));

    var window_ = options.window || window;

    element.addEventListener('click', function (event) {
      if (!window_.confirm(element.dataset.confirmMessage)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return;
      }
    }, /*capture*/true);
    return _this;
  }

  return ConfirmSubmitController;
}(Controller);

module.exports = ConfirmSubmitController;

},{"../base/controller":1}],8:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Controller = require('../base/controller');

function isProbablyMobileSafari(userAgent) {
  return (/\bMobile\b/.test(userAgent) && /\bSafari\b/.test(userAgent)
  );
}

var CopyButtonController = function (_Controller) {
  _inherits(CopyButtonController, _Controller);

  function CopyButtonController(element) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, CopyButtonController);

    var _this = _possibleConstructorReturn(this, (CopyButtonController.__proto__ || Object.getPrototypeOf(CopyButtonController)).call(this, element, options));

    var userAgent = options.userAgent || navigator.userAgent;

    // Make the input field read-only to avoid the user accidentally modifying
    // the link before copying it.
    //
    // An exception is made for Mobile Safari because selecting the contents of
    // a read-only input field is hard in that browser.
    _this.refs.input.readOnly = !isProbablyMobileSafari(userAgent);

    _this.refs.button.onclick = function () {

      // Method for selecting <input> text taken from 'select' package.
      // See https://github.com/zenorocha/select/issues/1 and
      // http://stackoverflow.com/questions/3272089
      _this.refs.input.focus();
      _this.refs.input.setSelectionRange(0, _this.refs.input.value.length);

      var notificationText = document.execCommand('copy') ? 'Link copied to clipboard!' : 'Copying link failed';

      var NOTIFICATION_TEXT_TIMEOUT = 1000;
      var originalValue = _this.refs.input.value;
      _this.refs.input.value = notificationText;
      window.setTimeout(function () {
        _this.refs.input.value = originalValue;
        // Copying can leave the <input> focused but its value text not
        // selected, and since it's already focused clicking on it to focus
        // it doesn't trigger the auto select all on focus. So we unfocus it.
        _this.refs.input.blur();
      }, NOTIFICATION_TEXT_TIMEOUT);
    };
    return _this;
  }

  return CopyButtonController;
}(Controller);

module.exports = CopyButtonController;

},{"../base/controller":1}],9:[function(require,module,exports){
'use strict';

function CreateGroupFormController(element) {
  // Create Group form handling
  var self = this;
  this._submitBtn = element.querySelector('.js-create-group-create-btn');
  this._groupNameInput = element.querySelector('.js-group-name-input');
  this._infoLink = element.querySelector('.js-group-info-link');
  this._infoText = element.querySelector('.js-group-info-text');

  function groupNameChanged() {
    self._submitBtn.disabled = self._groupNameInput.value.trim().length === 0;
  }

  self._groupNameInput.addEventListener('input', groupNameChanged);
  groupNameChanged();

  this._infoLink.addEventListener('click', function (event) {
    event.preventDefault();
    self._infoLink.classList.add('is-hidden');
    self._infoText.classList.remove('is-hidden');
  });
}

module.exports = CreateGroupFormController;

},{}],10:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Controller = require('../base/controller');
var setElementState = require('../util/dom').setElementState;

/**
 * Controller for dropdown menus.
 */

var DropdownMenuController = function (_Controller) {
  _inherits(DropdownMenuController, _Controller);

  function DropdownMenuController(element) {
    _classCallCheck(this, DropdownMenuController);

    var _this = _possibleConstructorReturn(this, (DropdownMenuController.__proto__ || Object.getPrototypeOf(DropdownMenuController)).call(this, element));

    var toggleEl = _this.refs.dropdownMenuToggle;

    var handleClickOutside = function handleClickOutside(event) {
      if (!_this.refs.dropdownMenuContent.contains(event.target)) {
        // When clicking outside the menu on the toggle element, stop the event
        // so that it does not re-trigger the menu
        if (toggleEl.contains(event.target)) {
          event.stopPropagation();
          event.preventDefault();
        }

        _this.setState({ open: false });

        element.ownerDocument.removeEventListener('click', handleClickOutside, true /* capture */);
      }
    };

    toggleEl.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();

      _this.setState({ open: true });

      element.ownerDocument.addEventListener('click', handleClickOutside, true /* capture */);
    });
    return _this;
  }

  _createClass(DropdownMenuController, [{
    key: 'update',
    value: function update(state) {
      setElementState(this.refs.dropdownMenuContent, { open: state.open });
      this.refs.dropdownMenuToggle.setAttribute('aria-expanded', state.open.toString());
    }
  }]);

  return DropdownMenuController;
}(Controller);

module.exports = DropdownMenuController;

},{"../base/controller":1,"../util/dom":22}],11:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Controller = require('../base/controller');

var _require = require('../util/dom'),
    findRefs = _require.findRefs,
    setElementState = _require.setElementState;

var modalFocus = require('../util/modal-focus');
var submitForm = require('../util/submit-form');

function shouldAutosubmit(type) {
  var autosubmitTypes = ['checkbox', 'radio'];
  return autosubmitTypes.indexOf(type) !== -1;
}

/**
 * Return true if a form field should be hidden until the user starts editing
 * the form.
 *
 * @param {Element} el - The container for an individual form field, which may
 *        have a "data-hide-until-active" attribute.
 */
function isHiddenField(el) {
  return el.dataset.hideUntilActive;
}

/**
 * @typedef {Object} Field
 * @property {Element} container - The container element for an input field
 * @property {HTMLInputElement} input - The <input> element for an input field
 * @property {HTMLLabelElement} label - The <label> element for a field
 */

/**
 * A controller which adds inline editing functionality to forms.
 *
 * When forms have inline editing enabled, individual fields can be edited and
 * changes can be saved without a full page reload.
 *
 * Instead when the user focuses a field, Save/Cancel buttons are shown beneath
 * the field and everything else on the page is dimmed. When the user clicks 'Save'
 * the form is submitted to the server via a `fetch()` request and the HTML of
 * the form is updated with the result, which may be a successfully updated form
 * or a re-rendered version of the form with validation errors indicated.
 */

var FormController = function (_Controller) {
  _inherits(FormController, _Controller);

  function FormController(element, options) {
    _classCallCheck(this, FormController);

    var _this = _possibleConstructorReturn(this, (FormController.__proto__ || Object.getPrototypeOf(FormController)).call(this, element, options));

    setElementState(_this.refs.cancelBtn, { hidden: false });
    _this.refs.cancelBtn.addEventListener('click', function (event) {
      event.preventDefault();
      _this.cancel();
    });

    // List of groups of controls that constitute each form field
    _this._fields = Array.from(element.querySelectorAll('.js-form-input')).map(function (el) {
      var parts = findRefs(el);
      return {
        container: el,
        input: parts.formInput,
        label: parts.label
      };
    });

    _this.on('focus', function (event) {
      var field = _this._fields.find(function (field) {
        return field.input === event.target;
      });
      if (!field) {
        return;
      }

      _this.setState({
        editingFields: _this._editSet(field),
        focusedField: field
      });
    }, true /* capture - focus does not bubble */);

    _this.on('change', function (event) {
      if (shouldAutosubmit(event.target.type)) {
        _this.submit();
      }
    });

    _this.on('input', function (event) {
      // Some but not all browsers deliver an `input` event for radio/checkbox
      // inputs. Since we auto-submit when such inputs change, don't mark the
      // field as dirty.
      if (shouldAutosubmit(event.target.type)) {
        return;
      }
      _this.setState({ dirty: true });
    });

    _this.on('keydown', function (event) {
      event.stopPropagation();
      if (event.key === 'Escape') {
        _this.cancel();
      }
    });

    // Ignore clicks outside of the active field when editing
    _this.refs.formBackdrop.addEventListener('mousedown', function (event) {
      event.preventDefault();
      event.stopPropagation();
    });

    // Setup AJAX handling for forms
    _this.on('submit', function (event) {
      event.preventDefault();
      _this.submit();
    });

    _this.setState({
      // True if the user has made changes to the field they are currently
      // editing
      dirty: false,
      // The set of fields currently being edited
      editingFields: [],
      // The field within the `editingFields` set that was last focused
      focusedField: null,
      // Markup for the original form. Used to revert the form to its original
      // state when the user cancels editing
      originalForm: _this.element.outerHTML,
      // Flag that indicates a save is currently in progress
      saving: false,
      // Error that occurred while submitting the form
      submitError: ''
    });
    return _this;
  }

  _createClass(FormController, [{
    key: 'update',
    value: function update(state, prevState) {
      // In forms that support editing a single field at a time, show the
      // Save/Cancel buttons below the field that we are currently editing.
      //
      // In the current forms that support editing multiple fields at once,
      // we always display the Save/Cancel buttons in their default position
      if (state.editingFields.length === 1) {
        state.editingFields[0].container.parentElement.insertBefore(this.refs.formActions, state.editingFields[0].container.nextSibling);
      }

      if (state.editingFields.length > 0 && state.editingFields !== prevState.editingFields) {
        this._trapFocus();
      }

      var isEditing = state.editingFields.length > 0;
      setElementState(this.element, { editing: isEditing });
      setElementState(this.refs.formActions, {
        hidden: !isEditing || shouldAutosubmit(state.editingFields[0].input.type),
        saving: state.saving
      });

      setElementState(this.refs.formSubmitError, {
        visible: state.submitError.length > 0
      });
      this.refs.formSubmitErrorMessage.textContent = state.submitError;

      this._updateFields(state);
    }

    /**
     * Update the appearance of individual form fields to match the current state
     * of the form.
     *
     * @param {Object} state - The internal state of the form
     */

  }, {
    key: '_updateFields',
    value: function _updateFields(state) {
      this._fields.forEach(function (field) {
        setElementState(field.container, {
          editing: state.editingFields.includes(field),
          focused: field === state.focusedField,
          hidden: isHiddenField(field.container) && !state.editingFields.includes(field)
        });

        // Update labels
        var activeLabel = field.container.dataset.activeLabel;
        var inactiveLabel = field.container.dataset.inactiveLabel;
        var isEditing = state.editingFields.includes(field);

        if (activeLabel && inactiveLabel) {
          field.label.textContent = isEditing ? activeLabel : inactiveLabel;
        }

        // Update placeholder
        //
        // The UA may or may not autofill password fields.
        // Set a dummy password as a placeholder when the field is not being edited
        // so that it appears non-empty if the UA doesn't autofill it.
        if (field.input.type === 'password') {
          field.input.setAttribute('placeholder', !isEditing ? '••••••••' : '');
        }
      });
    }
  }, {
    key: 'beforeRemove',
    value: function beforeRemove() {
      if (this._releaseFocus) {
        this._releaseFocus();
      }
    }

    /**
     * Perform an AJAX submission of the form and replace it with the rendered
     * result.
     */

  }, {
    key: 'submit',
    value: function submit() {
      var _this2 = this;

      var originalForm = this.state.originalForm;

      var activeInputId = void 0;
      if (this.state.editingFields.length > 0) {
        activeInputId = this.state.editingFields[0].input.id;
      }

      this.setState({ saving: true });

      return submitForm(this.element).then(function (response) {
        _this2.options.reload(response.form);
      }).catch(function (err) {
        if (err.form) {
          // The server processed the request but rejected the submission.
          // Display the returned form which will contain any validation error
          // messages.
          var newFormEl = _this2.options.reload(err.form);
          var newFormCtrl = newFormEl.controllers.find(function (ctrl) {
            return ctrl instanceof FormController;
          });

          // Resume editing the field where validation failed
          var newInput = document.getElementById(activeInputId);
          if (newInput) {
            newInput.focus();
          }

          newFormCtrl.setState({
            // Mark the field in the replaced form as dirty since it has unsaved
            // changes
            dirty: newInput !== null,
            // If editing is canceled, revert back to the _original_ version of
            // the form, not the version with validation errors from the server.
            originalForm: originalForm
          });
        } else {
          // If there was an error processing the request or the server could
          // not be reached, display a helpful error
          _this2.setState({
            submitError: err.reason || 'There was a problem saving changes.',
            saving: false
          });
        }
      });
    }

    /**
     * Return the set of elements that the user should be able to interact with,
     * depending upon the field which is currently focused.
     */

  }, {
    key: '_focusGroup',
    value: function _focusGroup() {
      var fieldContainers = this.state.editingFields.map(function (field) {
        return field.container;
      });
      if (fieldContainers.length === 0) {
        return null;
      }

      return [this.refs.formActions].concat(fieldContainers);
    }

    /**
     * Trap focus within the set of form fields currently being edited.
     */

  }, {
    key: '_trapFocus',
    value: function _trapFocus() {
      var _this3 = this;

      this._releaseFocus = modalFocus.trap(this._focusGroup(), function (newFocusedElement) {
        // Keep focus in the current field when it has unsaved changes,
        // otherwise let the user focus another field in the form or move focus
        // outside the form entirely.
        if (_this3.state.dirty) {
          return _this3.state.editingFields[0].input;
        }

        // If the user tabs out of the form, clear the editing state
        if (!_this3.element.contains(newFocusedElement)) {
          _this3.setState({ editingFields: [] });
        }

        return null;
      });
    }

    /**
     * Return the set of fields that should be displayed in the editing state
     * when a given field is selected.
     *
     * @param {Field} - The field that was focused
     * @return {Field[]} - Set of fields that should be active for editing
     */

  }, {
    key: '_editSet',
    value: function _editSet(field) {
      // Currently we have two types of form:
      // 1. Forms which only edit one field at a time
      // 2. Forms with hidden fields (eg. the Change Email, Change Password forms)
      //    which should enable editing all fields when any is focused
      if (this._fields.some(function (field) {
        return isHiddenField(field.container);
      })) {
        return this._fields;
      } else {
        return [field];
      }
    }

    /**
     * Cancel editing for the currently active field and revert any unsaved
     * changes.
     */

  }, {
    key: 'cancel',
    value: function cancel() {
      this.options.reload(this.state.originalForm);
    }
  }]);

  return FormController;
}(Controller);

module.exports = FormController;

},{"../base/controller":1,"../util/dom":22,"../util/modal-focus":23,"../util/submit-form":26}],12:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Controller = require('../base/controller');

var FormSelectOnFocusController = function (_Controller) {
  _inherits(FormSelectOnFocusController, _Controller);

  function FormSelectOnFocusController(element) {
    _classCallCheck(this, FormSelectOnFocusController);

    // In case the `focus` event has already been fired, select the element
    var _this = _possibleConstructorReturn(this, (FormSelectOnFocusController.__proto__ || Object.getPrototypeOf(FormSelectOnFocusController)).call(this, element));

    if (element === document.activeElement) {
      element.select();
    }

    element.addEventListener('focus', function (event) {
      event.target.select();
    });
    return _this;
  }

  return FormSelectOnFocusController;
}(Controller);

module.exports = FormSelectOnFocusController;

},{"../base/controller":1}],13:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Controller = require('../base/controller');

function isWordChar(event) {
  return event.key.match(/^\w$/) && !event.ctrlKey && !event.altKey && !event.metaKey;
}

/**
 * Automatically focuses an input field when the user presses a letter, number
 * or backspace if no other element on the page has keyboard focus. The field's
 * focus can also be blurred by pressing Escape.
 *
 * This provides behavior similar to Google.com where the user can "type" in the
 * search box even if it is not focused.
 */

var InputAutofocusController = function (_Controller) {
  _inherits(InputAutofocusController, _Controller);

  function InputAutofocusController(element) {
    _classCallCheck(this, InputAutofocusController);

    var _this = _possibleConstructorReturn(this, (InputAutofocusController.__proto__ || Object.getPrototypeOf(InputAutofocusController)).call(this, element));

    _this._onKeyDown = function (event) {
      if (document.activeElement === document.body) {
        if (isWordChar(event) || event.key === 'Backspace') {
          element.focus();
        }
      } else if (document.activeElement === element && event.key === 'Escape') {
        element.blur();
      }
    };

    document.addEventListener('keydown', _this._onKeyDown);
    return _this;
  }

  _createClass(InputAutofocusController, [{
    key: 'beforeRemove',
    value: function beforeRemove() {
      document.removeEventListener('keydown', this._onKeyDown);
    }
  }]);

  return InputAutofocusController;
}(Controller);

module.exports = InputAutofocusController;

},{"../base/controller":1}],14:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Controller = require('../base/controller');
var searchTextParser = require('../util/search-text-parser');

var _require = require('../util/dom'),
    setElementState = _require.setElementState;

/**
 * A lozenge representing a single search term.
 *
 * A lozenge consists of two parts - the lozenge content and the 'x' button
 * which when clicked calls the `deleteCallback` handler passed in the
 * controller's options.
 *
 * const lozenge = new Lozenge(element, {
 *   content,
 *   deleteCallback,
 * });
 */


var LozengeController = function (_Controller) {
  _inherits(LozengeController, _Controller);

  function LozengeController(element, options) {
    _classCallCheck(this, LozengeController);

    // Work-around for HTMLFormElement#submit() failing in Firefox if a submit
    // button removes itself during click event handler.
    //
    // See https://bugzilla.mozilla.org/show_bug.cgi?id=494755#c4 and
    // https://bugzilla.mozilla.org/show_bug.cgi?id=586329
    var _this = _possibleConstructorReturn(this, (LozengeController.__proto__ || Object.getPrototypeOf(LozengeController)).call(this, element, options));

    _this.refs.deleteButton.type = 'button';

    var facetName = '';
    var facetValue = options.content;

    if (searchTextParser.hasKnownNamedQueryTerm(options.content)) {
      var queryTerm = searchTextParser.getLozengeFacetNameAndValue(options.content);
      facetName = queryTerm.facetName;
      facetValue = queryTerm.facetValue;
    }

    element.classList.add('js-lozenge');

    _this.refs.deleteButton.addEventListener('click', function (event) {
      event.preventDefault();
      options.deleteCallback();
    });

    _this.setState({
      facetName: facetName,
      facetValue: facetValue,
      disabled: false
    });
    return _this;
  }

  _createClass(LozengeController, [{
    key: 'update',
    value: function update(state) {
      setElementState(this.element, { disabled: state.disabled });
      var facetName = state.facetName;
      if (facetName) {
        facetName += ':';
      }
      this.refs.facetName.textContent = facetName;
      this.refs.facetValue.textContent = state.facetValue;
    }
  }, {
    key: 'inputValue',
    value: function inputValue() {
      if (this.state.facetName) {
        return this.state.facetName + ':' + this.state.facetValue;
      } else {
        return this.state.facetValue;
      }
    }
  }]);

  return LozengeController;
}(Controller);

module.exports = LozengeController;

},{"../base/controller":1,"../util/dom":22,"../util/search-text-parser":24}],15:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var escapeHtml = require('escape-html');

var Controller = require('../base/controller');
var LozengeController = require('./lozenge-controller');
var AutosuggestDropdownController = require('./autosuggest-dropdown-controller');
var SearchTextParser = require('../util/search-text-parser');

var _require = require('../util/dom'),
    cloneTemplate = _require.cloneTemplate;

var stringUtil = require('../util/string');

var FACET_TYPE = 'FACET';
var TAG_TYPE = 'TAG';
var GROUP_TYPE = 'GROUP';
var MAX_SUGGESTIONS = 5;

/**
 * Normalize a string for use in comparisons of user input with a suggestion.
 * This causes differences in unicode composition and combining characters/accents to be ignored.
 */
var normalizeStr = function normalizeStr(str) {
  return stringUtil.fold(stringUtil.normalize(str));
};

/**
 * Controller for the search bar.
 */

var SearchBarController = function (_Controller) {
  _inherits(SearchBarController, _Controller);

  function SearchBarController(element) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, SearchBarController);

    var _this = _possibleConstructorReturn(this, (SearchBarController.__proto__ || Object.getPrototypeOf(SearchBarController)).call(this, element, options));

    if (!options.lozengeTemplate) {
      options.lozengeTemplate = document.querySelector('#lozenge-template');
    }

    _this._input = _this.refs.searchBarInput;
    _this._lozengeContainer = _this.refs.searchBarLozenges;

    /**
     * the suggestionsMap pulls in the available lists - either
     *  static or dynamic living in the dom - into one mapping
     *  lists of all suggestion values.
     */
    _this._suggestionsMap = function () {

      var explanationList = [{
        matchOn: 'user',
        title: 'user:',
        explanation: 'search by username'
      }, {
        matchOn: 'tag',
        title: 'tag:',
        explanation: 'search for annotations with a tag'
      }, {
        matchOn: 'url',
        title: 'url:',
        explanation: 'see all annotations on a page'
      }, {
        matchOn: 'group',
        title: 'group:',
        explanation: 'show annotations created in a group you are a member of'
      }].map(function (item) {
        return Object.assign(item, { type: FACET_TYPE });
      });

      // tagSuggestions are made available by the scoped template data.
      // see search.html.jinja2 for definition
      var tagSuggestionJSON = document.querySelector('.js-tag-suggestions');
      var tagSuggestions = [];

      if (tagSuggestionJSON) {
        try {
          tagSuggestions = JSON.parse(tagSuggestionJSON.innerHTML.trim());
        } catch (e) {
          console.error('Could not parse .js-tag-suggestions JSON content', e);
        }
      }

      var tagsList = (tagSuggestions || []).map(function (item) {
        return Object.assign(item, {
          type: TAG_TYPE,
          title: item.tag, // make safe
          matchOn: normalizeStr(item.tag),
          usageCount: item.count || 0
        });
      });

      // groupSuggestions are made available by the scoped template data.
      // see search.html.jinja2 for definition
      var groupSuggestionJSON = document.querySelector('.js-group-suggestions');
      var groupSuggestions = [];

      if (groupSuggestionJSON) {
        try {
          groupSuggestions = JSON.parse(groupSuggestionJSON.innerHTML.trim());
        } catch (e) {
          console.error('Could not parse .js-group-suggestions JSON content', e);
        }
      }

      var groupsList = (groupSuggestions || []).map(function (item) {
        return Object.assign(item, {
          type: GROUP_TYPE,
          title: item.name, // make safe
          matchOn: normalizeStr(item.name),
          pubid: item.pubid,
          name: item.name
        });
      });

      return explanationList.concat(tagsList, groupsList);
    }();

    var getTrimmedInputValue = function getTrimmedInputValue() {
      return _this._input.value.trim();
    };

    /**
     * given a lozenge set for a group, like "group:value", match the value
     *  against our group suggestions list to find a match on either pubid
     *  or the group name. The result will be an object to identify what
     *  is the search input term to use and what value can be displayed
     *  to the user. If there is no match, the input and display will be
     *  the original input value.
     *
     *  @param {String} groupLoz - ex: "group:value"
     *  @returns {Object} represents the values to display and use for inputVal
     *    {
     *      display: {String}, // like group:"friendly name"
     *      input: {String}    // like group:pid1234
     *    }
     */
    var getInputAndDisplayValsForGroup = function getInputAndDisplayValsForGroup(groupLoz) {
      var groupVal = groupLoz.substr(groupLoz.indexOf(':') + 1).trim();
      var inputVal = groupVal.trim();
      var displayVal = groupVal;
      var wrapQuotesIfNeeded = function wrapQuotesIfNeeded(str) {
        return str.indexOf(' ') > -1 ? '"' + str + '"' : str;
      };

      // remove quotes from value
      if (groupVal[0] === '"' || groupVal[0] === '\'') {
        groupVal = groupVal.substr(1);
      }
      if (groupVal[groupVal.length - 1] === '"' || groupVal[groupVal.length - 1] === '\'') {
        groupVal = groupVal.slice(0, -1);
      }

      var matchVal = normalizeStr(groupVal).toLowerCase();

      // NOTE: We are pushing a pubid to lowercase here. These ids are created by us
      // in a random generation case-sensistive style. Theoretically, that means
      // casting to lower could cause overlaps of values like 'Abc' and 'aBC' - making
      // them equal to us. Since that is very unlikely to occur for one user's group
      // set, the convenience of being defensive about bad input/urls is more valuable
      // than the risk of overlap.
      var matchByPubid = _this._suggestionsMap.find(function (item) {
        return item.type === GROUP_TYPE && item.pubid.toLowerCase() === matchVal;
      });

      if (matchByPubid) {
        inputVal = matchByPubid.pubid;
        displayVal = wrapQuotesIfNeeded(matchByPubid.name);
      } else {
        var matchByName = _this._suggestionsMap.find(function (item) {
          return item.type === GROUP_TYPE && item.matchOn.toLowerCase() === matchVal;
        });
        if (matchByName) {
          inputVal = matchByName.pubid;
          displayVal = wrapQuotesIfNeeded(matchByName.name);
        }
      }

      return {
        input: 'group:' + inputVal,
        display: 'group:' + displayVal
      };
    };

    /**
     * Insert a hidden <input> with an empty value into the search <form>.
     *
     * The name="q" attribute is moved from the visible <input> on to the
     * hidden <input> so that when the <form> is submitted it's the value of
     * the _hidden_ input, not the visible one, that is submitted as the
     * q parameter.
     *
     */
    var insertHiddenInput = function insertHiddenInput() {
      var hiddenInput = document.createElement('input');
      hiddenInput.type = 'hidden';

      // When JavaScript isn't enabled this._input is submitted to the server
      // as the q param. With JavaScript we submit hiddenInput instead.
      hiddenInput.name = _this._input.name;
      _this._input.removeAttribute('name');

      _this.refs.searchBarForm.appendChild(hiddenInput);
      return hiddenInput;
    };

    /** Return the controllers for all of the displayed lozenges. */
    var lozenges = function lozenges() {
      var lozElements = Array.from(_this.element.querySelectorAll('.js-lozenge'));
      return lozElements.map(function (el) {
        return el.controllers[0];
      });
    };

    /**
     * Update the value of the hidden input.
     *
     * Update the value of the hidden input based on the contents of any
     * lozenges and any remaining text in the visible input.
     *
     * This should be called whenever a lozenge is added to or removed from
     * the DOM, and whenever the text in the visible input changes.
     *
     */
    var updateHiddenInput = function updateHiddenInput() {
      var newValue = '';
      lozenges().forEach(function (loz) {
        var inputValue = loz.inputValue();
        if (inputValue.indexOf('group:') === 0) {
          inputValue = getInputAndDisplayValsForGroup(inputValue).input;
        }
        newValue = newValue + inputValue + ' ';
      });
      _this._hiddenInput.value = (newValue + getTrimmedInputValue()).trim();
    };

    /**
     * Creates a lozenge and sets the content string to the
     * content provided and executes the delete callback when
     * the lozenge is deleted.
     *
     * @param {string} content The search term
     */
    var addLozenge = function addLozenge(content) {

      var lozengeEl = cloneTemplate(_this.options.lozengeTemplate);
      var currentLozenges = _this.element.querySelectorAll('.lozenge');
      if (currentLozenges.length > 0) {
        _this._lozengeContainer.insertBefore(lozengeEl, currentLozenges[currentLozenges.length - 1].nextSibling);
      } else {
        _this._lozengeContainer.insertBefore(lozengeEl, _this._lozengeContainer.firstChild);
      }

      var deleteCallback = function deleteCallback() {
        lozengeEl.remove();
        lozenges().forEach(function (ctrl) {
          return ctrl.setState({ disabled: true });
        });
        updateHiddenInput();
        _this.refs.searchBarForm.submit();
      };

      // groups have extra logic to show one value
      // but have their input/search value be different
      // make sure we grab the right value to display
      if (content.indexOf('group:') === 0) {
        content = getInputAndDisplayValsForGroup(content).display;
      }

      new LozengeController(lozengeEl, {
        content: content,
        deleteCallback: deleteCallback
      });
    };

    /**
     * Create lozenges for the search query terms already in the input field on
     * page load and update lozenges that are already in the lozenges container
     * so they are hooked up with the proper event handling
     */
    var lozengifyInput = function lozengifyInput() {
      var _SearchTextParser$get = SearchTextParser.getLozengeValues(_this._input.value),
          lozengeValues = _SearchTextParser$get.lozengeValues,
          incompleteInputValue = _SearchTextParser$get.incompleteInputValue;

      lozengeValues.forEach(addLozenge);
      _this._input.value = incompleteInputValue;
      _this._input.style.visibility = 'visible';
      updateHiddenInput();
    };

    var onInputKeyDown = function onInputKeyDown(event) {
      var SPACE_KEY_CODE = 32;

      if (event.keyCode === SPACE_KEY_CODE) {
        var word = getTrimmedInputValue();
        if (SearchTextParser.shouldLozengify(word)) {
          event.preventDefault();
          addLozenge(word);
          _this._input.value = '';
          updateHiddenInput();
        }
      }
    };

    _this._hiddenInput = insertHiddenInput(_this.refs.searchBarForm);

    _this._suggestionsHandler = new AutosuggestDropdownController(_this._input, {

      list: _this._suggestionsMap,

      header: 'Narrow your search:',

      classNames: {
        container: 'search-bar__dropdown-menu-container',
        header: 'search-bar__dropdown-menu-header',
        list: 'search-bar__dropdown-menu',
        item: 'search-bar__dropdown-menu-item',
        activeItem: 'js-search-bar-dropdown-menu-item--active'
      },

      renderListItem: function renderListItem(listItem) {

        var itemContents = '<span class="search-bar__dropdown-menu-title"> ' + escapeHtml(listItem.title) + ' </span>';

        if (listItem.explanation) {
          itemContents += '<span class="search-bar__dropdown-menu-explanation"> ' + listItem.explanation + ' </span>';
        }

        return itemContents;
      },

      listFilter: function listFilter(list, currentInput) {

        currentInput = (currentInput || '').trim();

        var typeFilter = FACET_TYPE;
        var inputLower = currentInput.toLowerCase();
        if (inputLower.indexOf('tag:') === 0) {
          typeFilter = TAG_TYPE;
        } else if (inputLower.indexOf('group:') === 0) {
          typeFilter = GROUP_TYPE;
        }

        var inputFilter = normalizeStr(currentInput);

        if (typeFilter === TAG_TYPE || typeFilter === GROUP_TYPE) {
          inputFilter = inputFilter.substr(inputFilter.indexOf(':') + 1);

          // remove the initial quote for comparisons if it exists
          if (inputFilter[0] === '\'' || inputFilter[0] === '"') {
            inputFilter = inputFilter.substr(1);
          }
        }

        if (_this.state.suggestionsType !== typeFilter) {
          _this.setState({
            suggestionsType: typeFilter
          });
        }

        return list.filter(function (item) {
          return item.type === typeFilter && item.matchOn.toLowerCase().indexOf(inputFilter.toLowerCase()) >= 0;
        }).sort(function (a, b) {

          // this sort functions intention is to
          // sort partial matches as lower index match
          // value first. Then let natural sort of the
          // original list take effect if they have equal
          // index values or there is no current input value

          if (inputFilter) {
            var aIndex = a.matchOn.indexOf(inputFilter);
            var bIndex = b.matchOn.indexOf(inputFilter);

            // match score
            if (aIndex > bIndex) {
              return 1;
            } else if (aIndex < bIndex) {
              return -1;
            }
          }

          // If we are filtering on tags, we need to arrange
          // by popularity
          if (typeFilter === TAG_TYPE) {
            if (a.usageCount > b.usageCount) {
              return -1;
            } else if (a.usageCount < b.usageCount) {
              return 1;
            }
          }

          return 0;
        }).slice(0, MAX_SUGGESTIONS);
      },

      onSelect: function onSelect(itemSelected) {

        if (itemSelected.type === TAG_TYPE || itemSelected.type === GROUP_TYPE) {
          var prefix = itemSelected.type === TAG_TYPE ? 'tag:' : 'group:';

          var valSelection = itemSelected.title;

          // wrap multi word phrases with quotes to keep
          // autosuggestions consistent with what user needs to do
          if (valSelection.indexOf(' ') > -1) {
            valSelection = '"' + valSelection + '"';
          }

          addLozenge(prefix + valSelection);

          _this._input.value = '';
        } else {
          _this._input.value = itemSelected.title;
          setTimeout(function () {
            _this._input.focus();
          }, 0);
        }
        updateHiddenInput();
      }

    });

    _this._input.addEventListener('keydown', onInputKeyDown);
    _this._input.addEventListener('input', updateHiddenInput);
    lozengifyInput();
    return _this;
  }

  _createClass(SearchBarController, [{
    key: 'update',
    value: function update(newState, prevState) {

      if (!this._suggestionsHandler) {
        return;
      }

      if (newState.suggestionsType !== prevState.suggestionsType) {
        if (newState.suggestionsType === TAG_TYPE) {
          this._suggestionsHandler.setHeader('Popular tags:');
        } else if (newState.suggestionsType === GROUP_TYPE) {
          this._suggestionsHandler.setHeader('Your groups:');
        } else {
          this._suggestionsHandler.setHeader('Narrow your search:');
        }
      }
    }
  }]);

  return SearchBarController;
}(Controller);

module.exports = SearchBarController;

},{"../base/controller":1,"../util/dom":22,"../util/search-text-parser":24,"../util/string":25,"./autosuggest-dropdown-controller":5,"./lozenge-controller":14,"escape-html":106}],16:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var scrollIntoView = require('scroll-into-view');

var Controller = require('../base/controller');
var setElementState = require('../util/dom').setElementState;

/**
 * @typedef Options
 * @property {EnvironmentFlags} [envFlags] - Environment flags. Provided as a
 *           test seam.
 * @property {Function} [scrollTo] - A function that scrolls a given element
 *           into view. Provided as a test seam.
 */

/**
 * Controller for buckets of results in the search result list
 */

var SearchBucketController = function (_Controller) {
  _inherits(SearchBucketController, _Controller);

  /**
   * @param {Element} element
   * @param {Options} options
   */
  function SearchBucketController(element, options) {
    _classCallCheck(this, SearchBucketController);

    var _this = _possibleConstructorReturn(this, (SearchBucketController.__proto__ || Object.getPrototypeOf(SearchBucketController)).call(this, element, options));

    _this.scrollTo = _this.options.scrollTo || scrollIntoView;

    _this.refs.header.addEventListener('click', function (event) {
      if (_this.refs.domainLink.contains(event.target)) {
        return;
      }
      _this.setState({ expanded: !_this.state.expanded });
    });

    _this.refs.title.addEventListener('click', function (event) {
      _this.setState({ expanded: !_this.state.expanded });
      event.stopPropagation();
    });

    _this.refs.collapseView.addEventListener('click', function () {
      _this.setState({ expanded: !_this.state.expanded });
    });

    var envFlags = _this.options.envFlags || window.envFlags;

    _this.setState({
      expanded: !!envFlags.get('js-timeout')
    });
    return _this;
  }

  _createClass(SearchBucketController, [{
    key: 'update',
    value: function update(state, prevState) {
      setElementState(this.refs.content, { expanded: state.expanded });
      setElementState(this.element, { expanded: state.expanded });

      this.refs.title.setAttribute('aria-expanded', state.expanded.toString());

      // Scroll to element when expanded, except on initial load
      if (typeof prevState.expanded !== 'undefined' && state.expanded) {
        this.scrollTo(this.element);
      }
    }
  }]);

  return SearchBucketController;
}(Controller);

module.exports = SearchBucketController;

},{"../base/controller":1,"../util/dom":22,"scroll-into-view":112}],17:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Controller = require('../base/controller');

var CONFIG_ATTR = 'share-widget-config';
var TRIGGER_SELECTOR = '[' + CONFIG_ATTR + ']';
var WIDGET_SELECTOR = '.js-share-widget-owner';
var TARGET_HREF_ATTR = 'share-target-href';
var TARGET_HREF_SELECTOR = '[' + TARGET_HREF_ATTR + ']';
var CLIPBOARD_INPUT_SELECTOR = '.js-share-widget-clipboard';
var PRIVATE_MSG_SELECTOR = '.js-share-widget-msg-private';
var GROUP_MSG_SELECTOR = '.js-share-widget-msg-group';

var ARROW_PADDING_RIGHT = 16;
var ARROW_PADDING_BOTTOM = 5;

var shareWidgetAttached = false;

var getOffset = function getOffset(el) {
  el = el.getBoundingClientRect();
  return {
    // adjust for top left of the document
    left: el.left + window.pageXOffset,
    top: el.top + window.pageYOffset,
    width: el.width,
    height: el.height
  };
};

var ShareWidget = function () {
  function ShareWidget(containerElement) {
    var _this = this;

    _classCallCheck(this, ShareWidget);

    // we only attach one to the dom since it's a global listener
    if (shareWidgetAttached) {
      return;
    }
    shareWidgetAttached = true;

    this._currentTrigger = null;
    this._container = containerElement;
    this._widget = this._container.querySelector(WIDGET_SELECTOR);
    this._widgetVisible = false;

    // on initialize we need to reset container visbility
    this.hide();

    this._handler = function (event) {

      var target = event.target;

      // do nothing if we are clicking inside of the widget
      if (_this._container.contains(target)) {
        return;
      }

      var trigger = target.closest(TRIGGER_SELECTOR);

      if (trigger) {

        var config = JSON.parse(trigger.getAttribute(CONFIG_ATTR));

        // if we click the same trigger twice we expect
        // to close the current trigger. Otherwise, we need
        // to move to the new trigger and open
        if (trigger === _this._currentTrigger && _this._widgetVisible) {
          _this.hide();
        } else {
          _this.showForNode(trigger, config);
        }

        if (trigger !== _this._currentTrigger) {
          _this._currentTrigger = trigger;
        }

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return;
      }

      // hide the widget if the click was not handled by
      // clicking on the triggers or widget itself
      if (_this._widgetVisible) {
        _this.hide();
      }
    };

    window.document.body.addEventListener('click', this._handler);
  }

  /**
   * @typedef {Object} ConfigOptions
   * @property {String} url - the url we are enabling to be shared
   * @property {Bool} [private] - is the card only visible to this user
   * @property {Bool} [group] - is the card posted in a group scope
   */

  /**
   * Update the template based on the config variables passed in
   *
   * @param  {ConfigOptions} config The details we need to apply update our template
   *   with the correct information per card.
   */


  _createClass(ShareWidget, [{
    key: '_renderWidgetTemplate',
    value: function _renderWidgetTemplate(config) {

      // copy to clipboard input
      this._widget.querySelector(CLIPBOARD_INPUT_SELECTOR).value = config.url;

      // social links
      Array.from(this._widget.querySelectorAll(TARGET_HREF_SELECTOR)).forEach(function (target) {
        target.href = target.getAttribute(TARGET_HREF_ATTR).replace('{href}', encodeURI(config.url));
      });

      // scope access dialog
      var privateMessage = this._widget.querySelector(PRIVATE_MSG_SELECTOR);
      var groupMessage = this._widget.querySelector(GROUP_MSG_SELECTOR);

      privateMessage.style.display = 'none';
      groupMessage.style.display = 'none';

      if (config.private) {
        privateMessage.style.display = 'block';
      } else if (config.group) {
        groupMessage.style.display = 'block';
      }
    }

    /**
     * Given a node, update the template, repostion the widget properly,
     *  and make it visible.
     *
     * @param  {HTMLElement} node The trigger node that we will place the widget
     *   next to.
     * @param  {ConfigOptions} config Passed through to rendering/interpolation
     */

  }, {
    key: 'showForNode',
    value: function showForNode(node, config) {

      if (!node || !config) {
        throw new Error('showForNode did not recieve both arguments');
      }

      this._renderWidgetTemplate(config);

      // offsets affecting height need to be updated after variable replacement
      var widgetOffsets = getOffset(this._widget);
      var nodeOffset = getOffset(node);

      this._widget.style.top = nodeOffset.top - widgetOffsets.height - ARROW_PADDING_BOTTOM + 'px';
      this._widget.style.left = ARROW_PADDING_RIGHT + nodeOffset.left + nodeOffset.width / 2 - widgetOffsets.width + 'px';

      this._container.style.visibility = 'visible';

      this._widgetVisible = true;
    }
  }, {
    key: 'hide',
    value: function hide() {
      this._container.style.visibility = 'hidden';
      this._widgetVisible = false;
    }

    /**
     * Utility to clean up the listeners applied. Otherwise the subsequent
     * constructor will reset all other state. Primary use is meant for testing cleanup
     */

  }, {
    key: 'detach',
    value: function detach() {
      window.document.body.removeEventListener('click', this._handler);
    }
  }]);

  return ShareWidget;
}();

/**
 * ShareWidgetController is the facade for the ShareWidget class that
 * does not mix the concerns of how our controller's lifecycle paradigm
 * in with the library code itself. Basically it maps what we define the
 * lifecycle of a controller to be into the appropriate method invocations on
 * the libraries api
 */


var ShareWidgetController = function (_Controller) {
  _inherits(ShareWidgetController, _Controller);

  function ShareWidgetController(element) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, ShareWidgetController);

    var _this2 = _possibleConstructorReturn(this, (ShareWidgetController.__proto__ || Object.getPrototypeOf(ShareWidgetController)).call(this, element, options));

    if (!shareWidgetAttached) {
      shareWidgetAttached = new ShareWidget(element);
    }
    return _this2;
  }

  _createClass(ShareWidgetController, [{
    key: 'beforeRemove',
    value: function beforeRemove() {
      if (shareWidgetAttached) {
        shareWidgetAttached.detach();
        shareWidgetAttached = null;
      }
    }
  }]);

  return ShareWidgetController;
}(Controller);

module.exports = ShareWidgetController;

},{"../base/controller":1}],18:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Controller = require('../base/controller');

var SignupFormController = function (_Controller) {
  _inherits(SignupFormController, _Controller);

  function SignupFormController(element) {
    _classCallCheck(this, SignupFormController);

    var _this = _possibleConstructorReturn(this, (SignupFormController.__proto__ || Object.getPrototypeOf(SignupFormController)).call(this, element));

    var submitBtn = element.querySelector('.js-signup-btn');

    element.addEventListener('submit', function () {
      submitBtn.disabled = true;
    });
    return _this;
  }

  return SignupFormController;
}(Controller);

module.exports = SignupFormController;

},{"../base/controller":1}],19:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Controller = require('../base/controller');

/**
 * A custom tooltip similar to the one used in Google Docs which appears
 * instantly when activated on a target element.
 *
 * The tooltip is displayed and hidden by setting its target element.
 *
 *  var tooltip = new Tooltip(document.body);
 *  tooltip.setState({target: aWidget}); // Show tooltip
 *  tooltip.setState({target: null}); // Hide tooltip
 *
 * The tooltip's label is derived from the target element's 'aria-label'
 * attribute.
 */

var TooltipController = function (_Controller) {
  _inherits(TooltipController, _Controller);

  function TooltipController(el) {
    _classCallCheck(this, TooltipController);

    // With mouse input, show the tooltip on hover. On touch devices we rely on
    // the browser to synthesize 'mouseover' events to make the tooltip appear
    // when the host element is tapped and disappear when the host element loses
    // focus.
    // See http://www.codediesel.com/javascript/making-mouseover-event-work-on-an-ipad/
    var _this = _possibleConstructorReturn(this, (TooltipController.__proto__ || Object.getPrototypeOf(TooltipController)).call(this, el));

    el.addEventListener('mouseover', function () {
      _this.setState({ target: el });
    });

    el.addEventListener('mouseout', function () {
      _this.setState({ target: null });
    });

    _this._tooltipEl = el.ownerDocument.createElement('div');
    _this._tooltipEl.innerHTML = '<span class="tooltip-label js-tooltip-label"></span>';
    _this._tooltipEl.className = 'tooltip';
    el.appendChild(_this._tooltipEl);
    _this._labelEl = _this._tooltipEl.querySelector('.js-tooltip-label');

    _this.setState({ target: null });
    return _this;
  }

  _createClass(TooltipController, [{
    key: 'update',
    value: function update(state) {
      if (!state.target) {
        this._tooltipEl.style.visibility = 'hidden';
        return;
      }

      var target = state.target;
      var label = target.getAttribute('aria-label');
      this._labelEl.textContent = label;

      Object.assign(this._tooltipEl.style, {
        visibility: '',
        bottom: 'calc(100% + 5px)'
      });
    }
  }]);

  return TooltipController;
}(Controller);

module.exports = TooltipController;

},{"../base/controller":1}],20:[function(require,module,exports){
'use strict';

// ES2015 polyfills

require('core-js/es6/promise');
require('core-js/fn/array/find');
require('core-js/fn/array/find-index');
require('core-js/fn/array/from');
require('core-js/fn/array/includes');
require('core-js/fn/object/assign');
require('core-js/fn/string/starts-with');

// Sets Element.prototype.closest and Element.prototype.matches
require('element-closest');

// String.prototype.normalize()
// FIXME: This is a large polyfill which should be only loaded when necessary
require('unorm');

// Element.prototype.dataset, required by IE 10
require('element-dataset')();

// Element.prototype.remove. Required by IE 10/11
if (!Element.prototype.remove) {
  Element.prototype.remove = function () {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  };
}

// URL constructor, required by IE 10/11,
// early versions of Microsoft Edge.
try {
  new window.URL('https://hypothes.is');
} catch (err) {
  require('js-polyfills/url');
}

// KeyboardEvent.prototype.key
// (Native in Chrome >= 51, Firefox >= 23, IE >= 9)
require('keyboardevent-key-polyfill').polyfill();

// Fetch API
// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
require('whatwg-fetch');

},{"core-js/es6/promise":28,"core-js/fn/array/find":30,"core-js/fn/array/find-index":29,"core-js/fn/array/from":31,"core-js/fn/array/includes":32,"core-js/fn/object/assign":33,"core-js/fn/string/starts-with":34,"element-closest":104,"element-dataset":105,"js-polyfills/url":107,"keyboardevent-key-polyfill":108,"unorm":"unorm","whatwg-fetch":113}],21:[function(require,module,exports){
'use strict';

// Configure error reporting

var settings = require('./base/settings')(document);
if (settings.raven) {
  var raven = require('./base/raven');
  raven.init(settings.raven);
}

require('./polyfills');

var CharacterLimitController = require('./controllers/character-limit-controller');
var CopyButtonController = require('./controllers/copy-button-controller');
var ConfirmSubmitController = require('./controllers/confirm-submit-controller');
var CreateGroupFormController = require('./controllers/create-group-form-controller');
var DropdownMenuController = require('./controllers/dropdown-menu-controller');
var FormController = require('./controllers/form-controller');
var FormSelectOnFocusController = require('./controllers/form-select-onfocus-controller');
var InputAutofocusController = require('./controllers/input-autofocus-controller');
var SearchBarController = require('./controllers/search-bar-controller');
var SearchBucketController = require('./controllers/search-bucket-controller');
var ShareWidgetController = require('./controllers/share-widget-controller');
var SignupFormController = require('./controllers/signup-form-controller');
var TooltipController = require('./controllers/tooltip-controller');
var upgradeElements = require('./base/upgrade-elements');

var controllers = {
  '.js-character-limit': CharacterLimitController,
  '.js-copy-button': CopyButtonController,
  '.js-confirm-submit': ConfirmSubmitController,
  '.js-create-group-form': CreateGroupFormController,
  '.js-dropdown-menu': DropdownMenuController,
  '.js-form': FormController,
  '.js-input-autofocus': InputAutofocusController,
  '.js-select-onfocus': FormSelectOnFocusController,
  '.js-search-bar': SearchBarController,
  '.js-search-bucket': SearchBucketController,
  '.js-share-widget': ShareWidgetController,
  '.js-signup-form': SignupFormController,
  '.js-tooltip': TooltipController
};

if (window.envFlags && window.envFlags.get('js-capable')) {
  upgradeElements(document.body, controllers);
  window.envFlags.ready();
} else {
  // Environment flags not initialized. The header script may have been missed
  // in the page or may have failed to load.
  console.warn('EnvironmentFlags not initialized. Skipping element upgrades');
}

},{"./base/raven":2,"./base/settings":3,"./base/upgrade-elements":4,"./controllers/character-limit-controller":6,"./controllers/confirm-submit-controller":7,"./controllers/copy-button-controller":8,"./controllers/create-group-form-controller":9,"./controllers/dropdown-menu-controller":10,"./controllers/form-controller":11,"./controllers/form-select-onfocus-controller":12,"./controllers/input-autofocus-controller":13,"./controllers/search-bar-controller":15,"./controllers/search-bucket-controller":16,"./controllers/share-widget-controller":17,"./controllers/signup-form-controller":18,"./controllers/tooltip-controller":19,"./polyfills":20}],22:[function(require,module,exports){
'use strict';

var stringUtil = require('./string');

var hyphenate = stringUtil.hyphenate;

/**
 * Utility functions for DOM manipulation.
 */

/**
 * Set the state classes (`is-$state`) on an element.
 *
 * @param {Element} el
 * @param {Object} state - A map of state keys to boolean. For each key `k`,
 *                 the class `is-$k` will be added to the element if the value
 *                 is true or removed otherwise.
 */
function setElementState(el, state) {
  Object.keys(state).forEach(function (key) {
    var stateClass = 'is-' + hyphenate(key);
    if (state[key]) {
      el.classList.add(stateClass);
    } else {
      el.classList.remove(stateClass);
    }
  });
}

/**
 * Search the DOM tree starting at `el` and return a map of "data-ref" attribute
 * values to elements.
 *
 * This provides a way to label parts of a control in markup and get a
 * reference to them subsequently in code.
 */
function findRefs(el) {
  var map = {};

  var descendantsWithRef = el.querySelectorAll('[data-ref]');

  var _loop = function _loop(i) {
    // Use `Element#getAttribute` rather than `Element#dataset` to support IE 10
    // and avoid https://bugs.webkit.org/show_bug.cgi?id=161454
    var refEl = descendantsWithRef[i];
    var refs = (refEl.getAttribute('data-ref') || '').split(' ');
    refs.forEach(function (ref) {
      map[ref] = refEl;
    });
  };

  for (var i = 0; i < descendantsWithRef.length; i++) {
    _loop(i);
  }

  return map;
}

/**
 * Return the first child of `node` which is an `Element`.
 *
 * Work around certain browsers (IE, Edge) not supporting firstElementChild on
 * Document, DocumentFragment.
 *
 * @param {Node} node
 */
function firstElementChild(node) {
  for (var i = 0; i < node.childNodes.length; i++) {
    if (node.childNodes[i].nodeType === Node.ELEMENT_NODE) {
      return node.childNodes[i];
    }
  }
  return null;
}

/**
 * Clone the content of a <template> element and return the first child Element.
 *
 * @param {HTMLTemplateElement} templateEl
 */
function cloneTemplate(templateEl) {
  if (templateEl.content) {
    // <template> supported natively.
    var content = templateEl.content.cloneNode(true);
    return firstElementChild(content);
  } else {
    // <template> not supported. Browser just treats it as an unknown Element.
    return templateEl.firstElementChild.cloneNode(true);
  }
}

module.exports = {
  cloneTemplate: cloneTemplate,
  findRefs: findRefs,
  setElementState: setElementState
};

},{"./string":25}],23:[function(require,module,exports){
'use strict';

// Focus release function returned by most recent call to trap()

var currentReleaseFn = void 0;

/**
 * Trap focus within a group of elements.
 *
 * Watch focus changes in a document and react to and/or prevent focus moving
 * outside a specified group of elements.
 *
 * @param {Element[]} elements - Array of elements which make up the modal group
 * @param {(Element) => Element|null} callback - Callback which is invoked when
 *        focus tries to move outside the modal group. It is called with the
 *        new element that will be focused. If it returns null, the focus change
 *        will proceed, otherwise if it returns an element within the group,
 *        that element will be focused instead.
 * @return {Function} A function which releases the modal focus, if it has not
 *        been changed by another call to trap() in the meantime.
 */
function trap(elements, callback) {
  if (currentReleaseFn) {
    currentReleaseFn();
  }

  // The most obvious way of detecting an element losing focus and reacting
  // based on the new focused element is the "focusout" event and the
  // FocusEvent#relatedTarget property.
  //
  // However, FocusEvent#relatedTarget is not implemented in all browsers
  // (Firefox < 48, IE) and is null in some cases even for browsers that do
  // support it.
  //
  // Instead we watch the 'focus' event on the document itself.

  var onFocusChange = function onFocusChange(event) {
    if (elements.some(function (el) {
      return el.contains(event.target);
    })) {
      // Focus remains within modal group
      return;
    }

    // Focus is trying to move outside of the modal group, test whether to
    // allow this
    var newTarget = callback(event.target);
    if (newTarget) {
      event.preventDefault();
      event.stopPropagation();
      newTarget.focus();
    } else if (currentReleaseFn) {
      currentReleaseFn();
    }
  };
  document.addEventListener('focus', onFocusChange, true /* useCapture */);

  var releaseFn = function releaseFn() {
    if (currentReleaseFn === releaseFn) {
      currentReleaseFn = null;
      document.removeEventListener('focus', onFocusChange, true /* useCapture */);
    }
  };
  currentReleaseFn = releaseFn;
  return releaseFn;
}

module.exports = {
  trap: trap
};

},{}],24:[function(require,module,exports){
'use strict';

/**
 * Function which determines if it is possible to lozengify a given phrase.
 *
 * @param {string} phrase A potential query term.
 *
 * @returns {boolean} True if the input phrase can be lozengified and false otherwise.
 *
 * @example
 * // returns True
 * canLozengify('foo')
 * @example
 * // returns False
 * canLozengify('foo)
 */

function canLozengify(phrase) {
  phrase = phrase.trim();
  // if there is no word
  if (!phrase) {
    return false;
  }
  // if a phrase starts with a double quote, it has to have a closing double quote
  if (phrase.indexOf('"') === 0 && (phrase.indexOf('"', 1) > phrase.length - 1 || phrase.indexOf('"', 1) < 0)) {
    return false;
  }
  // if a phrase starts with a single quote, it has to have a closing double quote
  if (phrase.indexOf("'") === 0 && (phrase.indexOf("'", 1) > phrase.length - 1 || phrase.indexOf("'", 1) < 0)) {
    return false;
  }
  // if phrase ends with a double quote it has to start with one
  if (phrase.indexOf('"', 1) === phrase.length - 1 && phrase.indexOf('"') !== 0) {
    return false;
  }
  // if phrase ends with a single quote it has to start with one
  if (phrase.indexOf("'", 1) === phrase.length - 1 && phrase.indexOf("'") !== 0) {
    return false;
  }
  return true;
}

/**
 * Function which determines if a phrase can be lozengified as is or
 * if it needs to be divided into a facet name and value first.
 *
 * @param {string} phrase A potential query term.
 *
 * @returns {boolean} True if the input phrase is ready to be
 * lozengified and false otherwise.
 *
 * @example
 * // returns True
 * shouldLozengify('foo:bar')
 * @example
 * // returns False
 * shouldLozengify('foo:"bar')
 */
function shouldLozengify(phrase) {
  // if the phrase has a facet and value
  if (phrase.indexOf(':') >= 0) {
    var queryTerm = getLozengeFacetNameAndValue(phrase);

    if (!canLozengify(queryTerm.facetName)) {
      return false;
    }
    if (queryTerm.facetValue.length > 0 && !canLozengify(queryTerm.facetValue)) {
      return false;
    }
  } else if (!canLozengify(phrase)) {
    return false;
  }
  return true;
}

/**
 * Return an array of lozenge values from the given string.
 *
 * @param {string} queryString A string of query terms.
 *
 * @returns {Object} An object with two properties: lozengeValues is an array
 *   of values to be turned into lozenges, and incompleteInputValue is any
 *   remaining un-lozengifiable text from the end of the input string
 *
 * @example
 * // returns {
 *   'lozengeValues': ['foo', 'key:"foo bar"', 'gar'],
 *   'incompleteInputValue': '"unclosed',
 * }
 * getLozengeValues('foo key:"foo bar" gar "unclosed')
 */
function getLozengeValues(queryString) {
  var inputTerms = '';
  var quoted = void 0;
  var queryTerms = [];
  queryString.split(' ').forEach(function (term) {
    if (quoted) {
      inputTerms = inputTerms + ' ' + term;
      if (shouldLozengify(inputTerms)) {
        queryTerms.push(inputTerms);
        inputTerms = '';
        quoted = false;
      }
    } else if (shouldLozengify(term)) {
      queryTerms.push(term);
    } else {
      inputTerms = term;
      quoted = true;
    }
  });
  return {
    lozengeValues: queryTerms,
    incompleteInputValue: inputTerms
  };
}

/**
 * Return true if the input query term string has a known named
 * query term.
 *
 * @param {string} queryTerm The query term string.
 *
 * @returns {boolean} True if the query term string has a known named
 * query term and False otherwise.
 *
 * @example
 * // returns false
 * hasKnownNamedQueryTerm('foo:bar')
 * @example
 * // returns true
 * hasKnownNamedQueryTerm('user:foo')
 */
function hasKnownNamedQueryTerm(queryTerm) {
  var knownNamedQueryTerms = ['user', 'uri', 'url', 'group', 'tag'];

  var facetName = getLozengeFacetNameAndValue(queryTerm).facetName;

  return knownNamedQueryTerms.indexOf(facetName) >= 0;
}

/**
 * Return an object with the facet name and value for a given query term.
 *
 * @param {string} queryTerm The query term string.
 *
 * @returns {Object} An object with two properties:
 * facetName and facetValue.
 *
 * @example
 * // returns {
 *   facetName: foo,
 *   facetValue: bar,
 * }
 * getLozengeFacetNameAndValue('foo:bar')
 * @example
 * // returns {
 *   facetName: '',
 *   facetValue: gar,
 * }
 * getLozengeFacetNameAndValue('gar')
 */
function getLozengeFacetNameAndValue(queryTerm) {
  var i = void 0;
  var lozengeFacetNameAndValue = {
    facetName: '',
    facetValue: ''
  };

  if (queryTerm.indexOf(':') >= 0) {
    i = queryTerm.indexOf(':');

    lozengeFacetNameAndValue.facetName = queryTerm.slice(0, i).trim();
    lozengeFacetNameAndValue.facetValue = queryTerm.slice(i + 1, queryTerm.length).trim();

    return lozengeFacetNameAndValue;
  }

  lozengeFacetNameAndValue.facetValue = queryTerm;

  return lozengeFacetNameAndValue;
}

module.exports = {
  shouldLozengify: shouldLozengify,
  getLozengeValues: getLozengeValues,
  getLozengeFacetNameAndValue: getLozengeFacetNameAndValue,
  hasKnownNamedQueryTerm: hasKnownNamedQueryTerm
};

},{}],25:[function(require,module,exports){
'use strict';

// Unicode combining characters
// from http://xregexp.com/addons/unicode/unicode-categories.js line:30

var COMBINING_MARKS = /[\u0300-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08E4-\u08FE\u0900-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B62\u0B63\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C01-\u0C03\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C82\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0D02\u0D03\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EB9\u0EBB\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F\u109A-\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u180B-\u180D\u18A9\u1920-\u192B\u1930-\u193B\u19B0-\u19C0\u19C8\u19C9\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F\u1B00-\u1B04\u1B34-\u1B44\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BE6-\u1BF3\u1C24-\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF2-\u1CF4\u1DC0-\u1DE6\u1DFC-\u1DFF\u20D0-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA66F-\uA672\uA674-\uA67D\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA880\uA881\uA8B4-\uA8C4\uA8E0-\uA8F1\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA7B\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE26]/g;

/**
 * Convert a `camelCase` or `CapitalCase` string to `kebab-case`
 */
function hyphenate(name) {
  var uppercasePattern = /([A-Z])/g;
  return name.replace(uppercasePattern, '-$1').toLowerCase();
}

/** Convert a `kebab-case` string to `camelCase` */
function unhyphenate(name) {
  var idx = name.indexOf('-');
  if (idx === -1) {
    return name;
  } else {
    var ch = (name[idx + 1] || '').toUpperCase();
    return unhyphenate(name.slice(0, idx) + ch + name.slice(idx + 2));
  }
}

/**
 * Normalize a string to NFKD form.
 *
 * In combination with `fold()` this can be used to create a representation of
 * a string which is useful for comparisons that should ignore differences in
 * accents/combining marks. See
 * http://www.unicode.org/reports/tr15/#Compatibility_Composite_Figure
 *
 * @example
 *
 * // returns true
 * fold(normalize('Éire')) === 'Eire'
 *
 * @param {String} str
 * @return {String}
 */
function normalize(str) {
  if (!String.prototype.normalize) {
    return str;
  }

  return str.normalize('NFKD');
}

/**
 * Remove the combining marks from characters in Unicode strings
 *
 * This assumes that `str` has first been decomposed using `normalize()`.
 *
 * @param {String} str
 * @return {String}
 */
function fold(str) {
  return str.replace(COMBINING_MARKS, '');
}

module.exports = {
  hyphenate: hyphenate,
  unhyphenate: unhyphenate,
  normalize: normalize,
  fold: fold
};

},{}],26:[function(require,module,exports){
'use strict';

/**
 * @typedef SubmitError
 * @property {number} status - HTTP status code. 400 if form submission failed
 *           due to a validation error or a different 4xx or 5xx code if it
 *           failed for other reasons.
 * @property {string} [form] - HTML markup for the form containing validation
 *           error messages if submission failed with a 400 status.
 * @property {string} [reason] - The status message if form submission failed
 *           for reasons other than a validation error.
 */

/**
 * Exception thrown if form submission fails.
 *
 * @property {SubmitError} params - Describes why submission failed. These
 *           properties are exposed on the FormSubmitError instance.
 */

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var FormSubmitError = function (_Error) {
  _inherits(FormSubmitError, _Error);

  function FormSubmitError(message, params) {
    _classCallCheck(this, FormSubmitError);

    var _this = _possibleConstructorReturn(this, (FormSubmitError.__proto__ || Object.getPrototypeOf(FormSubmitError)).call(this, message));

    Object.assign(_this, params);
    return _this;
  }

  return FormSubmitError;
}(Error);

/**
 * Return the URL which a form should be submitted to.
 *
 * @param {HTMLFormElement} form
 */


function formUrl(form) {
  if (form.getAttribute('action')) {
    return form.action;
  } else {
    // `form.action` returns an absolute URL created by resolving the URL
    // in the "action" attribute against the document's location.
    //
    // Browsers except IE implement a special case where the document's URL
    // is returned if the "action" attribute is missing or an empty string.
    return document.location.href;
  }
}

/**
 * @typedef {Object} SubmitResult
 * @property {number} status - Always 200
 * @property {string} form - The HTML markup for the re-rendered form
 */

/**
 * Submit a form using the Fetch API and return the markup for the re-rendered
 * version of the form.
 *
 * @param {HTMLFormElement} formEl - The `<form>` to submit
 * @return {Promise<SubmitResult>} A promise which resolves when the form
 *         submission completes or rejects with a FormSubmitError if the server
 *         rejects the submission due to a validation error or the network
 *         request fails.
 */
function submitForm(formEl) {
  var fetch = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : window.fetch;

  var response = void 0;
  return fetch(formUrl(formEl), {
    body: new FormData(formEl),
    credentials: 'same-origin',
    method: 'POST',
    headers: {
      'X-Requested-With': 'XMLHttpRequest'
    }
  }).then(function (response_) {
    response = response_;
    return response.text();
  }).then(function (body) {
    var _response = response,
        status = _response.status;

    switch (status) {
      case 200:
        return { status: status, form: body };
      case 400:
        throw new FormSubmitError('Form validation failed', {
          status: status, form: body
        });
      default:
        throw new FormSubmitError('Form submission failed', {
          status: status,
          reason: response.statusText
        });
    }
  });
}

module.exports = submitForm;

},{}],27:[function(require,module,exports){
'use strict';

module.exports = {

  /**
   * compare two list arrays and decide if they have changed
   *
   * @param  {Array} listA
   * @param  {Array} listB
   * @returns {bool}       the result of comparing if the two
   *   arrays seem like they have changed. True if they have changed
   */
  listIsDifferent: function listIsDifferent(listA, listB) {

    if (!(Array.isArray(listA) && Array.isArray(listB))) {
      return true;
    }

    if (listA.length !== listB.length) {
      return true;
    }

    return !listA.every(function (item, index) {
      return item === listB[index];
    });
  }
};

},{}],28:[function(require,module,exports){
require('../modules/es6.object.to-string');
require('../modules/es6.string.iterator');
require('../modules/web.dom.iterable');
require('../modules/es6.promise');
module.exports = require('../modules/$.core').Promise;
},{"../modules/$.core":43,"../modules/es6.object.to-string":98,"../modules/es6.promise":99,"../modules/es6.string.iterator":100,"../modules/web.dom.iterable":103}],29:[function(require,module,exports){
require('../../modules/es6.array.find-index');
module.exports = require('../../modules/$.core').Array.findIndex;
},{"../../modules/$.core":43,"../../modules/es6.array.find-index":93}],30:[function(require,module,exports){
require('../../modules/es6.array.find');
module.exports = require('../../modules/$.core').Array.find;
},{"../../modules/$.core":43,"../../modules/es6.array.find":94}],31:[function(require,module,exports){
require('../../modules/es6.string.iterator');
require('../../modules/es6.array.from');
module.exports = require('../../modules/$.core').Array.from;
},{"../../modules/$.core":43,"../../modules/es6.array.from":95,"../../modules/es6.string.iterator":100}],32:[function(require,module,exports){
require('../../modules/es7.array.includes');
module.exports = require('../../modules/$.core').Array.includes;
},{"../../modules/$.core":43,"../../modules/es7.array.includes":102}],33:[function(require,module,exports){
require('../../modules/es6.object.assign');
module.exports = require('../../modules/$.core').Object.assign;
},{"../../modules/$.core":43,"../../modules/es6.object.assign":97}],34:[function(require,module,exports){
require('../../modules/es6.string.starts-with');
module.exports = require('../../modules/$.core').String.startsWith;
},{"../../modules/$.core":43,"../../modules/es6.string.starts-with":101}],35:[function(require,module,exports){
module.exports = function(it){
  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
  return it;
};
},{}],36:[function(require,module,exports){
// 22.1.3.31 Array.prototype[@@unscopables]
var UNSCOPABLES = require('./$.wks')('unscopables')
  , ArrayProto  = Array.prototype;
if(ArrayProto[UNSCOPABLES] == undefined)require('./$.hide')(ArrayProto, UNSCOPABLES, {});
module.exports = function(key){
  ArrayProto[UNSCOPABLES][key] = true;
};
},{"./$.hide":54,"./$.wks":91}],37:[function(require,module,exports){
var isObject = require('./$.is-object');
module.exports = function(it){
  if(!isObject(it))throw TypeError(it + ' is not an object!');
  return it;
};
},{"./$.is-object":60}],38:[function(require,module,exports){
// false -> Array#indexOf
// true  -> Array#includes
var toIObject = require('./$.to-iobject')
  , toLength  = require('./$.to-length')
  , toIndex   = require('./$.to-index');
module.exports = function(IS_INCLUDES){
  return function($this, el, fromIndex){
    var O      = toIObject($this)
      , length = toLength(O.length)
      , index  = toIndex(fromIndex, length)
      , value;
    // Array#includes uses SameValueZero equality algorithm
    if(IS_INCLUDES && el != el)while(length > index){
      value = O[index++];
      if(value != value)return true;
    // Array#toIndex ignores holes, Array#includes - not
    } else for(;length > index; index++)if(IS_INCLUDES || index in O){
      if(O[index] === el)return IS_INCLUDES || index;
    } return !IS_INCLUDES && -1;
  };
};
},{"./$.to-index":85,"./$.to-iobject":87,"./$.to-length":88}],39:[function(require,module,exports){
// 0 -> Array#forEach
// 1 -> Array#map
// 2 -> Array#filter
// 3 -> Array#some
// 4 -> Array#every
// 5 -> Array#find
// 6 -> Array#findIndex
var ctx      = require('./$.ctx')
  , IObject  = require('./$.iobject')
  , toObject = require('./$.to-object')
  , toLength = require('./$.to-length')
  , asc      = require('./$.array-species-create');
module.exports = function(TYPE){
  var IS_MAP        = TYPE == 1
    , IS_FILTER     = TYPE == 2
    , IS_SOME       = TYPE == 3
    , IS_EVERY      = TYPE == 4
    , IS_FIND_INDEX = TYPE == 6
    , NO_HOLES      = TYPE == 5 || IS_FIND_INDEX;
  return function($this, callbackfn, that){
    var O      = toObject($this)
      , self   = IObject(O)
      , f      = ctx(callbackfn, that, 3)
      , length = toLength(self.length)
      , index  = 0
      , result = IS_MAP ? asc($this, length) : IS_FILTER ? asc($this, 0) : undefined
      , val, res;
    for(;length > index; index++)if(NO_HOLES || index in self){
      val = self[index];
      res = f(val, index, O);
      if(TYPE){
        if(IS_MAP)result[index] = res;            // map
        else if(res)switch(TYPE){
          case 3: return true;                    // some
          case 5: return val;                     // find
          case 6: return index;                   // findIndex
          case 2: result.push(val);               // filter
        } else if(IS_EVERY)return false;          // every
      }
    }
    return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : result;
  };
};
},{"./$.array-species-create":40,"./$.ctx":44,"./$.iobject":57,"./$.to-length":88,"./$.to-object":89}],40:[function(require,module,exports){
// 9.4.2.3 ArraySpeciesCreate(originalArray, length)
var isObject = require('./$.is-object')
  , isArray  = require('./$.is-array')
  , SPECIES  = require('./$.wks')('species');
module.exports = function(original, length){
  var C;
  if(isArray(original)){
    C = original.constructor;
    // cross-realm fallback
    if(typeof C == 'function' && (C === Array || isArray(C.prototype)))C = undefined;
    if(isObject(C)){
      C = C[SPECIES];
      if(C === null)C = undefined;
    }
  } return new (C === undefined ? Array : C)(length);
};
},{"./$.is-array":59,"./$.is-object":60,"./$.wks":91}],41:[function(require,module,exports){
// getting tag from 19.1.3.6 Object.prototype.toString()
var cof = require('./$.cof')
  , TAG = require('./$.wks')('toStringTag')
  // ES3 wrong here
  , ARG = cof(function(){ return arguments; }()) == 'Arguments';

module.exports = function(it){
  var O, T, B;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (T = (O = Object(it))[TAG]) == 'string' ? T
    // builtinTag case
    : ARG ? cof(O)
    // ES3 arguments fallback
    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
};
},{"./$.cof":42,"./$.wks":91}],42:[function(require,module,exports){
var toString = {}.toString;

module.exports = function(it){
  return toString.call(it).slice(8, -1);
};
},{}],43:[function(require,module,exports){
var core = module.exports = {version: '1.2.6'};
if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef
},{}],44:[function(require,module,exports){
// optional / simple context binding
var aFunction = require('./$.a-function');
module.exports = function(fn, that, length){
  aFunction(fn);
  if(that === undefined)return fn;
  switch(length){
    case 1: return function(a){
      return fn.call(that, a);
    };
    case 2: return function(a, b){
      return fn.call(that, a, b);
    };
    case 3: return function(a, b, c){
      return fn.call(that, a, b, c);
    };
  }
  return function(/* ...args */){
    return fn.apply(that, arguments);
  };
};
},{"./$.a-function":35}],45:[function(require,module,exports){
// 7.2.1 RequireObjectCoercible(argument)
module.exports = function(it){
  if(it == undefined)throw TypeError("Can't call method on  " + it);
  return it;
};
},{}],46:[function(require,module,exports){
// Thank's IE8 for his funny defineProperty
module.exports = !require('./$.fails')(function(){
  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
});
},{"./$.fails":50}],47:[function(require,module,exports){
var isObject = require('./$.is-object')
  , document = require('./$.global').document
  // in old IE typeof document.createElement is 'object'
  , is = isObject(document) && isObject(document.createElement);
module.exports = function(it){
  return is ? document.createElement(it) : {};
};
},{"./$.global":52,"./$.is-object":60}],48:[function(require,module,exports){
var global    = require('./$.global')
  , core      = require('./$.core')
  , hide      = require('./$.hide')
  , redefine  = require('./$.redefine')
  , ctx       = require('./$.ctx')
  , PROTOTYPE = 'prototype';

var $export = function(type, name, source){
  var IS_FORCED = type & $export.F
    , IS_GLOBAL = type & $export.G
    , IS_STATIC = type & $export.S
    , IS_PROTO  = type & $export.P
    , IS_BIND   = type & $export.B
    , target    = IS_GLOBAL ? global : IS_STATIC ? global[name] || (global[name] = {}) : (global[name] || {})[PROTOTYPE]
    , exports   = IS_GLOBAL ? core : core[name] || (core[name] = {})
    , expProto  = exports[PROTOTYPE] || (exports[PROTOTYPE] = {})
    , key, own, out, exp;
  if(IS_GLOBAL)source = name;
  for(key in source){
    // contains in native
    own = !IS_FORCED && target && key in target;
    // export native or passed
    out = (own ? target : source)[key];
    // bind timers to global for call from export context
    exp = IS_BIND && own ? ctx(out, global) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    // extend global
    if(target && !own)redefine(target, key, out);
    // export
    if(exports[key] != out)hide(exports, key, exp);
    if(IS_PROTO && expProto[key] != out)expProto[key] = out;
  }
};
global.core = core;
// type bitmap
$export.F = 1;  // forced
$export.G = 2;  // global
$export.S = 4;  // static
$export.P = 8;  // proto
$export.B = 16; // bind
$export.W = 32; // wrap
module.exports = $export;
},{"./$.core":43,"./$.ctx":44,"./$.global":52,"./$.hide":54,"./$.redefine":74}],49:[function(require,module,exports){
var MATCH = require('./$.wks')('match');
module.exports = function(KEY){
  var re = /./;
  try {
    '/./'[KEY](re);
  } catch(e){
    try {
      re[MATCH] = false;
      return !'/./'[KEY](re);
    } catch(f){ /* empty */ }
  } return true;
};
},{"./$.wks":91}],50:[function(require,module,exports){
module.exports = function(exec){
  try {
    return !!exec();
  } catch(e){
    return true;
  }
};
},{}],51:[function(require,module,exports){
var ctx         = require('./$.ctx')
  , call        = require('./$.iter-call')
  , isArrayIter = require('./$.is-array-iter')
  , anObject    = require('./$.an-object')
  , toLength    = require('./$.to-length')
  , getIterFn   = require('./core.get-iterator-method');
module.exports = function(iterable, entries, fn, that){
  var iterFn = getIterFn(iterable)
    , f      = ctx(fn, that, entries ? 2 : 1)
    , index  = 0
    , length, step, iterator;
  if(typeof iterFn != 'function')throw TypeError(iterable + ' is not iterable!');
  // fast case for arrays with default iterator
  if(isArrayIter(iterFn))for(length = toLength(iterable.length); length > index; index++){
    entries ? f(anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
  } else for(iterator = iterFn.call(iterable); !(step = iterator.next()).done; ){
    call(iterator, f, step.value, entries);
  }
};
},{"./$.an-object":37,"./$.ctx":44,"./$.is-array-iter":58,"./$.iter-call":62,"./$.to-length":88,"./core.get-iterator-method":92}],52:[function(require,module,exports){
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef
},{}],53:[function(require,module,exports){
var hasOwnProperty = {}.hasOwnProperty;
module.exports = function(it, key){
  return hasOwnProperty.call(it, key);
};
},{}],54:[function(require,module,exports){
var $          = require('./$')
  , createDesc = require('./$.property-desc');
module.exports = require('./$.descriptors') ? function(object, key, value){
  return $.setDesc(object, key, createDesc(1, value));
} : function(object, key, value){
  object[key] = value;
  return object;
};
},{"./$":68,"./$.descriptors":46,"./$.property-desc":72}],55:[function(require,module,exports){
module.exports = require('./$.global').document && document.documentElement;
},{"./$.global":52}],56:[function(require,module,exports){
// fast apply, http://jsperf.lnkit.com/fast-apply/5
module.exports = function(fn, args, that){
  var un = that === undefined;
  switch(args.length){
    case 0: return un ? fn()
                      : fn.call(that);
    case 1: return un ? fn(args[0])
                      : fn.call(that, args[0]);
    case 2: return un ? fn(args[0], args[1])
                      : fn.call(that, args[0], args[1]);
    case 3: return un ? fn(args[0], args[1], args[2])
                      : fn.call(that, args[0], args[1], args[2]);
    case 4: return un ? fn(args[0], args[1], args[2], args[3])
                      : fn.call(that, args[0], args[1], args[2], args[3]);
  } return              fn.apply(that, args);
};
},{}],57:[function(require,module,exports){
// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = require('./$.cof');
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function(it){
  return cof(it) == 'String' ? it.split('') : Object(it);
};
},{"./$.cof":42}],58:[function(require,module,exports){
// check on default Array iterator
var Iterators  = require('./$.iterators')
  , ITERATOR   = require('./$.wks')('iterator')
  , ArrayProto = Array.prototype;

module.exports = function(it){
  return it !== undefined && (Iterators.Array === it || ArrayProto[ITERATOR] === it);
};
},{"./$.iterators":67,"./$.wks":91}],59:[function(require,module,exports){
// 7.2.2 IsArray(argument)
var cof = require('./$.cof');
module.exports = Array.isArray || function(arg){
  return cof(arg) == 'Array';
};
},{"./$.cof":42}],60:[function(require,module,exports){
module.exports = function(it){
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};
},{}],61:[function(require,module,exports){
// 7.2.8 IsRegExp(argument)
var isObject = require('./$.is-object')
  , cof      = require('./$.cof')
  , MATCH    = require('./$.wks')('match');
module.exports = function(it){
  var isRegExp;
  return isObject(it) && ((isRegExp = it[MATCH]) !== undefined ? !!isRegExp : cof(it) == 'RegExp');
};
},{"./$.cof":42,"./$.is-object":60,"./$.wks":91}],62:[function(require,module,exports){
// call something on iterator step with safe closing on error
var anObject = require('./$.an-object');
module.exports = function(iterator, fn, value, entries){
  try {
    return entries ? fn(anObject(value)[0], value[1]) : fn(value);
  // 7.4.6 IteratorClose(iterator, completion)
  } catch(e){
    var ret = iterator['return'];
    if(ret !== undefined)anObject(ret.call(iterator));
    throw e;
  }
};
},{"./$.an-object":37}],63:[function(require,module,exports){
'use strict';
var $              = require('./$')
  , descriptor     = require('./$.property-desc')
  , setToStringTag = require('./$.set-to-string-tag')
  , IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
require('./$.hide')(IteratorPrototype, require('./$.wks')('iterator'), function(){ return this; });

module.exports = function(Constructor, NAME, next){
  Constructor.prototype = $.create(IteratorPrototype, {next: descriptor(1, next)});
  setToStringTag(Constructor, NAME + ' Iterator');
};
},{"./$":68,"./$.hide":54,"./$.property-desc":72,"./$.set-to-string-tag":78,"./$.wks":91}],64:[function(require,module,exports){
'use strict';
var LIBRARY        = require('./$.library')
  , $export        = require('./$.export')
  , redefine       = require('./$.redefine')
  , hide           = require('./$.hide')
  , has            = require('./$.has')
  , Iterators      = require('./$.iterators')
  , $iterCreate    = require('./$.iter-create')
  , setToStringTag = require('./$.set-to-string-tag')
  , getProto       = require('./$').getProto
  , ITERATOR       = require('./$.wks')('iterator')
  , BUGGY          = !([].keys && 'next' in [].keys()) // Safari has buggy iterators w/o `next`
  , FF_ITERATOR    = '@@iterator'
  , KEYS           = 'keys'
  , VALUES         = 'values';

var returnThis = function(){ return this; };

module.exports = function(Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED){
  $iterCreate(Constructor, NAME, next);
  var getMethod = function(kind){
    if(!BUGGY && kind in proto)return proto[kind];
    switch(kind){
      case KEYS: return function keys(){ return new Constructor(this, kind); };
      case VALUES: return function values(){ return new Constructor(this, kind); };
    } return function entries(){ return new Constructor(this, kind); };
  };
  var TAG        = NAME + ' Iterator'
    , DEF_VALUES = DEFAULT == VALUES
    , VALUES_BUG = false
    , proto      = Base.prototype
    , $native    = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT]
    , $default   = $native || getMethod(DEFAULT)
    , methods, key;
  // Fix native
  if($native){
    var IteratorPrototype = getProto($default.call(new Base));
    // Set @@toStringTag to native iterators
    setToStringTag(IteratorPrototype, TAG, true);
    // FF fix
    if(!LIBRARY && has(proto, FF_ITERATOR))hide(IteratorPrototype, ITERATOR, returnThis);
    // fix Array#{values, @@iterator}.name in V8 / FF
    if(DEF_VALUES && $native.name !== VALUES){
      VALUES_BUG = true;
      $default = function values(){ return $native.call(this); };
    }
  }
  // Define iterator
  if((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])){
    hide(proto, ITERATOR, $default);
  }
  // Plug for library
  Iterators[NAME] = $default;
  Iterators[TAG]  = returnThis;
  if(DEFAULT){
    methods = {
      values:  DEF_VALUES  ? $default : getMethod(VALUES),
      keys:    IS_SET      ? $default : getMethod(KEYS),
      entries: !DEF_VALUES ? $default : getMethod('entries')
    };
    if(FORCED)for(key in methods){
      if(!(key in proto))redefine(proto, key, methods[key]);
    } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
  }
  return methods;
};
},{"./$":68,"./$.export":48,"./$.has":53,"./$.hide":54,"./$.iter-create":63,"./$.iterators":67,"./$.library":69,"./$.redefine":74,"./$.set-to-string-tag":78,"./$.wks":91}],65:[function(require,module,exports){
var ITERATOR     = require('./$.wks')('iterator')
  , SAFE_CLOSING = false;

try {
  var riter = [7][ITERATOR]();
  riter['return'] = function(){ SAFE_CLOSING = true; };
  Array.from(riter, function(){ throw 2; });
} catch(e){ /* empty */ }

module.exports = function(exec, skipClosing){
  if(!skipClosing && !SAFE_CLOSING)return false;
  var safe = false;
  try {
    var arr  = [7]
      , iter = arr[ITERATOR]();
    iter.next = function(){ return {done: safe = true}; };
    arr[ITERATOR] = function(){ return iter; };
    exec(arr);
  } catch(e){ /* empty */ }
  return safe;
};
},{"./$.wks":91}],66:[function(require,module,exports){
module.exports = function(done, value){
  return {value: value, done: !!done};
};
},{}],67:[function(require,module,exports){
module.exports = {};
},{}],68:[function(require,module,exports){
var $Object = Object;
module.exports = {
  create:     $Object.create,
  getProto:   $Object.getPrototypeOf,
  isEnum:     {}.propertyIsEnumerable,
  getDesc:    $Object.getOwnPropertyDescriptor,
  setDesc:    $Object.defineProperty,
  setDescs:   $Object.defineProperties,
  getKeys:    $Object.keys,
  getNames:   $Object.getOwnPropertyNames,
  getSymbols: $Object.getOwnPropertySymbols,
  each:       [].forEach
};
},{}],69:[function(require,module,exports){
module.exports = false;
},{}],70:[function(require,module,exports){
var global    = require('./$.global')
  , macrotask = require('./$.task').set
  , Observer  = global.MutationObserver || global.WebKitMutationObserver
  , process   = global.process
  , Promise   = global.Promise
  , isNode    = require('./$.cof')(process) == 'process'
  , head, last, notify;

var flush = function(){
  var parent, domain, fn;
  if(isNode && (parent = process.domain)){
    process.domain = null;
    parent.exit();
  }
  while(head){
    domain = head.domain;
    fn     = head.fn;
    if(domain)domain.enter();
    fn(); // <- currently we use it only for Promise - try / catch not required
    if(domain)domain.exit();
    head = head.next;
  } last = undefined;
  if(parent)parent.enter();
};

// Node.js
if(isNode){
  notify = function(){
    process.nextTick(flush);
  };
// browsers with MutationObserver
} else if(Observer){
  var toggle = 1
    , node   = document.createTextNode('');
  new Observer(flush).observe(node, {characterData: true}); // eslint-disable-line no-new
  notify = function(){
    node.data = toggle = -toggle;
  };
// environments with maybe non-completely correct, but existent Promise
} else if(Promise && Promise.resolve){
  notify = function(){
    Promise.resolve().then(flush);
  };
// for other environments - macrotask based on:
// - setImmediate
// - MessageChannel
// - window.postMessag
// - onreadystatechange
// - setTimeout
} else {
  notify = function(){
    // strange IE + webpack dev server bug - use .call(global)
    macrotask.call(global, flush);
  };
}

module.exports = function asap(fn){
  var task = {fn: fn, next: undefined, domain: isNode && process.domain};
  if(last)last.next = task;
  if(!head){
    head = task;
    notify();
  } last = task;
};
},{"./$.cof":42,"./$.global":52,"./$.task":84}],71:[function(require,module,exports){
// 19.1.2.1 Object.assign(target, source, ...)
var $        = require('./$')
  , toObject = require('./$.to-object')
  , IObject  = require('./$.iobject');

// should work with symbols and should have deterministic property order (V8 bug)
module.exports = require('./$.fails')(function(){
  var a = Object.assign
    , A = {}
    , B = {}
    , S = Symbol()
    , K = 'abcdefghijklmnopqrst';
  A[S] = 7;
  K.split('').forEach(function(k){ B[k] = k; });
  return a({}, A)[S] != 7 || Object.keys(a({}, B)).join('') != K;
}) ? function assign(target, source){ // eslint-disable-line no-unused-vars
  var T     = toObject(target)
    , $$    = arguments
    , $$len = $$.length
    , index = 1
    , getKeys    = $.getKeys
    , getSymbols = $.getSymbols
    , isEnum     = $.isEnum;
  while($$len > index){
    var S      = IObject($$[index++])
      , keys   = getSymbols ? getKeys(S).concat(getSymbols(S)) : getKeys(S)
      , length = keys.length
      , j      = 0
      , key;
    while(length > j)if(isEnum.call(S, key = keys[j++]))T[key] = S[key];
  }
  return T;
} : Object.assign;
},{"./$":68,"./$.fails":50,"./$.iobject":57,"./$.to-object":89}],72:[function(require,module,exports){
module.exports = function(bitmap, value){
  return {
    enumerable  : !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable    : !(bitmap & 4),
    value       : value
  };
};
},{}],73:[function(require,module,exports){
var redefine = require('./$.redefine');
module.exports = function(target, src){
  for(var key in src)redefine(target, key, src[key]);
  return target;
};
},{"./$.redefine":74}],74:[function(require,module,exports){
// add fake Function#toString
// for correct work wrapped methods / constructors with methods like LoDash isNative
var global    = require('./$.global')
  , hide      = require('./$.hide')
  , SRC       = require('./$.uid')('src')
  , TO_STRING = 'toString'
  , $toString = Function[TO_STRING]
  , TPL       = ('' + $toString).split(TO_STRING);

require('./$.core').inspectSource = function(it){
  return $toString.call(it);
};

(module.exports = function(O, key, val, safe){
  if(typeof val == 'function'){
    val.hasOwnProperty(SRC) || hide(val, SRC, O[key] ? '' + O[key] : TPL.join(String(key)));
    val.hasOwnProperty('name') || hide(val, 'name', key);
  }
  if(O === global){
    O[key] = val;
  } else {
    if(!safe)delete O[key];
    hide(O, key, val);
  }
})(Function.prototype, TO_STRING, function toString(){
  return typeof this == 'function' && this[SRC] || $toString.call(this);
});
},{"./$.core":43,"./$.global":52,"./$.hide":54,"./$.uid":90}],75:[function(require,module,exports){
// 7.2.9 SameValue(x, y)
module.exports = Object.is || function is(x, y){
  return x === y ? x !== 0 || 1 / x === 1 / y : x != x && y != y;
};
},{}],76:[function(require,module,exports){
// Works with __proto__ only. Old v8 can't work with null proto objects.
/* eslint-disable no-proto */
var getDesc  = require('./$').getDesc
  , isObject = require('./$.is-object')
  , anObject = require('./$.an-object');
var check = function(O, proto){
  anObject(O);
  if(!isObject(proto) && proto !== null)throw TypeError(proto + ": can't set as prototype!");
};
module.exports = {
  set: Object.setPrototypeOf || ('__proto__' in {} ? // eslint-disable-line
    function(test, buggy, set){
      try {
        set = require('./$.ctx')(Function.call, getDesc(Object.prototype, '__proto__').set, 2);
        set(test, []);
        buggy = !(test instanceof Array);
      } catch(e){ buggy = true; }
      return function setPrototypeOf(O, proto){
        check(O, proto);
        if(buggy)O.__proto__ = proto;
        else set(O, proto);
        return O;
      };
    }({}, false) : undefined),
  check: check
};
},{"./$":68,"./$.an-object":37,"./$.ctx":44,"./$.is-object":60}],77:[function(require,module,exports){
'use strict';
var global      = require('./$.global')
  , $           = require('./$')
  , DESCRIPTORS = require('./$.descriptors')
  , SPECIES     = require('./$.wks')('species');

module.exports = function(KEY){
  var C = global[KEY];
  if(DESCRIPTORS && C && !C[SPECIES])$.setDesc(C, SPECIES, {
    configurable: true,
    get: function(){ return this; }
  });
};
},{"./$":68,"./$.descriptors":46,"./$.global":52,"./$.wks":91}],78:[function(require,module,exports){
var def = require('./$').setDesc
  , has = require('./$.has')
  , TAG = require('./$.wks')('toStringTag');

module.exports = function(it, tag, stat){
  if(it && !has(it = stat ? it : it.prototype, TAG))def(it, TAG, {configurable: true, value: tag});
};
},{"./$":68,"./$.has":53,"./$.wks":91}],79:[function(require,module,exports){
var global = require('./$.global')
  , SHARED = '__core-js_shared__'
  , store  = global[SHARED] || (global[SHARED] = {});
module.exports = function(key){
  return store[key] || (store[key] = {});
};
},{"./$.global":52}],80:[function(require,module,exports){
// 7.3.20 SpeciesConstructor(O, defaultConstructor)
var anObject  = require('./$.an-object')
  , aFunction = require('./$.a-function')
  , SPECIES   = require('./$.wks')('species');
module.exports = function(O, D){
  var C = anObject(O).constructor, S;
  return C === undefined || (S = anObject(C)[SPECIES]) == undefined ? D : aFunction(S);
};
},{"./$.a-function":35,"./$.an-object":37,"./$.wks":91}],81:[function(require,module,exports){
module.exports = function(it, Constructor, name){
  if(!(it instanceof Constructor))throw TypeError(name + ": use the 'new' operator!");
  return it;
};
},{}],82:[function(require,module,exports){
var toInteger = require('./$.to-integer')
  , defined   = require('./$.defined');
// true  -> String#at
// false -> String#codePointAt
module.exports = function(TO_STRING){
  return function(that, pos){
    var s = String(defined(that))
      , i = toInteger(pos)
      , l = s.length
      , a, b;
    if(i < 0 || i >= l)return TO_STRING ? '' : undefined;
    a = s.charCodeAt(i);
    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
      ? TO_STRING ? s.charAt(i) : a
      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
  };
};
},{"./$.defined":45,"./$.to-integer":86}],83:[function(require,module,exports){
// helper for String#{startsWith, endsWith, includes}
var isRegExp = require('./$.is-regexp')
  , defined  = require('./$.defined');

module.exports = function(that, searchString, NAME){
  if(isRegExp(searchString))throw TypeError('String#' + NAME + " doesn't accept regex!");
  return String(defined(that));
};
},{"./$.defined":45,"./$.is-regexp":61}],84:[function(require,module,exports){
var ctx                = require('./$.ctx')
  , invoke             = require('./$.invoke')
  , html               = require('./$.html')
  , cel                = require('./$.dom-create')
  , global             = require('./$.global')
  , process            = global.process
  , setTask            = global.setImmediate
  , clearTask          = global.clearImmediate
  , MessageChannel     = global.MessageChannel
  , counter            = 0
  , queue              = {}
  , ONREADYSTATECHANGE = 'onreadystatechange'
  , defer, channel, port;
var run = function(){
  var id = +this;
  if(queue.hasOwnProperty(id)){
    var fn = queue[id];
    delete queue[id];
    fn();
  }
};
var listner = function(event){
  run.call(event.data);
};
// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
if(!setTask || !clearTask){
  setTask = function setImmediate(fn){
    var args = [], i = 1;
    while(arguments.length > i)args.push(arguments[i++]);
    queue[++counter] = function(){
      invoke(typeof fn == 'function' ? fn : Function(fn), args);
    };
    defer(counter);
    return counter;
  };
  clearTask = function clearImmediate(id){
    delete queue[id];
  };
  // Node.js 0.8-
  if(require('./$.cof')(process) == 'process'){
    defer = function(id){
      process.nextTick(ctx(run, id, 1));
    };
  // Browsers with MessageChannel, includes WebWorkers
  } else if(MessageChannel){
    channel = new MessageChannel;
    port    = channel.port2;
    channel.port1.onmessage = listner;
    defer = ctx(port.postMessage, port, 1);
  // Browsers with postMessage, skip WebWorkers
  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
  } else if(global.addEventListener && typeof postMessage == 'function' && !global.importScripts){
    defer = function(id){
      global.postMessage(id + '', '*');
    };
    global.addEventListener('message', listner, false);
  // IE8-
  } else if(ONREADYSTATECHANGE in cel('script')){
    defer = function(id){
      html.appendChild(cel('script'))[ONREADYSTATECHANGE] = function(){
        html.removeChild(this);
        run.call(id);
      };
    };
  // Rest old browsers
  } else {
    defer = function(id){
      setTimeout(ctx(run, id, 1), 0);
    };
  }
}
module.exports = {
  set:   setTask,
  clear: clearTask
};
},{"./$.cof":42,"./$.ctx":44,"./$.dom-create":47,"./$.global":52,"./$.html":55,"./$.invoke":56}],85:[function(require,module,exports){
var toInteger = require('./$.to-integer')
  , max       = Math.max
  , min       = Math.min;
module.exports = function(index, length){
  index = toInteger(index);
  return index < 0 ? max(index + length, 0) : min(index, length);
};
},{"./$.to-integer":86}],86:[function(require,module,exports){
// 7.1.4 ToInteger
var ceil  = Math.ceil
  , floor = Math.floor;
module.exports = function(it){
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};
},{}],87:[function(require,module,exports){
// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = require('./$.iobject')
  , defined = require('./$.defined');
module.exports = function(it){
  return IObject(defined(it));
};
},{"./$.defined":45,"./$.iobject":57}],88:[function(require,module,exports){
// 7.1.15 ToLength
var toInteger = require('./$.to-integer')
  , min       = Math.min;
module.exports = function(it){
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};
},{"./$.to-integer":86}],89:[function(require,module,exports){
// 7.1.13 ToObject(argument)
var defined = require('./$.defined');
module.exports = function(it){
  return Object(defined(it));
};
},{"./$.defined":45}],90:[function(require,module,exports){
var id = 0
  , px = Math.random();
module.exports = function(key){
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};
},{}],91:[function(require,module,exports){
var store  = require('./$.shared')('wks')
  , uid    = require('./$.uid')
  , Symbol = require('./$.global').Symbol;
module.exports = function(name){
  return store[name] || (store[name] =
    Symbol && Symbol[name] || (Symbol || uid)('Symbol.' + name));
};
},{"./$.global":52,"./$.shared":79,"./$.uid":90}],92:[function(require,module,exports){
var classof   = require('./$.classof')
  , ITERATOR  = require('./$.wks')('iterator')
  , Iterators = require('./$.iterators');
module.exports = require('./$.core').getIteratorMethod = function(it){
  if(it != undefined)return it[ITERATOR]
    || it['@@iterator']
    || Iterators[classof(it)];
};
},{"./$.classof":41,"./$.core":43,"./$.iterators":67,"./$.wks":91}],93:[function(require,module,exports){
'use strict';
// 22.1.3.9 Array.prototype.findIndex(predicate, thisArg = undefined)
var $export = require('./$.export')
  , $find   = require('./$.array-methods')(6)
  , KEY     = 'findIndex'
  , forced  = true;
// Shouldn't skip holes
if(KEY in [])Array(1)[KEY](function(){ forced = false; });
$export($export.P + $export.F * forced, 'Array', {
  findIndex: function findIndex(callbackfn/*, that = undefined */){
    return $find(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});
require('./$.add-to-unscopables')(KEY);
},{"./$.add-to-unscopables":36,"./$.array-methods":39,"./$.export":48}],94:[function(require,module,exports){
'use strict';
// 22.1.3.8 Array.prototype.find(predicate, thisArg = undefined)
var $export = require('./$.export')
  , $find   = require('./$.array-methods')(5)
  , KEY     = 'find'
  , forced  = true;
// Shouldn't skip holes
if(KEY in [])Array(1)[KEY](function(){ forced = false; });
$export($export.P + $export.F * forced, 'Array', {
  find: function find(callbackfn/*, that = undefined */){
    return $find(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});
require('./$.add-to-unscopables')(KEY);
},{"./$.add-to-unscopables":36,"./$.array-methods":39,"./$.export":48}],95:[function(require,module,exports){
'use strict';
var ctx         = require('./$.ctx')
  , $export     = require('./$.export')
  , toObject    = require('./$.to-object')
  , call        = require('./$.iter-call')
  , isArrayIter = require('./$.is-array-iter')
  , toLength    = require('./$.to-length')
  , getIterFn   = require('./core.get-iterator-method');
$export($export.S + $export.F * !require('./$.iter-detect')(function(iter){ Array.from(iter); }), 'Array', {
  // 22.1.2.1 Array.from(arrayLike, mapfn = undefined, thisArg = undefined)
  from: function from(arrayLike/*, mapfn = undefined, thisArg = undefined*/){
    var O       = toObject(arrayLike)
      , C       = typeof this == 'function' ? this : Array
      , $$      = arguments
      , $$len   = $$.length
      , mapfn   = $$len > 1 ? $$[1] : undefined
      , mapping = mapfn !== undefined
      , index   = 0
      , iterFn  = getIterFn(O)
      , length, result, step, iterator;
    if(mapping)mapfn = ctx(mapfn, $$len > 2 ? $$[2] : undefined, 2);
    // if object isn't iterable or it's array with default iterator - use simple case
    if(iterFn != undefined && !(C == Array && isArrayIter(iterFn))){
      for(iterator = iterFn.call(O), result = new C; !(step = iterator.next()).done; index++){
        result[index] = mapping ? call(iterator, mapfn, [step.value, index], true) : step.value;
      }
    } else {
      length = toLength(O.length);
      for(result = new C(length); length > index; index++){
        result[index] = mapping ? mapfn(O[index], index) : O[index];
      }
    }
    result.length = index;
    return result;
  }
});

},{"./$.ctx":44,"./$.export":48,"./$.is-array-iter":58,"./$.iter-call":62,"./$.iter-detect":65,"./$.to-length":88,"./$.to-object":89,"./core.get-iterator-method":92}],96:[function(require,module,exports){
'use strict';
var addToUnscopables = require('./$.add-to-unscopables')
  , step             = require('./$.iter-step')
  , Iterators        = require('./$.iterators')
  , toIObject        = require('./$.to-iobject');

// 22.1.3.4 Array.prototype.entries()
// 22.1.3.13 Array.prototype.keys()
// 22.1.3.29 Array.prototype.values()
// 22.1.3.30 Array.prototype[@@iterator]()
module.exports = require('./$.iter-define')(Array, 'Array', function(iterated, kind){
  this._t = toIObject(iterated); // target
  this._i = 0;                   // next index
  this._k = kind;                // kind
// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
}, function(){
  var O     = this._t
    , kind  = this._k
    , index = this._i++;
  if(!O || index >= O.length){
    this._t = undefined;
    return step(1);
  }
  if(kind == 'keys'  )return step(0, index);
  if(kind == 'values')return step(0, O[index]);
  return step(0, [index, O[index]]);
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
Iterators.Arguments = Iterators.Array;

addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');
},{"./$.add-to-unscopables":36,"./$.iter-define":64,"./$.iter-step":66,"./$.iterators":67,"./$.to-iobject":87}],97:[function(require,module,exports){
// 19.1.3.1 Object.assign(target, source)
var $export = require('./$.export');

$export($export.S + $export.F, 'Object', {assign: require('./$.object-assign')});
},{"./$.export":48,"./$.object-assign":71}],98:[function(require,module,exports){
'use strict';
// 19.1.3.6 Object.prototype.toString()
var classof = require('./$.classof')
  , test    = {};
test[require('./$.wks')('toStringTag')] = 'z';
if(test + '' != '[object z]'){
  require('./$.redefine')(Object.prototype, 'toString', function toString(){
    return '[object ' + classof(this) + ']';
  }, true);
}
},{"./$.classof":41,"./$.redefine":74,"./$.wks":91}],99:[function(require,module,exports){
'use strict';
var $          = require('./$')
  , LIBRARY    = require('./$.library')
  , global     = require('./$.global')
  , ctx        = require('./$.ctx')
  , classof    = require('./$.classof')
  , $export    = require('./$.export')
  , isObject   = require('./$.is-object')
  , anObject   = require('./$.an-object')
  , aFunction  = require('./$.a-function')
  , strictNew  = require('./$.strict-new')
  , forOf      = require('./$.for-of')
  , setProto   = require('./$.set-proto').set
  , same       = require('./$.same-value')
  , SPECIES    = require('./$.wks')('species')
  , speciesConstructor = require('./$.species-constructor')
  , asap       = require('./$.microtask')
  , PROMISE    = 'Promise'
  , process    = global.process
  , isNode     = classof(process) == 'process'
  , P          = global[PROMISE]
  , empty      = function(){ /* empty */ }
  , Wrapper;

var testResolve = function(sub){
  var test = new P(empty), promise;
  if(sub)test.constructor = function(exec){
    exec(empty, empty);
  };
  (promise = P.resolve(test))['catch'](empty);
  return promise === test;
};

var USE_NATIVE = function(){
  var works = false;
  function P2(x){
    var self = new P(x);
    setProto(self, P2.prototype);
    return self;
  }
  try {
    works = P && P.resolve && testResolve();
    setProto(P2, P);
    P2.prototype = $.create(P.prototype, {constructor: {value: P2}});
    // actual Firefox has broken subclass support, test that
    if(!(P2.resolve(5).then(function(){}) instanceof P2)){
      works = false;
    }
    // actual V8 bug, https://code.google.com/p/v8/issues/detail?id=4162
    if(works && require('./$.descriptors')){
      var thenableThenGotten = false;
      P.resolve($.setDesc({}, 'then', {
        get: function(){ thenableThenGotten = true; }
      }));
      works = thenableThenGotten;
    }
  } catch(e){ works = false; }
  return works;
}();

// helpers
var sameConstructor = function(a, b){
  // library wrapper special case
  if(LIBRARY && a === P && b === Wrapper)return true;
  return same(a, b);
};
var getConstructor = function(C){
  var S = anObject(C)[SPECIES];
  return S != undefined ? S : C;
};
var isThenable = function(it){
  var then;
  return isObject(it) && typeof (then = it.then) == 'function' ? then : false;
};
var PromiseCapability = function(C){
  var resolve, reject;
  this.promise = new C(function($$resolve, $$reject){
    if(resolve !== undefined || reject !== undefined)throw TypeError('Bad Promise constructor');
    resolve = $$resolve;
    reject  = $$reject;
  });
  this.resolve = aFunction(resolve),
  this.reject  = aFunction(reject)
};
var perform = function(exec){
  try {
    exec();
  } catch(e){
    return {error: e};
  }
};
var notify = function(record, isReject){
  if(record.n)return;
  record.n = true;
  var chain = record.c;
  asap(function(){
    var value = record.v
      , ok    = record.s == 1
      , i     = 0;
    var run = function(reaction){
      var handler = ok ? reaction.ok : reaction.fail
        , resolve = reaction.resolve
        , reject  = reaction.reject
        , result, then;
      try {
        if(handler){
          if(!ok)record.h = true;
          result = handler === true ? value : handler(value);
          if(result === reaction.promise){
            reject(TypeError('Promise-chain cycle'));
          } else if(then = isThenable(result)){
            then.call(result, resolve, reject);
          } else resolve(result);
        } else reject(value);
      } catch(e){
        reject(e);
      }
    };
    while(chain.length > i)run(chain[i++]); // variable length - can't use forEach
    chain.length = 0;
    record.n = false;
    if(isReject)setTimeout(function(){
      var promise = record.p
        , handler, console;
      if(isUnhandled(promise)){
        if(isNode){
          process.emit('unhandledRejection', value, promise);
        } else if(handler = global.onunhandledrejection){
          handler({promise: promise, reason: value});
        } else if((console = global.console) && console.error){
          console.error('Unhandled promise rejection', value);
        }
      } record.a = undefined;
    }, 1);
  });
};
var isUnhandled = function(promise){
  var record = promise._d
    , chain  = record.a || record.c
    , i      = 0
    , reaction;
  if(record.h)return false;
  while(chain.length > i){
    reaction = chain[i++];
    if(reaction.fail || !isUnhandled(reaction.promise))return false;
  } return true;
};
var $reject = function(value){
  var record = this;
  if(record.d)return;
  record.d = true;
  record = record.r || record; // unwrap
  record.v = value;
  record.s = 2;
  record.a = record.c.slice();
  notify(record, true);
};
var $resolve = function(value){
  var record = this
    , then;
  if(record.d)return;
  record.d = true;
  record = record.r || record; // unwrap
  try {
    if(record.p === value)throw TypeError("Promise can't be resolved itself");
    if(then = isThenable(value)){
      asap(function(){
        var wrapper = {r: record, d: false}; // wrap
        try {
          then.call(value, ctx($resolve, wrapper, 1), ctx($reject, wrapper, 1));
        } catch(e){
          $reject.call(wrapper, e);
        }
      });
    } else {
      record.v = value;
      record.s = 1;
      notify(record, false);
    }
  } catch(e){
    $reject.call({r: record, d: false}, e); // wrap
  }
};

// constructor polyfill
if(!USE_NATIVE){
  // 25.4.3.1 Promise(executor)
  P = function Promise(executor){
    aFunction(executor);
    var record = this._d = {
      p: strictNew(this, P, PROMISE),         // <- promise
      c: [],                                  // <- awaiting reactions
      a: undefined,                           // <- checked in isUnhandled reactions
      s: 0,                                   // <- state
      d: false,                               // <- done
      v: undefined,                           // <- value
      h: false,                               // <- handled rejection
      n: false                                // <- notify
    };
    try {
      executor(ctx($resolve, record, 1), ctx($reject, record, 1));
    } catch(err){
      $reject.call(record, err);
    }
  };
  require('./$.redefine-all')(P.prototype, {
    // 25.4.5.3 Promise.prototype.then(onFulfilled, onRejected)
    then: function then(onFulfilled, onRejected){
      var reaction = new PromiseCapability(speciesConstructor(this, P))
        , promise  = reaction.promise
        , record   = this._d;
      reaction.ok   = typeof onFulfilled == 'function' ? onFulfilled : true;
      reaction.fail = typeof onRejected == 'function' && onRejected;
      record.c.push(reaction);
      if(record.a)record.a.push(reaction);
      if(record.s)notify(record, false);
      return promise;
    },
    // 25.4.5.1 Promise.prototype.catch(onRejected)
    'catch': function(onRejected){
      return this.then(undefined, onRejected);
    }
  });
}

$export($export.G + $export.W + $export.F * !USE_NATIVE, {Promise: P});
require('./$.set-to-string-tag')(P, PROMISE);
require('./$.set-species')(PROMISE);
Wrapper = require('./$.core')[PROMISE];

// statics
$export($export.S + $export.F * !USE_NATIVE, PROMISE, {
  // 25.4.4.5 Promise.reject(r)
  reject: function reject(r){
    var capability = new PromiseCapability(this)
      , $$reject   = capability.reject;
    $$reject(r);
    return capability.promise;
  }
});
$export($export.S + $export.F * (!USE_NATIVE || testResolve(true)), PROMISE, {
  // 25.4.4.6 Promise.resolve(x)
  resolve: function resolve(x){
    // instanceof instead of internal slot check because we should fix it without replacement native Promise core
    if(x instanceof P && sameConstructor(x.constructor, this))return x;
    var capability = new PromiseCapability(this)
      , $$resolve  = capability.resolve;
    $$resolve(x);
    return capability.promise;
  }
});
$export($export.S + $export.F * !(USE_NATIVE && require('./$.iter-detect')(function(iter){
  P.all(iter)['catch'](function(){});
})), PROMISE, {
  // 25.4.4.1 Promise.all(iterable)
  all: function all(iterable){
    var C          = getConstructor(this)
      , capability = new PromiseCapability(C)
      , resolve    = capability.resolve
      , reject     = capability.reject
      , values     = [];
    var abrupt = perform(function(){
      forOf(iterable, false, values.push, values);
      var remaining = values.length
        , results   = Array(remaining);
      if(remaining)$.each.call(values, function(promise, index){
        var alreadyCalled = false;
        C.resolve(promise).then(function(value){
          if(alreadyCalled)return;
          alreadyCalled = true;
          results[index] = value;
          --remaining || resolve(results);
        }, reject);
      });
      else resolve(results);
    });
    if(abrupt)reject(abrupt.error);
    return capability.promise;
  },
  // 25.4.4.4 Promise.race(iterable)
  race: function race(iterable){
    var C          = getConstructor(this)
      , capability = new PromiseCapability(C)
      , reject     = capability.reject;
    var abrupt = perform(function(){
      forOf(iterable, false, function(promise){
        C.resolve(promise).then(capability.resolve, reject);
      });
    });
    if(abrupt)reject(abrupt.error);
    return capability.promise;
  }
});
},{"./$":68,"./$.a-function":35,"./$.an-object":37,"./$.classof":41,"./$.core":43,"./$.ctx":44,"./$.descriptors":46,"./$.export":48,"./$.for-of":51,"./$.global":52,"./$.is-object":60,"./$.iter-detect":65,"./$.library":69,"./$.microtask":70,"./$.redefine-all":73,"./$.same-value":75,"./$.set-proto":76,"./$.set-species":77,"./$.set-to-string-tag":78,"./$.species-constructor":80,"./$.strict-new":81,"./$.wks":91}],100:[function(require,module,exports){
'use strict';
var $at  = require('./$.string-at')(true);

// 21.1.3.27 String.prototype[@@iterator]()
require('./$.iter-define')(String, 'String', function(iterated){
  this._t = String(iterated); // target
  this._i = 0;                // next index
// 21.1.5.2.1 %StringIteratorPrototype%.next()
}, function(){
  var O     = this._t
    , index = this._i
    , point;
  if(index >= O.length)return {value: undefined, done: true};
  point = $at(O, index);
  this._i += point.length;
  return {value: point, done: false};
});
},{"./$.iter-define":64,"./$.string-at":82}],101:[function(require,module,exports){
// 21.1.3.18 String.prototype.startsWith(searchString [, position ])
'use strict';
var $export     = require('./$.export')
  , toLength    = require('./$.to-length')
  , context     = require('./$.string-context')
  , STARTS_WITH = 'startsWith'
  , $startsWith = ''[STARTS_WITH];

$export($export.P + $export.F * require('./$.fails-is-regexp')(STARTS_WITH), 'String', {
  startsWith: function startsWith(searchString /*, position = 0 */){
    var that   = context(this, searchString, STARTS_WITH)
      , $$     = arguments
      , index  = toLength(Math.min($$.length > 1 ? $$[1] : undefined, that.length))
      , search = String(searchString);
    return $startsWith
      ? $startsWith.call(that, search, index)
      : that.slice(index, index + search.length) === search;
  }
});
},{"./$.export":48,"./$.fails-is-regexp":49,"./$.string-context":83,"./$.to-length":88}],102:[function(require,module,exports){
'use strict';
var $export   = require('./$.export')
  , $includes = require('./$.array-includes')(true);

$export($export.P, 'Array', {
  // https://github.com/domenic/Array.prototype.includes
  includes: function includes(el /*, fromIndex = 0 */){
    return $includes(this, el, arguments.length > 1 ? arguments[1] : undefined);
  }
});

require('./$.add-to-unscopables')('includes');
},{"./$.add-to-unscopables":36,"./$.array-includes":38,"./$.export":48}],103:[function(require,module,exports){
require('./es6.array.iterator');
var global      = require('./$.global')
  , hide        = require('./$.hide')
  , Iterators   = require('./$.iterators')
  , ITERATOR    = require('./$.wks')('iterator')
  , NL          = global.NodeList
  , HTC         = global.HTMLCollection
  , NLProto     = NL && NL.prototype
  , HTCProto    = HTC && HTC.prototype
  , ArrayValues = Iterators.NodeList = Iterators.HTMLCollection = Iterators.Array;
if(NLProto && !NLProto[ITERATOR])hide(NLProto, ITERATOR, ArrayValues);
if(HTCProto && !HTCProto[ITERATOR])hide(HTCProto, ITERATOR, ArrayValues);
},{"./$.global":52,"./$.hide":54,"./$.iterators":67,"./$.wks":91,"./es6.array.iterator":96}],104:[function(require,module,exports){
// element-closest | CC0-1.0 | github.com/jonathantneal/closest

(function (ElementProto) {
	if (typeof ElementProto.matches !== 'function') {
		ElementProto.matches = ElementProto.msMatchesSelector || ElementProto.mozMatchesSelector || ElementProto.webkitMatchesSelector || function matches(selector) {
			var element = this;
			var elements = (element.document || element.ownerDocument).querySelectorAll(selector);
			var index = 0;

			while (elements[index] && elements[index] !== element) {
				++index;
			}

			return Boolean(elements[index]);
		};
	}

	if (typeof ElementProto.closest !== 'function') {
		ElementProto.closest = function closest(selector) {
			var element = this;

			while (element && element.nodeType === 1) {
				if (element.matches(selector)) {
					return element;
				}

				element = element.parentNode;
			}

			return null;
		};
	}
})(window.Element.prototype);

},{}],105:[function(require,module,exports){
'use strict';

function elementDatasetPolyfill() {
	if (!document.documentElement.dataset && (!Object.getOwnPropertyDescriptor(Element.prototype, 'dataset') || !Object.getOwnPropertyDescriptor(Element.prototype, 'dataset').get)) {
		var descriptor = {};

		descriptor.enumerable = true;

		descriptor.get = function () {
			var element = this;
			var map = {};
			var attributes = this.attributes;

			function toUpperCase(n0) {
				return n0.charAt(1).toUpperCase();
			}

			function getter() {
				return this.value;
			}

			function setter(name, value) {
				if (typeof value !== 'undefined') {
					this.setAttribute(name, value);
				} else {
					this.removeAttribute(name);
				}
			}

			for (var i = 0; i < attributes.length; i++) {
				var attribute = attributes[i];

				// This test really should allow any XML Name without
				// colons (and non-uppercase for XHTML)

				if (attribute && attribute.name && /^data-\w[\w\-]*$/.test(attribute.name)) {
					var name = attribute.name;
					var value = attribute.value;

					// Change to CamelCase

					var propName = name.substr(5).replace(/-./g, toUpperCase);

					Object.defineProperty(map, propName, {
						enumerable: this.enumerable,
						get: getter.bind({ value: value || '' }),
						set: setter.bind(element, name)
					});
				}
			}
			return map;
		};

		Object.defineProperty(Element.prototype, 'dataset', descriptor);
	}
}

module.exports = elementDatasetPolyfill;
},{}],106:[function(require,module,exports){
/*!
 * escape-html
 * Copyright(c) 2012-2013 TJ Holowaychuk
 * Copyright(c) 2015 Andreas Lubbe
 * Copyright(c) 2015 Tiancheng "Timothy" Gu
 * MIT Licensed
 */

'use strict';

/**
 * Module variables.
 * @private
 */

var matchHtmlRegExp = /["'&<>]/;

/**
 * Module exports.
 * @public
 */

module.exports = escapeHtml;

/**
 * Escape special characters in the given string of html.
 *
 * @param  {string} string The string to escape for inserting into HTML
 * @return {string}
 * @public
 */

function escapeHtml(string) {
  var str = '' + string;
  var match = matchHtmlRegExp.exec(str);

  if (!match) {
    return str;
  }

  var escape;
  var html = '';
  var index = 0;
  var lastIndex = 0;

  for (index = match.index; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34: // "
        escape = '&quot;';
        break;
      case 38: // &
        escape = '&amp;';
        break;
      case 39: // '
        escape = '&#39;';
        break;
      case 60: // <
        escape = '&lt;';
        break;
      case 62: // >
        escape = '&gt;';
        break;
      default:
        continue;
    }

    if (lastIndex !== index) {
      html += str.substring(lastIndex, index);
    }

    lastIndex = index + 1;
    html += escape;
  }

  return lastIndex !== index
    ? html + str.substring(lastIndex, index)
    : html;
}

},{}],107:[function(require,module,exports){
// URL Polyfill
// Draft specification: https://url.spec.whatwg.org

// Notes:
// - Primarily useful for parsing URLs and modifying query parameters
// - Should work in IE8+ and everything more modern, with es5.js polyfills

(function (global) {
  'use strict';

  function isSequence(o) {
    if (!o) return false;
    if ('Symbol' in global && 'iterator' in global.Symbol &&
        typeof o[Symbol.iterator] === 'function') return true;
    if (Array.isArray(o)) return true;
    return false;
  }

  function toArray(iter) {
    return ('from' in Array) ? Array.from(iter) : Array.prototype.slice.call(iter);
  }

  (function() {

    // Browsers may have:
    // * No global URL object
    // * URL with static methods only - may have a dummy constructor
    // * URL with members except searchParams
    // * Full URL API support
    var origURL = global.URL;
    var nativeURL;
    try {
      if (origURL) {
        nativeURL = new global.URL('http://example.com');
        if ('searchParams' in nativeURL)
          return;
        if (!('href' in nativeURL))
          nativeURL = undefined;
      }
    } catch (_) {}

    // NOTE: Doesn't do the encoding/decoding dance
    function urlencoded_serialize(pairs) {
      var output = '', first = true;
      pairs.forEach(function (pair) {
        var name = encodeURIComponent(pair.name);
        var value = encodeURIComponent(pair.value);
        if (!first) output += '&';
        output += name + '=' + value;
        first = false;
      });
      return output.replace(/%20/g, '+');
    }

    // NOTE: Doesn't do the encoding/decoding dance
    function urlencoded_parse(input, isindex) {
      var sequences = input.split('&');
      if (isindex && sequences[0].indexOf('=') === -1)
        sequences[0] = '=' + sequences[0];
      var pairs = [];
      sequences.forEach(function (bytes) {
        if (bytes.length === 0) return;
        var index = bytes.indexOf('=');
        if (index !== -1) {
          var name = bytes.substring(0, index);
          var value = bytes.substring(index + 1);
        } else {
          name = bytes;
          value = '';
        }
        name = name.replace(/\+/g, ' ');
        value = value.replace(/\+/g, ' ');
        pairs.push({ name: name, value: value });
      });
      var output = [];
      pairs.forEach(function (pair) {
        output.push({
          name: decodeURIComponent(pair.name),
          value: decodeURIComponent(pair.value)
        });
      });
      return output;
    }

    function URLUtils(url) {
      if (nativeURL)
        return new origURL(url);
      var anchor = document.createElement('a');
      anchor.href = url;
      return anchor;
    }

    function URLSearchParams(init) {
      var $this = this;
      this._list = [];

      if (init === undefined || init === null) {
        // no-op
      } else if (init instanceof URLSearchParams) {
        // In ES6 init would be a sequence, but special case for ES5.
        this._list = urlencoded_parse(String(init));
      } else if (typeof init === 'object' && isSequence(init)) {
        toArray(init).forEach(function(e) {
          if (!isSequence(e)) throw TypeError();
          var nv = toArray(e);
          if (nv.length !== 2) throw TypeError();
          $this._list.push({name: String(nv[0]), value: String(nv[1])});
        });
      } else if (typeof init === 'object' && init) {
        Object.keys(init).forEach(function(key) {
          $this._list.push({name: String(key), value: String(init[key])});
        });
      } else {
        init = String(init);
        if (init.substring(0, 1) === '?')
          init = init.substring(1);
        this._list = urlencoded_parse(init);
      }

      this._url_object = null;
      this._setList = function (list) { if (!updating) $this._list = list; };

      var updating = false;
      this._update_steps = function() {
        if (updating) return;
        updating = true;

        if (!$this._url_object) return;

        // Partial workaround for IE issue with 'about:'
        if ($this._url_object.protocol === 'about:' &&
            $this._url_object.pathname.indexOf('?') !== -1) {
          $this._url_object.pathname = $this._url_object.pathname.split('?')[0];
        }

        $this._url_object.search = urlencoded_serialize($this._list);

        updating = false;
      };
    }


    Object.defineProperties(URLSearchParams.prototype, {
      append: {
        value: function (name, value) {
          this._list.push({ name: name, value: value });
          this._update_steps();
        }, writable: true, enumerable: true, configurable: true
      },

      'delete': {
        value: function (name) {
          for (var i = 0; i < this._list.length;) {
            if (this._list[i].name === name)
              this._list.splice(i, 1);
            else
              ++i;
          }
          this._update_steps();
        }, writable: true, enumerable: true, configurable: true
      },

      get: {
        value: function (name) {
          for (var i = 0; i < this._list.length; ++i) {
            if (this._list[i].name === name)
              return this._list[i].value;
          }
          return null;
        }, writable: true, enumerable: true, configurable: true
      },

      getAll: {
        value: function (name) {
          var result = [];
          for (var i = 0; i < this._list.length; ++i) {
            if (this._list[i].name === name)
              result.push(this._list[i].value);
          }
          return result;
        }, writable: true, enumerable: true, configurable: true
      },

      has: {
        value: function (name) {
          for (var i = 0; i < this._list.length; ++i) {
            if (this._list[i].name === name)
              return true;
          }
          return false;
        }, writable: true, enumerable: true, configurable: true
      },

      set: {
        value: function (name, value) {
          var found = false;
          for (var i = 0; i < this._list.length;) {
            if (this._list[i].name === name) {
              if (!found) {
                this._list[i].value = value;
                found = true;
                ++i;
              } else {
                this._list.splice(i, 1);
              }
            } else {
              ++i;
            }
          }

          if (!found)
            this._list.push({ name: name, value: value });

          this._update_steps();
        }, writable: true, enumerable: true, configurable: true
      },

      entries: {
        value: function() { return new Iterator(this._list, 'key+value'); },
        writable: true, enumerable: true, configurable: true
      },

      keys: {
        value: function() { return new Iterator(this._list, 'key'); },
        writable: true, enumerable: true, configurable: true
      },

      values: {
        value: function() { return new Iterator(this._list, 'value'); },
        writable: true, enumerable: true, configurable: true
      },

      forEach: {
        value: function(callback) {
          var thisArg = (arguments.length > 1) ? arguments[1] : undefined;
          this._list.forEach(function(pair, index) {
            callback.call(thisArg, pair.value, pair.name);
          });

        }, writable: true, enumerable: true, configurable: true
      },

      toString: {
        value: function () {
          return urlencoded_serialize(this._list);
        }, writable: true, enumerable: false, configurable: true
      }
    });

    function Iterator(source, kind) {
      var index = 0;
      this['next'] = function() {
        if (index >= source.length)
          return {done: true, value: undefined};
        var pair = source[index++];
        return {done: false, value:
                kind === 'key' ? pair.name :
                kind === 'value' ? pair.value :
                [pair.name, pair.value]};
      };
    }

    if ('Symbol' in global && 'iterator' in global.Symbol) {
      Object.defineProperty(URLSearchParams.prototype, global.Symbol.iterator, {
        value: URLSearchParams.prototype.entries,
        writable: true, enumerable: true, configurable: true});
      Object.defineProperty(Iterator.prototype, global.Symbol.iterator, {
        value: function() { return this; },
        writable: true, enumerable: true, configurable: true});
    }

    function URL(url, base) {
      if (!(this instanceof global.URL))
        throw new TypeError("Failed to construct 'URL': Please use the 'new' operator.");

      if (base) {
        url = (function () {
          if (nativeURL) return new origURL(url, base).href;

          var doc;
          // Use another document/base tag/anchor for relative URL resolution, if possible
          if (document.implementation && document.implementation.createHTMLDocument) {
            doc = document.implementation.createHTMLDocument('');
          } else if (document.implementation && document.implementation.createDocument) {
            doc = document.implementation.createDocument('http://www.w3.org/1999/xhtml', 'html', null);
            doc.documentElement.appendChild(doc.createElement('head'));
            doc.documentElement.appendChild(doc.createElement('body'));
          } else if (window.ActiveXObject) {
            doc = new window.ActiveXObject('htmlfile');
            doc.write('<head><\/head><body><\/body>');
            doc.close();
          }

          if (!doc) throw Error('base not supported');

          var baseTag = doc.createElement('base');
          baseTag.href = base;
          doc.getElementsByTagName('head')[0].appendChild(baseTag);
          var anchor = doc.createElement('a');
          anchor.href = url;
          return anchor.href;
        }());
      }

      // An inner object implementing URLUtils (either a native URL
      // object or an HTMLAnchorElement instance) is used to perform the
      // URL algorithms. With full ES5 getter/setter support, return a
      // regular object For IE8's limited getter/setter support, a
      // different HTMLAnchorElement is returned with properties
      // overridden

      var instance = URLUtils(url || '');

      // Detect for ES5 getter/setter support
      // (an Object.defineProperties polyfill that doesn't support getters/setters may throw)
      var ES5_GET_SET = (function() {
        if (!('defineProperties' in Object)) return false;
        try {
          var obj = {};
          Object.defineProperties(obj, { prop: { 'get': function () { return true; } } });
          return obj.prop;
        } catch (_) {
          return false;
        }
      })();

      var self = ES5_GET_SET ? this : document.createElement('a');



      var query_object = new URLSearchParams(
        instance.search ? instance.search.substring(1) : null);
      query_object._url_object = self;

      Object.defineProperties(self, {
        href: {
          get: function () { return instance.href; },
          set: function (v) { instance.href = v; tidy_instance(); update_steps(); },
          enumerable: true, configurable: true
        },
        origin: {
          get: function () {
            if ('origin' in instance) return instance.origin;
            return this.protocol + '//' + this.host;
          },
          enumerable: true, configurable: true
        },
        protocol: {
          get: function () { return instance.protocol; },
          set: function (v) { instance.protocol = v; },
          enumerable: true, configurable: true
        },
        username: {
          get: function () { return instance.username; },
          set: function (v) { instance.username = v; },
          enumerable: true, configurable: true
        },
        password: {
          get: function () { return instance.password; },
          set: function (v) { instance.password = v; },
          enumerable: true, configurable: true
        },
        host: {
          get: function () {
            // IE returns default port in |host|
            var re = {'http:': /:80$/, 'https:': /:443$/, 'ftp:': /:21$/}[instance.protocol];
            return re ? instance.host.replace(re, '') : instance.host;
          },
          set: function (v) { instance.host = v; },
          enumerable: true, configurable: true
        },
        hostname: {
          get: function () { return instance.hostname; },
          set: function (v) { instance.hostname = v; },
          enumerable: true, configurable: true
        },
        port: {
          get: function () { return instance.port; },
          set: function (v) { instance.port = v; },
          enumerable: true, configurable: true
        },
        pathname: {
          get: function () {
            // IE does not include leading '/' in |pathname|
            if (instance.pathname.charAt(0) !== '/') return '/' + instance.pathname;
            return instance.pathname;
          },
          set: function (v) { instance.pathname = v; },
          enumerable: true, configurable: true
        },
        search: {
          get: function () { return instance.search; },
          set: function (v) {
            if (instance.search === v) return;
            instance.search = v; tidy_instance(); update_steps();
          },
          enumerable: true, configurable: true
        },
        searchParams: {
          get: function () { return query_object; },
          enumerable: true, configurable: true
        },
        hash: {
          get: function () { return instance.hash; },
          set: function (v) { instance.hash = v; tidy_instance(); },
          enumerable: true, configurable: true
        },
        toString: {
          value: function() { return instance.toString(); },
          enumerable: false, configurable: true
        },
        valueOf: {
          value: function() { return instance.valueOf(); },
          enumerable: false, configurable: true
        }
      });

      function tidy_instance() {
        var href = instance.href.replace(/#$|\?$|\?(?=#)/g, '');
        if (instance.href !== href)
          instance.href = href;
      }

      function update_steps() {
        query_object._setList(instance.search ? urlencoded_parse(instance.search.substring(1)) : []);
        query_object._update_steps();
      };

      return self;
    }

    if (origURL) {
      for (var i in origURL) {
        if (origURL.hasOwnProperty(i) && typeof origURL[i] === 'function')
          URL[i] = origURL[i];
      }
    }

    global.URL = URL;
    global.URLSearchParams = URLSearchParams;
  }());

  // Patch native URLSearchParams constructor to handle sequences/records
  // if necessary.
  (function() {
    if (new global.URLSearchParams([['a', 1]]).get('a') === '1' &&
        new global.URLSearchParams({a: 1}).get('a') === '1')
      return;
    var orig = global.URLSearchParams;
    global.URLSearchParams = function(init) {
      if (init && typeof init === 'object' && isSequence(init)) {
        var o = new orig();
        toArray(init).forEach(function(e) {
          if (!isSequence(e)) throw TypeError();
          var nv = toArray(e);
          if (nv.length !== 2) throw TypeError();
          o.append(nv[0], nv[1]);
        });
        return o;
      } else if (init && typeof init === 'object') {
        o = new orig();
        Object.keys(init).forEach(function(key) {
          o.set(key, init[key]);
        });
        return o;
      } else {
        return new orig(init);
      }
    };
  }());

}(self));

},{}],108:[function(require,module,exports){
/* global define, KeyboardEvent, module */

(function () {

  var keyboardeventKeyPolyfill = {
    polyfill: polyfill,
    keys: {
      3: 'Cancel',
      6: 'Help',
      8: 'Backspace',
      9: 'Tab',
      12: 'Clear',
      13: 'Enter',
      16: 'Shift',
      17: 'Control',
      18: 'Alt',
      19: 'Pause',
      20: 'CapsLock',
      27: 'Escape',
      28: 'Convert',
      29: 'NonConvert',
      30: 'Accept',
      31: 'ModeChange',
      32: ' ',
      33: 'PageUp',
      34: 'PageDown',
      35: 'End',
      36: 'Home',
      37: 'ArrowLeft',
      38: 'ArrowUp',
      39: 'ArrowRight',
      40: 'ArrowDown',
      41: 'Select',
      42: 'Print',
      43: 'Execute',
      44: 'PrintScreen',
      45: 'Insert',
      46: 'Delete',
      48: ['0', ')'],
      49: ['1', '!'],
      50: ['2', '@'],
      51: ['3', '#'],
      52: ['4', '$'],
      53: ['5', '%'],
      54: ['6', '^'],
      55: ['7', '&'],
      56: ['8', '*'],
      57: ['9', '('],
      91: 'OS',
      93: 'ContextMenu',
      144: 'NumLock',
      145: 'ScrollLock',
      181: 'VolumeMute',
      182: 'VolumeDown',
      183: 'VolumeUp',
      186: [';', ':'],
      187: ['=', '+'],
      188: [',', '<'],
      189: ['-', '_'],
      190: ['.', '>'],
      191: ['/', '?'],
      192: ['`', '~'],
      219: ['[', '{'],
      220: ['\\', '|'],
      221: [']', '}'],
      222: ["'", '"'],
      224: 'Meta',
      225: 'AltGraph',
      246: 'Attn',
      247: 'CrSel',
      248: 'ExSel',
      249: 'EraseEof',
      250: 'Play',
      251: 'ZoomOut'
    }
  };

  // Function keys (F1-24).
  var i;
  for (i = 1; i < 25; i++) {
    keyboardeventKeyPolyfill.keys[111 + i] = 'F' + i;
  }

  // Printable ASCII characters.
  var letter = '';
  for (i = 65; i < 91; i++) {
    letter = String.fromCharCode(i);
    keyboardeventKeyPolyfill.keys[i] = [letter.toLowerCase(), letter.toUpperCase()];
  }

  function polyfill () {
    if (!('KeyboardEvent' in window) ||
        'key' in KeyboardEvent.prototype) {
      return false;
    }

    // Polyfill `key` on `KeyboardEvent`.
    var proto = {
      get: function (x) {
        var key = keyboardeventKeyPolyfill.keys[this.which || this.keyCode];

        if (Array.isArray(key)) {
          key = key[+this.shiftKey];
        }

        return key;
      }
    };
    Object.defineProperty(KeyboardEvent.prototype, 'key', proto);
    return proto;
  }

  if (typeof define === 'function' && define.amd) {
    define('keyboardevent-key-polyfill', keyboardeventKeyPolyfill);
  } else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
    module.exports = keyboardeventKeyPolyfill;
  } else if (window) {
    window.keyboardeventKeyPolyfill = keyboardeventKeyPolyfill;
  }

})();

},{}],109:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],110:[function(require,module,exports){
(function (global){
var now = require('performance-now')
  , root = typeof window === 'undefined' ? global : window
  , vendors = ['moz', 'webkit']
  , suffix = 'AnimationFrame'
  , raf = root['request' + suffix]
  , caf = root['cancel' + suffix] || root['cancelRequest' + suffix]

for(var i = 0; !raf && i < vendors.length; i++) {
  raf = root[vendors[i] + 'Request' + suffix]
  caf = root[vendors[i] + 'Cancel' + suffix]
      || root[vendors[i] + 'CancelRequest' + suffix]
}

// Some versions of FF have rAF but not cAF
if(!raf || !caf) {
  var last = 0
    , id = 0
    , queue = []
    , frameDuration = 1000 / 60

  raf = function(callback) {
    if(queue.length === 0) {
      var _now = now()
        , next = Math.max(0, frameDuration - (_now - last))
      last = next + _now
      setTimeout(function() {
        var cp = queue.slice(0)
        // Clear queue here to prevent
        // callbacks from appending listeners
        // to the current frame's queue
        queue.length = 0
        for(var i = 0; i < cp.length; i++) {
          if(!cp[i].cancelled) {
            try{
              cp[i].callback(last)
            } catch(e) {
              setTimeout(function() { throw e }, 0)
            }
          }
        }
      }, Math.round(next))
    }
    queue.push({
      handle: ++id,
      callback: callback,
      cancelled: false
    })
    return id
  }

  caf = function(handle) {
    for(var i = 0; i < queue.length; i++) {
      if(queue[i].handle === handle) {
        queue[i].cancelled = true
      }
    }
  }
}

module.exports = function(fn) {
  // Wrap in a new function to prevent
  // `cancel` potentially being assigned
  // to the native rAF function
  return raf.call(root, fn)
}
module.exports.cancel = function() {
  caf.apply(root, arguments)
}
module.exports.polyfill = function() {
  root.requestAnimationFrame = raf
  root.cancelAnimationFrame = caf
}

}).call(this,typeof self !== "undefined" ? self : window)

},{"performance-now":111}],111:[function(require,module,exports){
(function (process){
// Generated by CoffeeScript 1.12.2
(function() {
  var getNanoSeconds, hrtime, loadTime, moduleLoadTime, nodeLoadTime, upTime;

  if ((typeof performance !== "undefined" && performance !== null) && performance.now) {
    module.exports = function() {
      return performance.now();
    };
  } else if ((typeof process !== "undefined" && process !== null) && process.hrtime) {
    module.exports = function() {
      return (getNanoSeconds() - nodeLoadTime) / 1e6;
    };
    hrtime = process.hrtime;
    getNanoSeconds = function() {
      var hr;
      hr = hrtime();
      return hr[0] * 1e9 + hr[1];
    };
    moduleLoadTime = getNanoSeconds();
    upTime = process.uptime() * 1e9;
    nodeLoadTime = moduleLoadTime - upTime;
  } else if (Date.now) {
    module.exports = function() {
      return Date.now() - loadTime;
    };
    loadTime = Date.now();
  } else {
    module.exports = function() {
      return new Date().getTime() - loadTime;
    };
    loadTime = new Date().getTime();
  }

}).call(this);



}).call(this,require('_process'))

},{"_process":109}],112:[function(require,module,exports){
var raf = require('raf'),
    COMPLETE = 'complete',
    CANCELED = 'canceled';

function setElementScroll(element, x, y){
    if(element === window){
        element.scrollTo(x, y);
    }else{
        element.scrollLeft = x;
        element.scrollTop = y;
    }
}

function getTargetScrollLocation(target, parent, align){
    var targetPosition = target.getBoundingClientRect(),
        parentPosition,
        x,
        y,
        differenceX,
        differenceY,
        targetWidth,
        targetHeight,
        leftAlign = align && align.left != null ? align.left : 0.5,
        topAlign = align && align.top != null ? align.top : 0.5,
        leftOffset = align && align.leftOffset != null ? align.leftOffset : 0,
        topOffset = align && align.topOffset != null ? align.topOffset : 0,
        leftScalar = leftAlign,
        topScalar = topAlign;

    if(parent === window){
        targetWidth = Math.min(targetPosition.width, window.innerWidth);
        targetHeight = Math.min(targetPosition.height, window.innerHeight);
        x = targetPosition.left + window.pageXOffset - window.innerWidth * leftScalar + targetWidth * leftScalar;
        y = targetPosition.top + window.pageYOffset - window.innerHeight * topScalar + targetHeight * topScalar;
        x = Math.max(Math.min(x, document.body.scrollWidth - window.innerWidth * leftScalar), 0);
        y = Math.max(Math.min(y, document.body.scrollHeight- window.innerHeight * topScalar), 0);
        x -= leftOffset;
        y -= topOffset;
        differenceX = x - window.pageXOffset;
        differenceY = y - window.pageYOffset;
    }else{
        targetWidth = targetPosition.width;
        targetHeight = targetPosition.height;
        parentPosition = parent.getBoundingClientRect();
        var offsetLeft = targetPosition.left - (parentPosition.left - parent.scrollLeft);
        var offsetTop = targetPosition.top - (parentPosition.top - parent.scrollTop);
        x = offsetLeft + (targetWidth * leftScalar) - parent.clientWidth * leftScalar;
        y = offsetTop + (targetHeight * topScalar) - parent.clientHeight * topScalar;
        x = Math.max(Math.min(x, parent.scrollWidth - parent.clientWidth), 0);
        y = Math.max(Math.min(y, parent.scrollHeight - parent.clientHeight), 0);
        x -= leftOffset;
        y -= topOffset;
        differenceX = x - parent.scrollLeft;
        differenceY = y - parent.scrollTop;
    }

    return {
        x: x,
        y: y,
        differenceX: differenceX,
        differenceY: differenceY
    };
}

function animate(parent){
    raf(function(){
        var scrollSettings = parent._scrollSettings;
        if(!scrollSettings){
            return;
        }

        var location = getTargetScrollLocation(scrollSettings.target, parent, scrollSettings.align),
            time = Date.now() - scrollSettings.startTime,
            timeValue = Math.min(1 / scrollSettings.time * time, 1);

        if(
            time > scrollSettings.time + 20
        ){
            setElementScroll(parent, location.x, location.y);
            parent._scrollSettings = null;
            return scrollSettings.end(COMPLETE);
        }

        var easeValue = 1 - scrollSettings.ease(timeValue);

        setElementScroll(parent,
            location.x - location.differenceX * easeValue,
            location.y - location.differenceY * easeValue
        );

        animate(parent);
    });
}
function transitionScrollTo(target, parent, settings, callback){
    var idle = !parent._scrollSettings,
        lastSettings = parent._scrollSettings,
        now = Date.now(),
        endHandler;

    if(lastSettings){
        lastSettings.end(CANCELED);
    }

    function end(endType){
        parent._scrollSettings = null;
        if(parent.parentElement && parent.parentElement._scrollSettings){
            parent.parentElement._scrollSettings.end(endType);
        }
        callback(endType);
        parent.removeEventListener('touchstart', endHandler);
    }

    parent._scrollSettings = {
        startTime: lastSettings ? lastSettings.startTime : Date.now(),
        target: target,
        time: settings.time + (lastSettings ? now - lastSettings.startTime : 0),
        ease: settings.ease,
        align: settings.align,
        end: end
    };

    endHandler = end.bind(null, CANCELED);
    parent.addEventListener('touchstart', endHandler);

    if(idle){
        animate(parent);
    }
}

function isScrollable(element){
    return (
        parent === window ||
        (
            element.scrollHeight !== element.clientHeight ||
            element.scrollWidth !== element.clientWidth
        ) &&
        getComputedStyle(element).overflow !== 'hidden'
    );
}

function defaultValidTarget(){
    return true;
}

module.exports = function(target, settings, callback){
    if(!target){
        return;
    }

    if(typeof settings === 'function'){
        callback = settings;
        settings = null;
    }

    if(!settings){
        settings = {};
    }

    settings.time = isNaN(settings.time) ? 1000 : settings.time;
    settings.ease = settings.ease || function(v){return 1 - Math.pow(1 - v, v / 2);};

    var parent = target.parentElement,
        parents = 0;

    function done(endType){
        parents--;
        if(!parents){
            callback && callback(endType);
        }
    }

    var validTarget = settings.validTarget || defaultValidTarget;

    while(parent){
        if(validTarget(parent, parents) && isScrollable(parent)){
            parents++;
            transitionScrollTo(target, parent, settings, done);
        }

        parent = parent.parentElement;

        if(!parent){
            return;
        }

        if(parent.tagName === 'BODY'){
            parent = window;
        }
    }
};

},{"raf":110}],113:[function(require,module,exports){
(function() {
  'use strict';

  if (self.fetch) {
    return
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name)
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value)
    }
    return value
  }

  function Headers(headers) {
    this.map = {}

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value)
      }, this)

    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name])
      }, this)
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name)
    value = normalizeValue(value)
    var list = this.map[name]
    if (!list) {
      list = []
      this.map[name] = list
    }
    list.push(value)
  }

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)]
  }

  Headers.prototype.get = function(name) {
    var values = this.map[normalizeName(name)]
    return values ? values[0] : null
  }

  Headers.prototype.getAll = function(name) {
    return this.map[normalizeName(name)] || []
  }

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  }

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = [normalizeValue(value)]
  }

  Headers.prototype.forEach = function(callback, thisArg) {
    Object.getOwnPropertyNames(this.map).forEach(function(name) {
      this.map[name].forEach(function(value) {
        callback.call(thisArg, value, name, this)
      }, this)
    }, this)
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result)
      }
      reader.onerror = function() {
        reject(reader.error)
      }
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader()
    reader.readAsArrayBuffer(blob)
    return fileReaderReady(reader)
  }

  function readBlobAsText(blob) {
    var reader = new FileReader()
    reader.readAsText(blob)
    return fileReaderReady(reader)
  }

  var support = {
    blob: 'FileReader' in self && 'Blob' in self && (function() {
      try {
        new Blob();
        return true
      } catch(e) {
        return false
      }
    })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  }

  function Body() {
    this.bodyUsed = false


    this._initBody = function(body) {
      this._bodyInit = body
      if (typeof body === 'string') {
        this._bodyText = body
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body
      } else if (!body) {
        this._bodyText = ''
      } else if (support.arrayBuffer && ArrayBuffer.prototype.isPrototypeOf(body)) {
        // Only support ArrayBuffers for POST method.
        // Receiving ArrayBuffers happens via Blobs, instead.
      } else {
        throw new Error('unsupported BodyInit type')
      }
    }

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      }

      this.arrayBuffer = function() {
        return this.blob().then(readBlobAsArrayBuffer)
      }

      this.text = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return readBlobAsText(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as text')
        } else {
          return Promise.resolve(this._bodyText)
        }
      }
    } else {
      this.text = function() {
        var rejected = consumed(this)
        return rejected ? rejected : Promise.resolve(this._bodyText)
      }
    }

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      }
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    }

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

  function normalizeMethod(method) {
    var upcased = method.toUpperCase()
    return (methods.indexOf(upcased) > -1) ? upcased : method
  }

  function Request(input, options) {
    options = options || {}
    var body = options.body
    if (Request.prototype.isPrototypeOf(input)) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url
      this.credentials = input.credentials
      if (!options.headers) {
        this.headers = new Headers(input.headers)
      }
      this.method = input.method
      this.mode = input.mode
      if (!body) {
        body = input._bodyInit
        input.bodyUsed = true
      }
    } else {
      this.url = input
    }

    this.credentials = options.credentials || this.credentials || 'omit'
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers)
    }
    this.method = normalizeMethod(options.method || this.method || 'GET')
    this.mode = options.mode || this.mode || null
    this.referrer = null

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body)
  }

  Request.prototype.clone = function() {
    return new Request(this)
  }

  function decode(body) {
    var form = new FormData()
    body.trim().split('&').forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=')
        var name = split.shift().replace(/\+/g, ' ')
        var value = split.join('=').replace(/\+/g, ' ')
        form.append(decodeURIComponent(name), decodeURIComponent(value))
      }
    })
    return form
  }

  function headers(xhr) {
    var head = new Headers()
    var pairs = xhr.getAllResponseHeaders().trim().split('\n')
    pairs.forEach(function(header) {
      var split = header.trim().split(':')
      var key = split.shift().trim()
      var value = split.join(':').trim()
      head.append(key, value)
    })
    return head
  }

  Body.call(Request.prototype)

  function Response(bodyInit, options) {
    if (!options) {
      options = {}
    }

    this._initBody(bodyInit)
    this.type = 'default'
    this.status = options.status
    this.ok = this.status >= 200 && this.status < 300
    this.statusText = options.statusText
    this.headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers)
    this.url = options.url || ''
  }

  Body.call(Response.prototype)

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  }

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''})
    response.type = 'error'
    return response
  }

  var redirectStatuses = [301, 302, 303, 307, 308]

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  }

  self.Headers = Headers;
  self.Request = Request;
  self.Response = Response;

  self.fetch = function(input, init) {
    return new Promise(function(resolve, reject) {
      var request
      if (Request.prototype.isPrototypeOf(input) && !init) {
        request = input
      } else {
        request = new Request(input, init)
      }

      var xhr = new XMLHttpRequest()

      function responseURL() {
        if ('responseURL' in xhr) {
          return xhr.responseURL
        }

        // Avoid security warnings on getResponseHeader when not allowed by CORS
        if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
          return xhr.getResponseHeader('X-Request-URL')
        }

        return;
      }

      xhr.onload = function() {
        var status = (xhr.status === 1223) ? 204 : xhr.status
        if (status < 100 || status > 599) {
          reject(new TypeError('Network request failed'))
          return
        }
        var options = {
          status: status,
          statusText: xhr.statusText,
          headers: headers(xhr),
          url: responseURL()
        }
        var body = 'response' in xhr ? xhr.response : xhr.responseText;
        resolve(new Response(body, options))
      }

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.open(request.method, request.url, true)

      if (request.credentials === 'include') {
        xhr.withCredentials = true
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob'
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value)
      })

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
    })
  }
  self.fetch.polyfill = true
})();

},{}]},{},[21])
//# sourceMappingURL=site.bundle.js.map
