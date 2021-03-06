import angular from 'angular'

import home from './pages/home/home'
import styles from './styles/main.scss'

angular
  .module('app', [
    'app.home'
  ])
  .config(/** @ngInject*/ ($urlRouterProvider) => {
    $urlRouterProvider.otherwise('/home')
  })
