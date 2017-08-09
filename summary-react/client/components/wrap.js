var React = require('react');
var ReactDOM = require('react-dom');
var axios = require('axios');

var Annotation = require('./annotation.js');
var Side = require('./side.js');
var Bar = require('./bar.js');

var Radium = require('radium');
import ReactUserFocus from 'react-user-focus';
import {Grid, Row, Col} from 'react-bootstrap';

const browser = require('detect-browser');

function onFocusChange(isHidden) {
  if (isHidden == true){
    console.log('Blurred')
    if (first == true){
      first = false
    }

  }else{
    console.log('Focused')

  }
}


var Wrap = React.createClass({

  getInitialState: function(){

    return ({
      all:{all:null},
      section:null,
      user:'',
      group:'',
      items:"",
      mapping:"",
      focused: true,
      scrolling: false,
      scrollPosition: 0,
      browserName: browser.name,
      browserVersion: browser.version,
      os: navigator.platform,
      selectedText: null,
      currentCount: 0
    })
  },

  timer: function(){
    this.setState({currentCount: this.state.currentCount + 1})
  },

  onFocusChange: function(isHidden){

    if (isHidden == true ){
      console.log('Blurred');
      console.log(this.state.currentCount);
      clearInterval(this.state.intervalId);

    }else{
      console.log('Focused');
      var intervalId = setInterval(this.timer, 1000);
      this.setState({intervalId: intervalId})
    }

  },

  componentDidMount: function(){
    console.log('OS:', this.state.os)
    console.log('Browser Name:', this.state.browserName)
    console.log('Browser Version', this.state.browserVersion)
    var items;
    var mapping;
    var user = [OPENSTAX USERNAME];
    var group = [HYPOTHES.IS GROUP]

    axios.get('http://localhost:5000/api/search', {
    params: {

      user: user,
      group: group,
      tag:null
    },
    headers:{
      Authorization: [HYPOTHESIS API TOKEN]
    }
    })
    .then(function(response){
      // Filter and map urls to annotations:
      var All = {};
      var x;
      var items = response.data.rows;

      for (x in items){

        // Check if the item is an annotation or highlight and edit
        // the object accordingly

        if (items[x].text == ''){
          items[x].annotation = false
        }else{
          items[x].annotation = true
        }
        var uri = String(items[x].uri);

        if (uri == 'http://localhost:3002/books/2'){
          uri = 'http://localhost:3002/books/2/section/1'
        }
        var annotation = items[x];


        var chapter = uri.split('/').splice(-1)[0].split('.')[0]

        if (All.hasOwnProperty(chapter) == false){
          All[chapter] = {}
        };
        if (All[chapter][uri] != undefined){

          All[chapter][uri].push(annotation);

        } else {
          All[chapter][uri] = [annotation];
        }


      }
      this.setState({mapping:All, items:response.data.rows, finished:true});


    }.bind(this));
     window.addEventListener('scroll', this.handleScroll);
     this.onFocusChange();
  },
  componentWillUnmount: function() {
    window.removeEventListener('scroll', this.handleScroll);
  },

  handleScroll: function(event) {
      console.log('Scroll Position:', event.srcElement.body.scrollTop)
      let scrollTop = event.srcElement.body.scrollTop,
          itemTranslate = Math.min(0, scrollTop/3 - 60);
      this.setState({
        transform: itemTranslate,
        scrolling: true,
        scrollPosition:event.srcElement.body.scrollTop
      });

  },
  handleSelect:function(){
    this.setState({selectedText:window.getSelection().toString()})
    console.log('Selected Text:', window.getSelection().toString())
  },
  render: function(){
    return(


    <div onMouseUp={this.handleSelect}>
    <ReactUserFocus onFocusChange={this.onFocusChange}>
    </ReactUserFocus>
    <Bar></Bar>
    <br></br>
    <Grid>
      <Side  mapping={this.state.mapping} user={this.state.user} group = {this.state.group} items={this.state.items}
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
