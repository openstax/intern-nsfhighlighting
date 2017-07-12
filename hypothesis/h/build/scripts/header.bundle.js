(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

/**
 * EnvironmentFlags provides a facility to modify the appearance or behavior
 * of components on the page depending on the capabilities of the user agent.
 *
 * It adds `env-${flag}` classes to a top-level element in the document to
 * indicate support for scripting, touch input etc. These classes can then be
 * used to modify other elements in the page via descendent selectors.
 *
 * EnvironmentFlags provides hooks to override the detected set of environment
 * features via query-string or fragment parameters in the URL:
 *
 *  "__env__" -  A semi-colon list of environment flags to enable or disable
 *               (if prefixed with "no-"). eg. "__env__=touch"
 *  "nojs=1"  -  Shorthand for "__env__=no-js-capable"
 */

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EnvironmentFlags = function () {
  /**
    * @param {Element} element - DOM element which environment flags will be added
    *                  to.
    */
  function EnvironmentFlags(element) {
    _classCallCheck(this, EnvironmentFlags);

    this._element = element;
  }

  /**
   * Return the current value of an environment flag.
   *
   * @param {string} flag
   */


  _createClass(EnvironmentFlags, [{
    key: 'get',
    value: function get(flag) {
      var flagClass = 'env-' + flag;
      return this._element.classList.contains(flagClass);
    }

    /**
     * Set or clear an environment flag.
     *
     * This will add or remove the `env-${flag}` class from the element which
     * contains environment flags.
     *
     * @param {string} flag
     * @param {boolean} on
     */

  }, {
    key: 'set',
    value: function set(flag, on) {
      var flagClass = 'env-' + flag;
      if (on) {
        this._element.classList.add(flagClass);
      } else {
        this._element.classList.remove(flagClass);
      }
    }

    /**
     * Detect user agent capabilities and set default flags.
     *
     * This sets the `js-capable` flag but clears it if `ready()` is not called
     * within 5000ms. This can be used to hide elements of the page assuming that
     * they can later be shown via JS but show them again if scripts fail to load.
     *
     * @param {string} [url] - Optional value to use as the URL for flag overrides
     */

  }, {
    key: 'init',
    value: function init(url) {
      var _this = this;

      var JS_LOAD_TIMEOUT = 5000;

      // Mark browser as JS capable
      this.set('js-capable', true);

      // Set a flag to indicate touch support. Useful for browsers that do not
      // support interaction media queries.
      // See http://caniuse.com/#feat=css-media-interaction
      this.set('touch', this._element.ontouchstart);

      // Set an additional flag if scripts fail to load in a reasonable period of
      // time
      this._jsLoadTimeout = setTimeout(function () {
        _this.set('js-timeout', true);
      }, JS_LOAD_TIMEOUT);

      // Process flag overrides specified in URL
      var flags = envFlagsFromUrl(url || this._element.ownerDocument.location.href);
      flags.forEach(function (flag) {
        if (flag.indexOf('no-') === 0) {
          _this.set(flag.slice(3), false);
        } else {
          _this.set(flag, true);
        }
      });
    }

    /**
     * Mark the page load as successful.
     */

  }, {
    key: 'ready',
    value: function ready() {
      if (this._jsLoadTimeout) {
        clearTimeout(this._jsLoadTimeout);
      }
    }
  }]);

  return EnvironmentFlags;
}();

/**
 * Extract environment flags from `url`.
 *
 * @param {string} url
 * @return {Array<string>} flags
 */


function envFlagsFromUrl(url) {
  var match = /\b__env__=([^&]+)/.exec(url);
  var flags = [];
  if (match) {
    flags = match[1].split(';');
  }

  // Convenience shorthand to disable JS
  if (url.match(/\bnojs=1\b/)) {
    flags.push('no-js-capable');
  }
  return flags;
}

module.exports = EnvironmentFlags;

},{}],2:[function(require,module,exports){
'use strict';

// Header script which is included inline at the top of every page on the site.
//
// This should be a small script which does things like setting up flags to
// indicate that scripting is active, send analytics events etc.

var EnvironmentFlags = require('./base/environment-flags');

window.envFlags = new EnvironmentFlags(document.documentElement);
window.envFlags.init();

// Set up the Google Analytics command queue if we have a tracking ID.
var gaTrackingId = document.querySelector('meta[name="google-analytics-tracking-id"]');
if (gaTrackingId) {
  /* eslint-disable */
  window.ga = window.ga || function () {
    (ga.q = ga.q || []).push(arguments);
  };ga.l = +new Date();
  ga('create', gaTrackingId.content, 'auto');
  ga('send', 'pageview');
  /* eslint-enable */
}

},{"./base/environment-flags":1}]},{},[2])
//# sourceMappingURL=header.bundle.js.map
