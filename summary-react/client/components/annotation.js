var React = require('react');
var ReactDOM = require('react-dom');
var axios = require('axios');
var Radium = require('radium');


var styles = {
  annotation: {
    width:"400px",
    textAlign:"left",
  },
  text:{
    color: "#222b4f"
  },
  target:{
    color: "#e36f4a"
  },
  list: {
    listStyle:"none"
  }
};


var AnnotationList = React.createClass({

  listItems : function(){

    var allAnnotations = [];
    var i;
    var y = 0;
    var target = "";

    var section = String(this.props.section)
    var mapping = this.props.mapping
    var filtered;

    if (this.props.section != null){
      filtered = mapping[section]
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

      y ++ ;

      var uri = String(filtered[i].uri);


      if (filtered[i].target[0].selector.length >= 4){
        target = JSON.stringify(filtered[i].target[0].selector[3].exact)

      };


      if (String(this.props.tag) == filtered[i].tags[0] || this.props.tag == null){
      count ++ ;
      allAnnotations.push(
        <li key={"li-"+i}>
          <h4 style={styles.text} key={"h4-"+i}>{y}. {JSON.stringify(filtered[i].text)}</h4>
          <h5 style={styles.target} key={"h5-"+i}>{target}</h5>
          <br></br>
          <h6 style={{textAlign:"right", color:"#585a58"}} key={"h6-"+i}>{filtered[i].updated}</h6>
          <br></br>

        </li>
      );

    };


    };
    if (count==0){
      return(<h4>No Annotations have that tag</h4>)
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
      <div></div>)
    }
  }
});


module.exports = AnnotationList
