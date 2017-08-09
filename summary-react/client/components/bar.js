var React = require('react');
var axios = require('axios');

var Annotation = require('./annotation.js');
var Radium = require('radium');

import {Grid, Row, Col, Button, FormGroup, FormControl} from 'react-bootstrap';

var Bar = React.createClass({
  render: function(){
    return(
      <div >
        <Row>
          <Col md={4}>
            <img style={{width:"200px", paddingLeft:"30px"}} src="https://openstax.org/images/logo.svg"></img>
          </Col>
          <Col md={8}>
            
          </Col>
        </Row>
      </div>
    )
  }
})

module.exports = Bar
