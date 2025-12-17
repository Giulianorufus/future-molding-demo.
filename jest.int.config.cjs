const base = require('./jest.config.cjs');
// Clone base config but ensure integration tests are not ignored
const cfg = Object.assign({}, base);
cfg.testPathIgnorePatterns = (base.testPathIgnorePatterns || []).filter((p) => String(p) !== "\\.int\\.test\\.ts$");
module.exports = cfg;
