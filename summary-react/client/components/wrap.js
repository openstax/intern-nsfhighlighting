var React = require('react');
var ReactDOM = require('react-dom');
var axios = require('axios');

var Annotation = require('./annotation.js');
var Side = require('./side.js');
var Bar = require('./bar.js');


var Radium = require('radium');

import {Grid, Row, Col} from 'react-bootstrap';

var Wrap = React.createClass({

  getInitialState: function(){
    return ({
      all:{all:null},
      section:null,
      user:'',
      group:'',
      items:"",
      mapping:"",
    })
  },
  componentWillMount: function(){
    var items;
    var mapping;
    var user = [USERNAME_HERE]
    var group = [GROUP_CODE_HERE]
    axios.get('http://localhost:5000/api/search', {
    params: {

      user: user,
      group: group,
      tag:null
    },
    headers:{
      Authorization: [HYPOTHES.IS_API_TOKEN_HERE]
    }
    })
    .then(function(response){
      

      // Filter and map urls to annotations:
      var All = {};
      var x;
      var items = this.state.items;

      for (x in items){
        var uri = String(items[x].uri);
        var annotation = items[x];

        if (All[uri] != undefined){

          All[uri].push(annotation);

        } else {
          All[uri] = [annotation];
        }
      }
      
      this.setState({mapping:All, items:response.data.rows, finished:true});

    }.bind(this));
  },

  render: function(){

    return(
    <div>
    <Bar></Bar>
    <br></br>
    <Grid>

      <Side mapping={this.state.mapping} user={this.state.user} group = {this.state.group} items={this.state.items}
      section={this.state.section} finished={this.state.finished}>

      </Side>
      <br></br>
      <br></br>
      <br></br>

    </Grid>
    </div>
  )
  }
});

module.exports = Wrap
