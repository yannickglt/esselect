import esprima from 'esprima'
import JSONSelect from 'JSONSelect';
import CodeMirror from 'codemirror'

const CODE_EXAMPLE = '// Life, Universe, and Everything\nvar answer = 6 * 7;'
const SELECTOR_EXAMPLE = ':has(:root > .type:val("VariableDeclarator")) .id'


class HomeController {
  constructor($timeout, localStorageService) {
    this.localStorageService = localStorageService
    this.$timeout = $timeout

    this.editor = null
    this.error = null
    this.status = 'ready'
    this.matches = []

    this.editorOptions = {
      lineWrapping: true,
      lineNumbers: true,
      matchBrackets: true,
      autoCloseBrackets: true,
      mode: 'esselect-overlay',
      theme: 'mbo',
      onLoad: (editor) => {
        this.editor = editor
        this.highlightMatches()
      }
    }

    this.selector = this.localStorageService.get('selector') || SELECTOR_EXAMPLE
    this.code = this.localStorageService.get('code') || CODE_EXAMPLE

    this.initMatcher()
  }

  initMatcher() {
    CodeMirror.defineMode('esselect-overlay', (config, parserConfig) => {
      var overlay = {
        token: (stream, state) => {
          let columns = this.columnsByLine(state.lineNo + 1, stream.string.length)
          if (stream.pos === columns.start) {
            stream.pos = columns.end || stream.string.length
            return 'matching-selection'
          }
          else if ((columns.start !== null) && (stream.pos < columns.start)) {
            stream.pos = columns.start
          }
          else {
            stream.skipToEnd()
          }
        }
      }
      let mode = CodeMirror.getMode(config, parserConfig.backdrop || 'text/javascript')
      return CodeMirror.overlayMode(mode, overlay);
    })
  }

  update() {
    this.status = 'loading'
    this.$timeout(() => {
      this.localStorageService.set('selector', this.selector)
      this.localStorageService.set('code', this.code)
      this.highlightMatches()
      this.status = 'ready'
    })
  }

  highlightMatches() {
    if (this.editor) {
      this.matches = []

      let json
      try {
        json = esprima.parse(this.code, {
          loc: true,
          comment: true
        })
      } catch (e) {
        this.error = {
          source: 'Esprima',
          message: e.message
        }
        return
      }

      try {
        this.matches = JSONSelect.match(this.selector, json)
      } catch (e) {
        this.error = {
          source: 'JSONSelect',
          message: e.message
        }
        return
      }

      // @todo find a better way to refresh the overlay
      this.editor.setOption('mode', 'esselect-overlay')
      this.error = null
    }
  }

  columnsByLine(line, length) {
    let start = null
    let end = null
    if (this.matches.length > 0) {
      for (let match of this.matches) {
        if (match.loc && match.loc.start && match.loc.end) {
          if (line > match.loc.start.line) {
            start = 0;
          }
          else if ((line === match.loc.start.line) && (start === null || start > match.loc.start.column)) {
            start = match.loc.start.column
          }

          if (line < match.loc.end.line) {
            end = length;
          }
          else if ((line === match.loc.end.line) && (end === null || end < match.loc.end.column)) {
            end = match.loc.end.column
          }
        }
      }
    }
    return {
      start: start,
      end: end
    }
  }

}

HomeController.$inject = ['$timeout', 'localStorageService']

module.exports = HomeController
