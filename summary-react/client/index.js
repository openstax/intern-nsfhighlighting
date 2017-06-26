var React = require('react');
var ReactDOM = require('react-dom');
var axios = require('axios');

var Annotation = require('./components/annotation.js');
var Side = require('./components/side.js')
var Wrap = require('./components/wrap.js');
var Radium = require('radium');

import {Grid, Row, Col} from 'react-bootstrap';



ReactDOM.render(<Wrap />, document.getElementById('root'));
