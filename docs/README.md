# Project Open AAC Prototype

We are building an experimental system to enable AAC researchers to construct AAC device prototypes for research. The dream is a declarative system that runs in modern browsers.

## Demonstrations

You can see a few simple and rough demos of the current capabilities by following these links:

- <a href="https://unc-project-open-aac.github.io/OS-DPI/?fetch=examples/updated/grid_ex_1.osdpi">Single words</a>
- <a href="https://unc-project-open-aac.github.io/OS-DPI/?fetch=examples/updates/grid_ex_2.osdpi">Single words with morphs</a>
- <a href="https://unc-project-open-aac.github.io/OS-DPI/?fetch=examples/updated/keyboard_predict_ex_1.osdpi">Keyboard with prediction</a>
- <a href="https://unc-project-open-aac.github.io/OS-DPI/?fetch=examples/updated/photo_audio_ex_1.osdpi">Photo audio example</a>
- <a href="https://unc-project-open-aac.github.io/OS-DPI/?fetch=examples/updated/text_tabs_ex_1.osdpi">Text-based example</a>
- <a href="https://unc-project-open-aac.github.io/OS-DPI/?fetch=examples/updated/VSD_ex_1.osdpi">Visual Scene Display</a>
- <a href="https://unc-project-open-aac.github.io/OS-DPI/?fetch=examples/updated/utterance_Contact.osdpi">Contact-like utterance-based system</a>
- <a href="https://unc-project-open-aac.github.io/OS-DPI/#new">Start a new design</a>

**These demos are known to not work in Safari.** Please use Google Chrome or one if its variants.

In these demos you can switch between the developer mode and full-screen user-interface pressing the "d" except while in a text input.

The Layout tab allows modifying the visual design. The Actions tab allows modifying the response of the system to user inputs. The Access tab will eventually allow programming different access modes. The Content tab will eventually allow importing content from spreadsheets.

Your changes will be persisted locally in your browser but are not saved externally.

## Implementation

The key library is <a href="https://github.com/WebReflection/uhtml">&mu;html</a>, a tiny library for building declarative and reactive user interfaces via template literals. We are trying to avoid requiring transpilation or fancy build steps; the code we write should be the code we ship.

We are using <a href="https://github.com/fuzetsu/mergerino">Mergerino</a> with a version of the <a href="http://meiosis.js.org/">Meiosis</a> pattern for state management.

We are using <a href="https://www.snowpack.dev/">Snowpack</a> to provide es6 compatible modules by prebundling code from <a href="https://www.npmjs.com/">npm</a>. Snowpack also provides page reloading during development.

We are formatting code with <a href="https://prettier.io/">Prettier</a> and accepting its defaults.

We are documenting our Javascript with <a href="https://jsdoc.app/">JSDoc</a> and providing a few type hints to the <a href="https://www.typescriptlang.org/">TypeScript</a> compiler for static checking of our Javascript code.
