# Project Open AAC Prototype

We are building an experimental system to enable AAC researchers to construct
AAC device prototypes for research. The dream is a declarative system that runs
in modern browsers.

The key library is
<a href="https://github.com/WebReflection/uhtml">&mu;html</a>, a tiny library
for building declarative and reactive user interfaces via template literals. We
are trying to avoid requiring transpilation or fancy build steps; the code we
write should be the code we ship.

We are using <a href="https://github.com/fuzetsu/mergerino">Mergerino</a> with a
version of the <a href="http://meiosis.js.org/">Meiosis</a> pattern for state
management.

We are using <a href="https://www.snowpack.dev/">Snowpack</a> to provide es6
compatible modules by prebundling code from
<a href="https://www.npmjs.com/">npm</a>. Snowpack also provides page reloading
during development.

We are formatting code with <a href="https://prettier.io/">Prettier</a> and
accepting its defaults.

We are documenting our Javascript with <a href="https://jsdoc.app/">JSDoc</a>
and providing a few type hints to the
<a href="https://www.typescriptlang.org/">TypeScript</a> compiler for static
checking of our Javascript code.
