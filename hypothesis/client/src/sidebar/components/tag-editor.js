'use strict';

// @ngInject
function TagEditorController(tags) {
  this.onTagsChanged = function () {
    console.log("call onTagsChanged");
    tags.store(this.tags);
    var newTags = this.tagList.map(function (item) { return item.text; });
    this.onEditTags({tags: newTags});
  };

  this.autocomplete = function (query) {
    console.log("call autocomplete");
    return Promise.resolve(tags.filter(query));
  };
  this.$onChanges = function (changes) {
    console.log("call onChanges");
    console.log(changes);
    if (changes.tags) {
      this.tagList = changes.tags.currentValue.map(function (tag) {
        return {text: tag};
      });
      // this.tagList = {text: changes.tags.currentValue};
    }
    console.log(this.tagList);
  };

  //Make all the options here
  this.tagOptions = ['Biology', 'Physics', "Spanish", "English"];
  
  // Newly added
  this.selectTags = function(new_tags) {
    //tag.store only shows the tag on the page
    // tags.store(new_tags);
    // Not neccessary anymore
    this.tagList = {text: new_tags};
    //The brackets are needed for onChanges functions
    //Because changes.tags.currentValue has to be an array
    this.onEditTags({tags: [new_tags]});
  }

}

module.exports = {
  controller: TagEditorController,
  controllerAs: 'vm',
  bindings: {
    tags: '<',
    onEditTags: '&',
  },
  template: require('../templates/tag-editor.html'),
};
