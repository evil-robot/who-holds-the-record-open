// SHA-256 of the country files in data/ (basename then bytes, sorted): the same hash as scripts/datahash.py and robustness.py.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
function dataSha256(root = path.join(__dirname, '..')) {
  const h = crypto.createHash('sha256'), dir = path.join(root, 'data');
  for (const f of fs.readdirSync(dir).filter(f => /^[A-Z]{3}\.json$/.test(f)).sort()) { h.update(f); h.update(fs.readFileSync(path.join(dir, f))); }
  return h.digest('hex');
}
module.exports = { dataSha256 };
if (require.main === module) console.log(dataSha256(process.argv[2]));
