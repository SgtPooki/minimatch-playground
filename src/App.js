import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import minimatch from 'minimatch';
import './App.css';
import ContentEditable from 'react-contenteditable';

const matchesClass = 'yellow-highlight';
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

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            minimatchString: '/**/*.js',
            testAgainstString,
            contentEditableRef: null,
            minimatchOptions: minimatchDefaultOptions,
            isValidOptionsJson: true,
        };

        this.state.minimatchOptionsJson = JSON.stringify(this.state.minimatchOptions, null, 4);
        this.addOrRemoveMatchesClass = this.addOrRemoveMatchesClass.bind(this);
        this.onTestStringChange = this.onTestStringChange.bind(this);
        this.onMinimatchOptionsJsonChange = this.onMinimatchOptionsJsonChange.bind(this);
        this.onMinimatchStringChange = this.onMinimatchStringChange.bind(this);
        this.onPaste = this.onPaste.bind(this);
        this.getContentEditableRef = this.getContentEditableRef.bind(this);
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
        const contentEditableElement =
            this.state.contentEditableRef && ReactDOM.findDOMNode(this.state.contentEditableRef);
        if (contentEditableElement) {
            const children = contentEditableElement.children;
            for (let c of children) {
                console.log(c.innerText);
                const isAdding = minimatch(c.innerText, this.state.minimatchString, this.state.minimatchOptions);
                if (isAdding) {
                    console.log(c.innerText, 'matches');
                } else {
                    console.log(c.innerText, 'does not match');
                }
                this.addOrRemoveMatchesClass(c.classList, isAdding);
            }
        }
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

    render() {
        return (
            <div className="App">
                <header className="App-header">
                    <h1 className="App-title">
                        <span className="App-title-mini">mini</span>match Playground
                    </h1>
                </header>
                <main>
                    <div className="App-field col">
                        <label>minimatch Pattern</label>
                        <input type="text" value={this.state.minimatchString} onChange={this.onMinimatchStringChange} />
                    </div>
                    <div className="App-field row">
                        <div className="App-field half">
                            <label>
                                minimatch Options: Currently valid: {this.state.isValidOptionsJson ? '✓' : '✗'}
                            </label>
                            <textarea
                                type="text"
                                value={this.state.minimatchOptionsJson}
                                onChange={this.onMinimatchOptionsJsonChange}
                            />
                        </div>
                        <div className="App-field half" onPaste={this.onPaste}>
                            <label>
                                TEST AGAINST <small>Successful matches highlighted with yellow</small>
                            </label>
                            <ContentEditable
                                className="App-editable"
                                html={this.state.testAgainstString}
                                disabled={false}
                                onChange={this.onTestStringChange}
                                ref={this.getContentEditableRef}
                            />
                        </div>
                    </div>
                </main>
                <footer>
                    <div className="App-credits">
                        <p>
                            Coded with <span role="img">❤</span>️ by Liron Zluf
                        </p>
                        <p>
                            Improved with <span role="img">❤</span>️ by SgtPooki
                        </p>
                        <p>
                            <a href="https://lironzluf.github.io/" rel="noopener noreferrer" target="_blank">
                                lironzluf.github.io
                            </a>
                        </p>
                        <p>
                            Icons made by{' '}
                            <a href="http://www.freepik.com" target="_blank" rel="noopener noreferrer" title="Freepik">
                                Freepik
                            </a>{' '}
                            from{' '}
                            <a
                                href="https://www.flaticon.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Flaticon"
                            >
                                www.flaticon.com
                            </a>{' '}
                            is licensed by{' '}
                            <a
                                href="http://creativecommons.org/licenses/by/3.0/"
                                title="Creative Commons BY 3.0"
                                target="_blank"
                            >
                                CC 3.0 BY
                            </a>
                        </p>
                    </div>
                </footer>
            </div>
        );
    }
}

export default App;
