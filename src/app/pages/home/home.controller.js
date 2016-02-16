import esprima from 'esprima'
import JSONSelect from 'JSONSelect';
import CodeMirror from 'codemirror'

class HomeController {
  constructor(localStorageService) {
    this.localStorageService = localStorageService

    this.editor = null
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

    this.selector = this.localStorageService.get('selector')
    this.code = this.localStorageService.get('code')

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
    this.localStorageService.set('selector', this.selector)
    this.localStorageService.set('code', this.code)
    this.highlightMatches()
  }

  highlightMatches() {
    if (this.editor) {
      try {
        let json = esprima.parse(this.code, {
          loc: true,
          comment: true
        })
        this.matches = JSONSelect.match(this.selector, json)
        if (this.matches) {
          // @todo find a better way to refresh the overlay
          this.editor.setOption('mode', 'esselect-overlay')
        }
      } catch (e) {
        console.error(e)
        this.matches = []
      }
    }
  }

  columnsByLine(line, length) {
    let start = null
    let end = null
    if (this.matches.length > 0) {
      for (let match of this.matches) {
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
    return {
      start: start,
      end: end
    }
  }

}

HomeController.$inject = ['localStorageService']

module.exports = HomeController
