import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import minimatch from 'minimatch';
import './App.css';
import ContentEditable from 'react-contenteditable';

const matchesClass = 'red-highlight';
const htmlTagRegEx = /<[^>]*>/g;

/**
 * @see https://github.com/isaacs/minimatch/blob/master/README.md#options
 */
const minimatchDefaultOptions = {
  debug: false,
  nobrace: false,
  noglobstar: false,
  dot: false,
  noext: false,
  nocase: false,
  nonull: false,
  matchBase: false,
  nocomment: false,
  nonegate: false,
  flipNegate: false,
};
const testAgainstString = '<div>/Users/doge/very/amaze.js</div><div>usr/local/bin/wow</div>';

const A = (props) => (
  <a rel='noopener noreferrer' target='_blank' {...props}>
    {props.children}
  </a>
);

// prettier-ignore
let Valid = () => <span className="big">✓<small>(valid)</small></span>;
// prettier-ignore
let Invalid = () => <span className="big">✗<small>(invalid)</small></span>;

let ValidityDisplay = (props) => (props.isValid ? <Valid /> : <Invalid />);

// prettier-ignore
const OptionsLabel = (props) => (<label>Options <ValidityDisplay {...props} /></label>);

const bindAll = (self, ...methods) =>
  methods.forEach((method) => {
    self[method.name] = method.bind(self);
  });

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      minimatchString: '/**/*.js',
      testAgainstString,
      contentEditableRef: null,
      minimatchOptions: minimatchDefaultOptions,
      isValidOptionsJson: true,
      oldMatchCount: 0,
      matchCount: 0,
    };
    // this.bind();
    console.log(this);

    this.state.minimatchOptionsJson = JSON.stringify(this.state.minimatchOptions, null, 4);
    bindAll(
      this,
      this.getContentEditableRef,
      this.getMatchCountText,
      this.addOrRemoveMatchesClass,
      this.onTestStringChange,
      this.onMinimatchOptionsJsonChange,
      this.onMinimatchStringChange,
      this.onPaste,
    );
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.contentEditableRef !== prevState.contentEditableRef) {
      this.validate();
    }
  }

  componentDidMount() {
    this.validate();
  }

  onTestStringChange(e) {
    const testAgainstString = e.target.value;
    this.setState((prevState, props) => ({ testAgainstString }), this.validate);
  }

  onMinimatchStringChange(e) {
    const minimatchString = e.target.value;
    this.setState((prevState, props) => ({ minimatchString }), this.validate);
  }

  onMinimatchOptionsJsonChange(e) {
    const minimatchOptionsJson = e.target.value;
    let isValidOptionsJson = false;

    try {
      const minimatchOptions = JSON.parse(minimatchOptionsJson);
      isValidOptionsJson = true;
      this.setState((prevState, props) => {
        return { minimatchOptions };
      }, this.validate);
    } catch (err) {
      if (err.name !== 'SyntaxError' && err.message.indexOf('JSON') < 0) {
        console.log(err.name);
        console.log(err.message);
      }
    }
    this.setState((prevState, props) => {
      return { minimatchOptionsJson, isValidOptionsJson };
    });
  }

  validate() {
    const contentEditableElement = this.state.contentEditableRef && ReactDOM.findDOMNode(this.state.contentEditableRef);
    let matchCount = 0;

    if (contentEditableElement) {
      const children = contentEditableElement.children;
      for (let c of children) {
        const hasMatch = c.innerText && minimatch(c.innerText, this.state.minimatchString, this.state.minimatchOptions);
        this.addOrRemoveMatchesClass(c.classList, hasMatch);
        if (hasMatch) matchCount++;
      }
    }
    this.setState((prevState, props) => ({
      oldMatchCount: prevState.matchCount,
      matchCount,
    }));
  }

  // TODO: Allow adding/removing of any class, and support a "changed" class of some sort.
  addOrRemoveMatchesClass(classList, isAdding) {
    const whileCheck = isAdding ? () => !classList.contains(matchesClass) : () => classList.contains(matchesClass);
    const fn = isAdding ? 'add' : 'remove';

    while (whileCheck()) {
      classList[fn](matchesClass);
    }
  }

  getContentEditableRef(ref) {
    ref && this.setState((prevState, props) => ({ contentEditableRef: ref }));
  }

  /**
   * Strip all html tags on paste
   * @param e
   */
  onPaste(e) {
    e.preventDefault();
    let text;
    const clp = (e.originalEvent || e).clipboardData;
    if (clp === undefined || clp === null) {
      text = window.clipboardData.getData('text') || '';
      if (text !== '') {
        text = text.replace(htmlTagRegEx, '');
        if (window.getSelection) {
          const newNode = document.createElement('span');
          newNode.innerHTML = text;
          window.getSelection().getRangeAt(0).insertNode(newNode);
        } else {
          document.selection.createRange().pasteHTML(text);
        }
      }
    } else {
      text = clp.getData('text/plain') || '';
      if (text !== '') {
        text = text.replace(htmlTagRegEx, '');
        document.execCommand('insertText', false, text);
      }
    }
  }

  getMatchCountText() {
    const count = this.state.matchCount;
    return `(currently matching ${count} item${count === 1 ? '' : 's'})`;
  }

  render() {
    return (
      <div className='App'>
        <header className='App-header'>
          <h1 className='App-title'>
            <span className='App-title-mini'>mini</span>match Playground
          </h1>
        </header>
        <main>
          <div className='App-field col'>
            {/* prettier-ignore */}
            <label>Pattern <small>{this.getMatchCountText()}</small></label>
            <input type='text' value={this.state.minimatchString} onChange={this.onMinimatchStringChange} />
          </div>
          <div className='App-field row'>
            <div className='App-field half'>
              <OptionsLabel isValid={this.state.isValidOptionsJson} />
              <textarea
                type='text'
                value={this.state.minimatchOptionsJson}
                onChange={this.onMinimatchOptionsJsonChange}
              />
            </div>
            <div className='App-field half' onPaste={this.onPaste}>
              <label>
                Target <small>Successful matches highlighted with yellow</small>
              </label>
              <ContentEditable
                className='App-editable'
                html={this.state.testAgainstString}
                disabled={false}
                onChange={this.onTestStringChange}
                ref={this.getContentEditableRef}
              />
            </div>
          </div>
        </main>
        {/* prettier-ignore */}
        <footer>
          <div className='App-credits'>
            <p>Coded with <span role="img">❤</span>️ by Liron Zluf</p>
            <p>Improved with <span role="img">❤</span>️ by SgtPooki</p>
            <p><A href="https://lironzluf.github.io/" >lironzluf.github.io</A></p>
            <p>Icons made by <A href="http://www.freepik.com"  title="Freepik">Freepik</A> from <A href="https://www.flaticon.com/"  title="Flaticon">www.flaticon.com</A> is licensed by <A href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" >CC 3.0 BY</A></p>
          </div>
        </footer>
      </div>
    );
  }
}

export default App;
