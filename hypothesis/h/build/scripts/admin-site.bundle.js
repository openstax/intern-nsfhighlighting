(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

// configure error reporting

var settings = require('./base/settings')(document);
if (settings.raven) {
  require('./base/raven').init(settings.raven);
}

window.$ = window.jQuery = require('jquery');
require('bootstrap');

var AdminUsersController = require('./controllers/admin-users-controller');
var upgradeElements = require('./base/upgrade-elements');

var controllers = {
  '.js-users-delete-form': AdminUsersController
};

upgradeElements(document.body, controllers);

},{"./base/raven":3,"./base/settings":4,"./base/upgrade-elements":5,"./controllers/admin-users-controller":6,"bootstrap":"bootstrap","jquery":"jquery"}],2:[function(require,module,exports){
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

},{"../util/dom":7}],3:[function(require,module,exports){
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

},{"core-js/fn/object/assign":9,"raven-js":"raven-js"}],4:[function(require,module,exports){
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

},{"core-js/fn/object/assign":9}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Controller = require('../base/controller');

var AdminUsersController = function (_Controller) {
  _inherits(AdminUsersController, _Controller);

  function AdminUsersController(element, options) {
    _classCallCheck(this, AdminUsersController);

    var _this = _possibleConstructorReturn(this, (AdminUsersController.__proto__ || Object.getPrototypeOf(AdminUsersController)).call(this, element, options));

    var window_ = options.window || window;
    function confirmFormSubmit() {
      return window_.confirm('This will permanently delete all the user\'s data. Are you sure?');
    }

    _this.on('submit', function (event) {
      if (!confirmFormSubmit()) {
        event.preventDefault();
      }
    });
    return _this;
  }

  return AdminUsersController;
}(Controller);

module.exports = AdminUsersController;

},{"../base/controller":2}],7:[function(require,module,exports){
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

},{"./string":8}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
require('../../modules/es6.object.assign');
module.exports = require('../../modules/$.core').Object.assign;
},{"../../modules/$.core":12,"../../modules/es6.object.assign":27}],10:[function(require,module,exports){
module.exports = function(it){
  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
  return it;
};
},{}],11:[function(require,module,exports){
var toString = {}.toString;

module.exports = function(it){
  return toString.call(it).slice(8, -1);
};
},{}],12:[function(require,module,exports){
var core = module.exports = {version: '1.2.6'};
if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef
},{}],13:[function(require,module,exports){
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
},{"./$.a-function":10}],14:[function(require,module,exports){
// 7.2.1 RequireObjectCoercible(argument)
module.exports = function(it){
  if(it == undefined)throw TypeError("Can't call method on  " + it);
  return it;
};
},{}],15:[function(require,module,exports){
// Thank's IE8 for his funny defineProperty
module.exports = !require('./$.fails')(function(){
  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
});
},{"./$.fails":17}],16:[function(require,module,exports){
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
},{"./$.core":12,"./$.ctx":13,"./$.global":18,"./$.hide":19,"./$.redefine":24}],17:[function(require,module,exports){
module.exports = function(exec){
  try {
    return !!exec();
  } catch(e){
    return true;
  }
};
},{}],18:[function(require,module,exports){
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef
},{}],19:[function(require,module,exports){
var $          = require('./$')
  , createDesc = require('./$.property-desc');
module.exports = require('./$.descriptors') ? function(object, key, value){
  return $.setDesc(object, key, createDesc(1, value));
} : function(object, key, value){
  object[key] = value;
  return object;
};
},{"./$":21,"./$.descriptors":15,"./$.property-desc":23}],20:[function(require,module,exports){
// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = require('./$.cof');
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function(it){
  return cof(it) == 'String' ? it.split('') : Object(it);
};
},{"./$.cof":11}],21:[function(require,module,exports){
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
},{}],22:[function(require,module,exports){
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
},{"./$":21,"./$.fails":17,"./$.iobject":20,"./$.to-object":25}],23:[function(require,module,exports){
module.exports = function(bitmap, value){
  return {
    enumerable  : !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable    : !(bitmap & 4),
    value       : value
  };
};
},{}],24:[function(require,module,exports){
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
},{"./$.core":12,"./$.global":18,"./$.hide":19,"./$.uid":26}],25:[function(require,module,exports){
// 7.1.13 ToObject(argument)
var defined = require('./$.defined');
module.exports = function(it){
  return Object(defined(it));
};
},{"./$.defined":14}],26:[function(require,module,exports){
var id = 0
  , px = Math.random();
module.exports = function(key){
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};
},{}],27:[function(require,module,exports){
// 19.1.3.1 Object.assign(target, source)
var $export = require('./$.export');

$export($export.S + $export.F, 'Object', {assign: require('./$.object-assign')});
},{"./$.export":16,"./$.object-assign":22}]},{},[1])
//# sourceMappingURL=admin-site.bundle.js.map
