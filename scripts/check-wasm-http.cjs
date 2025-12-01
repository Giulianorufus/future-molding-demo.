const http = require('http');
const https = require('https');
const fs = require('fs');
const url = require('url');

const WASM_URL = process.env.WASM_URL || 'http://127.0.0.1:5174/vendor/occt/occt-import-js.wasm';
const LOG = process.env.LOG || 'scripts/check-wasm-http-result.txt';
const OUT = process.env.OUT || 'tmp/occt-import-js.wasm';

function log(obj){
  try{ fs.writeFileSync(LOG, typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2)); }catch(e){ console.error('write log failed', e.message); }
}

const parsed = url.parse(WASM_URL);
const get = parsed.protocol === 'https:' ? https.get : http.get;

const req = get(WASM_URL, (res)=>{
  const { statusCode, headers } = res;
  const info = { url: WASM_URL, statusCode, headers };
  if(statusCode !== 200){
    log({ ok:false, info });
    console.log('NOT_OK', statusCode);
    res.resume();
    process.exit(2);
    return;
  }
  // write stream to file
  try{ fs.mkdirSync(require('path').dirname(OUT), { recursive: true }); } catch(e){}
  const file = fs.createWriteStream(OUT);
  let received = 0;
  res.on('data', chunk=>{ received += chunk.length; });
  res.pipe(file);
  file.on('finish', ()=>{
    file.close(()=>{
      log({ ok:true, info, savedTo: OUT, bytes: received });
      console.log('OK', statusCode, 'saved', OUT, 'bytes', received);
      process.exit(0);
    });
  });
  file.on('error', err=>{
    log({ ok:false, info, error: err.message });
    console.error('FILE_ERR', err.message);
    process.exit(3);
  });
});
req.on('error', e=>{ log({ ok:false, error: e.message, url: WASM_URL }); console.error('HTTP_ERR', e.message); process.exit(1); });
req.setTimeout(8000, ()=>{ req.abort(); log({ ok:false, error:'timeout' }); console.error('TIMEOUT'); process.exit(4); });
