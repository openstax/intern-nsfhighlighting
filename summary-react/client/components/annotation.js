var React = require('react');
var ReactDOM = require('react-dom');
var axios = require('axios');
var Radium = require('radium');
var _ = require('lodash');
import ReactLoading from 'react-loading';

var styles = {
  annotation: {
    width:"470px",
    textAlign:"left",
  },
  text:{
    color: "#222b4f",
    width:'400px',
    overflow:"hidden"
  },
  target:{
    color: "#e36f4a"
  },
  list: {
    listStyle:"none"
  },
  annotationBorder: {
    border: '2px solid #585a58',
    borderRadius: '5px',
    paddingLeft:'15px',
    paddingRight:'15px',
    overflow:"hidden"

  }

};

var AnnotationBox = React.createClass({


  render: function(){
    var i = this.props.i
    var title = this.props.title
    if (this.props.annotation == true){
      styles.annotationBorder.border = '2px solid #585a58'
    }else{
      styles.annotationBorder.border = '2px solid #e36f4a'
      title = 'Highlight'
    }



    return(
      <div>
        <div style={styles.annotationBorder}>
          <div>
          <li key={"li-"+i}>

            <h4 style={styles.text} key={"h4-"+i}>{title}</h4>
            <h6 style={{color:'#72a648', textAlign:'right'}}>Section {this.props.section}</h6>
            <h5 style={styles.target} key={"h5-"+i}>{this.props.text}</h5>
            <h6 style={{textAlign:"right", color:"#585a58"}} key={"h6-"+i}>{this.props.time}</h6>
            <br></br>
          </li>
          </div>
        </div>
      <br></br>
      <br></br>
      </div>
    )
}});

var AnnotationList = React.createClass({
  getInitialState: function(){
    return({

      chapter:null
    })
  },

  listItems : function(){

    var allAnnotations = [];
    var i;
    var y = 0;
    var target = "";

    var section = String(this.props.section)

    var mapping = this.props.mapping

    var filtered =[];
    var filteredC = {};

    if (this.props.chapter == null){
      for (var key in mapping){
        for (var key2 in mapping[key]){

          filteredC[key2] = mapping[key][key2]
        }
      }
    }
    else if (mapping != null){
      filteredC = mapping[this.props.chapter]
    }

    if (this.props.section != null){
      filtered = filteredC[section]
    }else if (this.props.chapter != null){
      for (var sect in mapping[this.props.chapter]){
        for (var anno in mapping[this.props.chapter][sect]){
        filtered.push(mapping[this.props.chapter][sect][anno])
      }
      }
    }else{
      filtered = this.props.items
    };

    if (typeof filtered == "undefined"){
      return (
        <h4>No Annotations for this Section</h4>
      )
    }
    var count = 0;
    for (i in filtered){

      if (filtered[i].annotation == true){
        styles.annotationBorder.border = '2px solid green'
      }else{
        styles.annotationBorder.border = '2px solid red'
      }

      y ++ ;

      var uri = String(filtered[i].uri);
      if (uri == 'http://localhost:3002/books/2'){
        uri = 'http://localhost:3002/books/2/section/1'
      }
      if (uri.slice(-3).indexOf('/') > -1)
        {
          uri = uri + '  ';
        }

      if (_.has(filtered[i].target[0], 'selector') == true){
        if (filtered[i].target[0].selector.length >= 4){
          target = JSON.stringify(filtered[i].target[0].selector[3].exact)
        }
      }else{
        target = 'Page Note'
      };

      if ((String(this.props.tag) == filtered[i].tags[0] || this.props.tag == null )
    &&( (this.props.type == 'all')
    || (this.props.type == 'highlights' && filtered[i].annotation == false)
    || (this.props.type == 'annotations' && filtered[i].annotation == true))){

      var title = JSON.stringify(filtered[i].text)

      count ++ ;
      allAnnotations.push(

        <div>
          <AnnotationBox annotation={filtered[i].annotation} i={i} title={title}
          section={uri.slice(-3)} text={target} time={filtered[i].updated}>
          </AnnotationBox>
        <br></br>
        <br></br>
        </div>
      );

    };


    };
    if (count==0 && this.props.type != 'none'){
      return(<h4>No Annotations or Highlights have that tag</h4>)
    }else if(this.props.type == 'none'){
      return(<h4>No Annotations or Highlights selected</h4>)
    }else{
      return (allAnnotations);
    }

  },

  isFinished: function(){
    if (this.props.finished == true ){
      return true
    }else{
      return false
    }
  },
  render : function(){

    var list = this.listItems();
    var isFinished = this.isFinished();

    if (isFinished==true) {
    return(

      <div style={styles.annotation}><ul style={styles.list}>{list}</ul></div>

    )}else{
      return(
      <div>
      <ReactLoading type='spokes' color='#72a648'>
      </ReactLoading>
      </div>)
    }
  }
});


module.exports = AnnotationList
