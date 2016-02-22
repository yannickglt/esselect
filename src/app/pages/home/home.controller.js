import esprima from 'esprima'
import escodegen from 'escodegen'
import JSONSelect from 'JSONSelect'
import CodeMirror from 'codemirror'
import JavascriptMode from 'codemirror/mode/javascript/javascript'
import MatchbracketsEdit from 'codemirror/addon/edit/matchbrackets'
import ClosebracketsEdit from 'codemirror/addon/edit/closebrackets'

const CODE_EXAMPLE = '// Life, Universe, and Everything\nvar answer = 6 * 7;'
const SELECTOR_EXAMPLE = ':has(:root > .type:val("VariableDeclarator")) .id'

class HomeController {
  constructor($timeout, localStorageService) {
    this.localStorageService = localStorageService
    this.$timeout = $timeout

    this.jsEditor = null
    this.jsonEditor = null
    this.error = null
    this.status = 'ready'
    this.matches = []
    this.markers = []

    Promise.all([this.initJsEditor(), this.initJsonEditor()])
      .then(() => {
        this.$timeout(() => {
          this.jsToJson()
        })
      })

    this.selector = this.localStorageService.get('selector') || SELECTOR_EXAMPLE
    this.jsCode = this.localStorageService.get('jscode') || CODE_EXAMPLE
    this.json = null
    this.jsonCode = null
  }

  updateSelector() {
    this.status = 'loading'
    this.$timeout(() => {
      this.localStorageService.set('selector', this.selector)
      this.highlightMatches()
      this.status = 'ready'
    })
  }

  initJsEditor() {
    return new Promise((resolve) => {
      this.jsEditorOptions = {
        lineWrapping: true,
        lineNumbers: true,
        matchBrackets: true,
        autoCloseBrackets: true,
        mode: 'application/javascript',
        theme: 'mbo',
        onLoad: (editor) => {
          this.jsEditor = editor
          resolve(editor)
        }
      }
    })
  }

  initJsonEditor() {
    return new Promise((resolve) => {
      this.jsonEditorOptions = {
        lineWrapping: true,
        lineNumbers: true,
        matchBrackets: true,
        autoCloseBrackets: true,
        mode: 'application/json',
        theme: 'mbo',
        onLoad: (editor) => {
          this.jsonEditor = editor
          resolve(editor)
        }
      }
    })
  }

  updateJs() {
    this.status = 'loading'
    this.$timeout(() => {
      this.localStorageService.set('jscode', this.jsCode)
      this.jsToJson()
      this.status = 'ready'
    })
  }

  updateJson() {
    this.status = 'loading'
    this.$timeout(() => {
      this.jsonToJs()
      this.localStorageService.set('jscode', this.jsCode)
      this.status = 'ready'
    })
  }

  jsToJson() {
    this.error = null
    this.jsonCode = null

    try {
      this.json = esprima.parse(this.jsCode, {
        loc: true,
        attachComment: true
      })
    } catch (e) {
      this.error = {
        source: 'Esprima',
        message: e.message
      }
      return
    }

    this.highlightMatches()
  }

  jsonToJs() {
    this.error = null
    this.js = null

    try {
      this.json = JSON.parse(this.jsonCode)
      this.jsCode = escodegen.generate(this.json, {
        comment: true
      })
    } catch (e) {
      this.error = {
        source: 'Escodegen',
        message: e.message
      }
      return
    }

    this.highlightMatches()
  }

  calculateMatches() {
    this.matches = []
    try {
      let matches = JSONSelect.stringify(this.selector, this.json)
      this.matches = matches.matches
      this.jsonCode = matches.json
    } catch (e) {
      this.error = {
        source: 'JSONSelect',
        message: e.message
      }
      return
    }
  }

  highlightMatches() {
    this.calculateMatches()

    if (this.matches.length > 0) {

      for (let marker of this.markers) {
        marker.clear()
      }
      this.markers = []
    }

    this.$timeout(() => {
      for (let match of this.matches) {

        if (this.jsEditor) {
          let marker = this.jsEditor.markText({
            line: match.match.loc.start.line - 1,
            ch: match.match.loc.start.column
          }, {
            line: match.match.loc.end.line - 1,
            ch: match.match.loc.end.column
          }, {
            className: 'cm-matching-selection'
          })
          this.markers.push(marker)
        }

        if (this.jsonEditor) {
          let marker = this.jsonEditor.markText({
            line: match.lineStart - 1,
            ch: match.columnStart
          }, {
            line: match.lineEnd - 1,
            ch: match.columnEnd
          }, {
            className: 'cm-matching-selection'
          })
          this.markers.push(marker)
        }
      }
    })
  }

}

HomeController.$inject = ['$timeout', 'localStorageService']

module.exports = HomeController
