# Overview
This React.js component works in conjuction with a local version of the hypothes.is annotation tool in order to display all annotations and highlights created for a user in Tutor through "Browse the Book." This app breaks up the annotations of a user by section of the tutor textbook which can also be filtered by tag. 
## Requirements
* brew
* npm
* yarn
## Installation
### Install yarn
```
brew update
brew install yarn
```
### Open proper directory
```
git clone https://github.com/openstax/intern-nsfhighlighting.git
cd intern-nsfhighlighting
cd summary-react
```
### Babel setup
```
yarn add babel-loader babel-core babel-preset-es2015 babel-preset-react --dev
touch .babelrc
```
### Install Modules
```
npm install radium
npm install axios
npm install react-bootstrap
```

## Setup
### Insert Hypothes.is Parameters
In intern-nsfhighlighting/summary-react/client/components/wrap.js update insert your hypothes.is username, group id, and API token:
```
/* 
    ./summary-react/client/components/wrap.js
*/

...
componentWillMount: function(){
    var items;
    var mapping;
    var user = [USERNAME_HERE]  // CHANGE HERE
    var group = [GROUP_CODE_HERE] // CHANGE HERE
    axios.get('http://localhost:5000/api/search', {
    params: {

      user: user,
      group: group,
      tag:null
    },
    headers:{
      Authorization: [HYPOTHES.IS_API_TOKEN_HERE] // CHANGE HERE
    }
    })
...
```
## Run
```
yarn start
```
The server should run on http://localhost:8080/
