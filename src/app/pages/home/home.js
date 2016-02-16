import angular from 'angular';
import uiRouter from 'angular-ui-router'
import HomeController from './home.controller'
import HomeTemplate from './home.template.html'
import LocalStorage from 'angular-local-storage'

// Codemirror dependencies
import UiCodemirror from 'angular-ui-codemirror'
import CodeMirror from 'codemirror'
import JavascriptMode from 'codemirror/mode/javascript/javascript'
import OverylayMode from 'codemirror/addon/mode/overlay'
import MatchbracketsEdit from 'codemirror/addon/edit/matchbrackets'
import ClosebracketsEdit from 'codemirror/addon/edit/closebrackets'

// Styles
import HomeStyle from './home.scss'

angular
  .module('app.home', [
    'ui.router',
    'ui.codemirror',
    'LocalStorageModule'
  ])
  .config(($stateProvider) => {
    $stateProvider
      .state('home', {
        url: '/home',
        views: {
          app: {
            template: HomeTemplate,
            controller: HomeController,
            controllerAs: 'home'
          }
        }
      })
  })
