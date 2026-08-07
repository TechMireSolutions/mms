const Module = require('module');
const origRequire = Module.prototype.require;

let ts6;
try {
  ts6 = require('typescript-v6');
} catch (err) {
  // Fallback if typescript-v6 not found
}

if (ts6) {
  Module.prototype.require = function (id) {
    if (id === 'typescript') {
      return ts6;
    }
    return origRequire.apply(this, arguments);
  };
}
