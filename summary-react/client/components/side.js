var React = require('react');
var axios = require('axios');

var Annotation = require('./annotation.js');

var Radium = require('radium');
var Settings = require('./settings.js')
import {Grid, Row, Col, Button} from 'react-bootstrap';


var styles = {
  button:{
    outline:"none",
    width:"83px"
  },
  allHighlights:{
    outline:"none"
  }
};
var annotationsButtonStyle = "primary"
var highlightsButtonStyle = "primary"

var Side = React.createClass({
  getInitialState:function(){
    return({
      chapter:null,
      section:null,
      tag:null,
      clicked:null,
      type:'all',
      Important:"default",
      Critical:"default",
      Question:"default"})
  },
  componentWillMount: function(){
      var allTags = {};
      for (var tag in Settings.tags){
        allTags[Settings.tags[tag]] = "default"
      };
      this.setState(allTags)

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
    this.setState({section:null, chapter:null})

  },
  toggleAnnotationsColor: function(){
    if (annotationsButtonStyle == 'primary'){
      annotationsButtonStyle = 'default'
    }else{
      annotationsButtonStyle = 'primary'
    }
  },
  toggleHighlightsColor: function(){
    if (highlightsButtonStyle == 'primary'){
      highlightsButtonStyle = 'default'
    }else{
      highlightsButtonStyle = 'primary'
    }
  },
  toggleTag: function(newTag){

    var toggleOn = function(){
      var allTags = [];
      for (var tag in Settings.tags){
        allTags.push(Settings.tags[tag])
      }
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

  sections:Settings.sections,
  toggleAnnotations: function(){
    if (this.state.type == 'all'){


      this.setState({type:'highlights'})
    }else if (this.state.type == 'annotations'){
      this.setState({type:'none'})
    }else if (this.state.type == 'highlights'){
      this.setState({type:'all'})
    }else{
      this.setState({type:'annotations'})
    };
    this.toggleAnnotationsColor()
  },
  toggleHighlights: function(){
    if (this.state.type == 'all'){


      this.setState({type:'annotations'})
    }else if (this.state.type == 'annotations'){
      this.setState({type:'all'})
    }else if (this.state.type == 'highlights'){
      this.setState({type:'none'})
    }else{
      this.setState({type:'highlights'})
    };
    this.toggleHighlightsColor()
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

            if (this.sections[i][j] == this.state.section.split('/')[this.state.section.split('/').length - 1] ){

              sectionButtonColor = "primary"
            };
          };

          chapterSections.push(
            <div >
              <li>
                <Button style={styles.button} key={"button"+{j}} bsStyle={sectionButtonColor} bsSize="xsmall" onClick={this.changeSection.bind(this, this.sections[i][j])}>Section {this.sections[i][j]}</Button>
              </li>
              <br></br>
            </div>
          )
        }
        all.push(
          <div >
            <li ><Button style={styles.button} bsStyle={chapterButtonColor} onClick={this.toggleChapter.bind(this, i)}>Chapter {i}</Button></li>
            <br></br>
            <ul style={{listStyle:"none"}}>{chapterSections}</ul>
          </div>
        )
      }else{
        all.push(
          <div>
            <li><Button style={styles.button} onClick={this.toggleChapter.bind(this, i)}>Chapter {i}</Button></li>
            <br></br>
          </div>
        )
      }
    }
    return all



  },
  render: function(){
    return(

      <Row style={{textAlign:"center"}}>
        <Col md={2} xs={12}>
          <div><Button style={styles.allHighlights} bsStyle="info" onClick={this.getAllHighlights.bind(this)}>All Highlights</Button></div>
          <br></br>
          <div><ul style={{listStyle:"none"}}>{this.getSections()}</ul></div>
        </Col>
        <Col md={6} mdOffset={1} xs={12}>
          <Annotation type={this.state.type} chapter={this.state.chapter} mapping={this.props.mapping} user={this.props.user} group = {this.props.group} items={this.props.items}
          section={this.state.section} finished={this.props.finished} tag={this.state.tag}></Annotation>
        </Col>
        <Col md={3} xs={12}>
        <div>
          <div style={{paddingLeft:"17px"}} >
            <h3 style={{textAlign:"center"}}>Tags</h3>
            <br></br>
          </div>
          <Row>
            <Col md={4}>
              <Button style={styles.button} key={Settings.tags[0]} onClick={this.toggleTag.bind(this, Settings.tags[0])} bsSize="small" bsStyle={this.state["Important"]}>{Settings.tags[0]}</Button>
            </Col>

            <Col md={4}>
              <div style={{paddingLeft:"0px"}}>
              <Button style={styles.button} key={Settings.tags[1]} onClick={this.toggleTag.bind(this, Settings.tags[1])} bsSize="small" bsStyle={this.state["Critical"]}>{Settings.tags[1]}</Button>
              </div>
            </Col>

            <Col md={4}>
              <Button style={styles.button} key={Settings.tags[2]} onClick={this.toggleTag.bind(this, Settings.tags[2])} bsSize="small" bsStyle={this.state["Question"]}>{Settings.tags[2]}</Button>
            </Col>
          </Row>
          <br></br>
          <div style={{paddingLeft:"17px"}} >
            <h3 style={{textAlign:"center"}}>Type</h3>
            <br></br>
          </div>
          <Row>
            <Col md={6} style={{paddingLeft:"55px"}}>
              <Button style={styles.button} key="Annotation" bsSize="small" bsStyle={annotationsButtonStyle} onClick={this.toggleAnnotations.bind(this)}>Annotations</Button>
            </Col>
            <Col md={6} style={{paddingRight:"45px"}}>
              <Button style={styles.button} key="Highlights" bsSize="small" bsStyle={highlightsButtonStyle} onClick={this.toggleHighlights.bind(this)}>Highlights</Button>
            </Col>

          </Row>
        </div>
        </Col>
      </Row>

    )
  }
});

module.exports = Side
