var React = require('react');
var axios = require('axios');

var Annotation = require('./annotation.js');

var Radium = require('radium');

import {Grid, Row, Col, Button} from 'react-bootstrap';



var Side = React.createClass({
  getInitialState:function(){
    return({
      chapter:null,
      section:null,
      tag:null,
      clicked:null,
      Important:"default",
      Critical:"default",
      Question:"default"})
  },

  changeSection: function(sect){
      this.setState({section:"http://localhost:3002/books/2/section/"+sect})
  },

  toggleChapter: function(chap){
    if (this.state.chapter == null){
      this.setState({chapter:chap})
    }else{
      this.setState({chapter:null})
    }
  },

  getAllHighlights: function(){
    this.setState({section:null})
  },

  toggleTag: function(newTag){

    var toggleOn = function(){
      var allTags = ["Important", "Critical", "Question"];
      var index = allTags.indexOf(newTag);
      allTags.splice(index, 1);

      var obj = {};
      obj[newTag]="success";
      obj["tag"]=newTag;
      for (var i in allTags){
        obj[allTags[i]]="default"
      }

      return (
        obj
      )
    };
    var toggleOff = function(){
      var obj = {};
      obj[newTag]="default";
      obj["tag"]=null;
      return (
        obj
      )
    };

    if (this.state.tag != newTag){
      this.setState(toggleOn)
    }else{
      this.setState(toggleOff)
    }
  },

  sections:{
    1:["1.1", "1.2", "1.3", "1.4"],
    2:["2.1", "2.2", "2.3", "2.4"],
    3:["3.1", "3.2", "3.3", "3.4"]
  },

  getSections: function(){
    var all = [];
    var chapterSections = [];


    for (var i in this.sections){
      var chapterButtonColor = "default";

      if(this.state.chapter==i){
        chapterButtonColor  = "primary";

        for(var j in this.sections[i]){
          var sectionButtonColor = "default"
          if (this.state.section != null){
            if (this.sections[i][j] == this.state.section.slice(-3)){
              sectionButtonColor = "primary"
            };
          };

          chapterSections.push(
            <div >
              <li>
                <Button key={"button"+{j}}bsStyle={sectionButtonColor} bsSize="xsmall" onClick={this.changeSection.bind(this, this.sections[i][j])}>Section {this.sections[i][j]}</Button>
              </li>
              <br></br>
            </div>
          )
        }
        all.push(
          <div >
            <li ><Button bsStyle={chapterButtonColor} onClick={this.toggleChapter.bind(this, i)}>Chapter {i}</Button></li>
            <br></br>
            <ul style={{listStyle:"none"}}>{chapterSections}</ul>
          </div>
        )
      }else{
        all.push(
          <div>
            <li><Button onClick={this.toggleChapter.bind(this, i)}>Chapter {i}</Button></li>
            <br></br>
          </div>
        )
      }
    }
    return all



  },
  render: function(){
    return(

      <Row>
        <Col md={2}>
          <div><Button bsStyle="info" onClick={this.getAllHighlights.bind(this)}>All Highlights</Button></div>
          <br></br>
          <div><ul style={{listStyle:"none"}}>{this.getSections()}</ul></div>
        </Col>
        <Col md={6} mdOffset={1}>
          <Annotation mapping={this.props.mapping} user={this.props.user} group = {this.props.group} items={this.props.items}
          section={this.state.section} finished={this.props.finished} tag={this.state.tag}></Annotation>
        </Col>
        <Col md={3}>
        <div>
          <div style={{paddingLeft:"17px"}} >
            <h3 style={{textAlign:"center"}}>Tags</h3>
            <br></br>
          </div>
          <Row>
            <Col md={4}>
              <Button key="Important" onClick={this.toggleTag.bind(this, "Important")} bsSize="small" bsStyle={this.state["Important"]}>Important (!)</Button>
            </Col>

            <Col md={4}>
              <div style={{paddingLeft:"7px"}}>
              <Button key="Critical" onClick={this.toggleTag.bind(this, "Critical")} bsSize="small" bsStyle={this.state["Critical"]}>Critical (!!)</Button>
              </div>
            </Col>

            <Col md={4}>
              <Button key="Question" onClick={this.toggleTag.bind(this, "Question")} bsSize="small" bsStyle={this.state["Question"]}>Question (?)</Button>
            </Col>
          </Row>
        </div>
        </Col>
      </Row>

    )
  }
});

module.exports = Side
