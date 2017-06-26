# Overview
This React.js component works in conjuction with a local version of the hypothes.is annotation tool in order to display all annotations and highlights created for a user in Tutor through "Browse the Book."
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
### Update .babelrc file
```
/* 
    ./.babelrc
*/  
{
    "presets":[
        "es2015", "react"
    ]
}
```
### Install Modules
```
npm install radium
npm install axios
npm install react-bootstrap
```
### Run
```
yarn start
```
The server should run on http://localhost:8080/

