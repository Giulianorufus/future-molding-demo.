const http = require('http');
const fs = require('fs');
const url = require('url');

const WASM_URL = process.env.WASM_URL || 'http://localhost:5174/vendor/occt/occt-import-js.wasm';
const OUT_PATH = process.env.OUT_PATH || 'tmp/occt-import-js.wasm';
const RETRIES = +process.env.RETRIES || 15;
const DELAY_MS = +process.env.DELAY_MS || 1000;

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function fetchOnce(wasmUrl){
  return new Promise((resolve, reject)=>{
    const parsed = url.parse(wasmUrl);
    const get = parsed.protocol === 'https:' ? require('https').get : http.get;
    const req = get(wasmUrl, (res)=>{
      const { statusCode } = res;
      if (statusCode !== 200) {
        res.resume();
        resolve({ ok:false, statusCode });
        return;
      }
      // stream to file
      const dir = require('path').dirname(OUT_PATH);
      try { fs.mkdirSync(dir, { recursive: true }); } catch(e){}
      const file = fs.createWriteStream(OUT_PATH);
      res.pipe(file);
      file.on('finish', ()=>{
        file.close(()=> resolve({ ok:true, statusCode }));
      });
      file.on('error',(err)=>{ res.resume(); resolve({ ok:false, error:err.message }); });
    });
    req.on('error',(err)=> resolve({ ok:false, error:err.message }));
    req.setTimeout(8000, ()=>{ req.abort(); resolve({ ok:false, error:'timeout' }); });
  });
}

(async ()=>{
  console.log('check-wasm: url=', WASM_URL);
  for(let i=0;i<RETRIES;i++){
    process.stdout.write(`attempt ${i+1}/${RETRIES} ... `);
    try{
      const r = await fetchOnce(WASM_URL);
      if(r.ok){
        console.log(`OK (status ${r.statusCode}) saved to ${OUT_PATH}`);
        process.exit(0);
      } else {
        console.log(`NOT_OK ${r.statusCode ? 'status:'+r.statusCode : 'err:'+r.error}`);
      }
    } catch(e){
      console.log('ERR', e && e.message);
    }
    await sleep(DELAY_MS);
  }
  console.error('GAVE UP: wasm not available after retries');
  process.exit(2);
})();
