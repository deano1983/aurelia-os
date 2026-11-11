'use strict';
// Single-source re-export: the outreach engine is authored as a UMD file in
// `public/` so the static GitHub Pages deploy and the Node tests run identical code.
module.exports = require('../public/outreach-engine.js');
