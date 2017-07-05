Modification of the tag:
1. Edit /client/src/sidebar/template/tag-editor.html:
a. Comment out the <tags-input> component (an angular.js built-in componnet) (line 16-28),
and use a div containing <select> component (line 32-39).
b. The on-tag-added and on-tag-removed directives are not avaliable anymore. select tag
should use ng-change directive to trigger a function that deal with the tag selection.
c. The data binding should be a bit different because the value of select component should be
a single value but not a list now. "vm.tagList" in the <tags-input> => "vm.tag" in the 
<select>.

2. Edit /client/src/sidebar/components/tag-editor.js:
a. this.onTagsChanged funciton is replaced by this.selectTags because the change
of data type. tags.store shows tags on tag-input component so it is not neccessary.
b. Add this.tagOptions. It is an array containning all the options.
c. this.$onChanges is what communicate with other part of the angular. This function remains
unchanged, and thus the modification won't mess up the internal interface.

Client example for json configeration:
1. In client_json_config_example/index.htm line 11-32. It can change the color of the sidebar backgournd,
some buttons. It won't be enough for our requirements. See example by clicking this link (a page hosted by 
github): https://tianlantianlan95.github.io/TestTextbookHtmlBeta/