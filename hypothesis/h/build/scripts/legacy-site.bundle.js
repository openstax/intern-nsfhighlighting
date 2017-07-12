(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

window.$ = window.jQuery = require('jquery');
require('bootstrap');

if (window.chrome !== undefined) {
  var elements = document.getElementsByClassName('unhide-in-chrome');
  var i = void 0;
  for (i = 0; i < elements.length; i++) {
    elements[i].classList.remove('hidden');
  }
  elements = document.getElementsByClassName('hide-in-chrome');
  for (i = 0; i < elements.length; i++) {
    elements[i].classList.add('hidden');
  }
}

var bookmarkletInstaller = document.getElementById('js-bookmarklet-install');
if (bookmarkletInstaller) {
  bookmarkletInstaller.addEventListener('click', function (event) {
    window.alert('Drag me to the bookmarks bar');
    event.preventDefault();
  });
}

var chromeextInstaller = document.getElementById('js-chrome-extension-install');
if (chromeextInstaller) {
  chromeextInstaller.addEventListener('click', function (event) {
    window.chrome.webstore.install();
    event.preventDefault();
  });
}

var viaForm = document.querySelector('.js-via-form');
if (viaForm) {
  viaForm.addEventListener('submit', function (event) {
    var url = event.target.elements.url.value;
    if (url !== '') {
      window.location.href = 'https://via.hypothes.is/' + url;
    }
    event.preventDefault();
  });
}

},{"bootstrap":"bootstrap","jquery":"jquery"}]},{},[1])
//# sourceMappingURL=legacy-site.bundle.js.map
