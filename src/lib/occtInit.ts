// Helper per inizializzare occt-import-js in modo robusto sia in browser
// che in Node (test). Espone una funzione `initOcct()` che prova a caricare
// dinamicamente la libreria e inizializzarla con `locateFile` puntato a
// `public/vendor/occt`.

export async function initOcct() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('occt-import-js');
    const factory = (mod && (mod.default || mod)) as any;
    if (!factory) throw new Error('occt-import-js not available');

    const locateFile = (path: string) => {
      try {
        // In dev browser we expect /vendor/occt/
        if (typeof window !== 'undefined') return `/vendor/occt/${path}`;
        // In Node (tests) try project public folder
        const p1 = require('path').join(process.cwd(), 'public', 'vendor', 'occt', path);
        const fs = require('fs');
        if (fs.existsSync(p1)) return p1;
        // Fallback to C:\vendor\occt
        const p2 = require('path').join('C:\\vendor\\occt', path);
        if (fs.existsSync(p2)) return p2;
      } catch (_) {
        // ignore
      }
      return `/vendor/occt/${path}`;
    };

    // factory may be sync or async
    const maybe = factory({ locateFile });
    const occt = maybe && typeof maybe.then === 'function' ? await maybe : maybe;
    return occt;
  } catch (err) {
    // non fatali: caller deve gestire fallback
    // eslint-disable-next-line no-console
    console.warn('initOcct failed:', (err && err.message) || err);
    return null;
  }
}

export default initOcct;
// Centralized initializer for occt-import-js with lifecycle hardening and logging
import * as log from '@/lib/log';

let _cached: any = null;
let _unloadTimer: any = null;
let _isKilling = false;
let _initCount = 0;
let _lastInitAt: number | null = null;

export async function getOcct() {
  if (_unloadTimer) { clearTimeout(_unloadTimer); _unloadTimer = null; }
  if (_cached) {
    log.debug('occt: returning cached instance');
    return _cached;
  }
  _initCount += 1;
  _lastInitAt = Date.now();
  log.info('occt: initializing (count=', _initCount, ')');
  const mod = await import('occt-import-js');
  const init = (mod as any).default ?? mod;
  // locateFile: prefer bundled public/vendor/occt in browser; in Node/tests try project-relative public path or C:\vendor\occt
  const locateFile = (p: string) => {
    try {
      // Node / test environment
      if (typeof window === 'undefined') {
        const pathMod = require('path');
        const fs = require('fs');
        const candidate = pathMod.join(process.cwd(), 'public', 'vendor', 'occt', p);
        if (fs.existsSync(candidate)) return 'file://' + candidate.replace(/\\/g, '/');
        const alt = pathMod.join('C:', 'vendor', 'occt', p);
        if (fs.existsSync(alt)) return alt;
        // fallback to absolute-like URL used in browser
        return '/vendor/occt/' + p;
      }
      // Browser: use public served path
      return `/vendor/occt/${p}`;
    } catch (e) {
      return `/vendor/occt/${p}`;
    }
  };

  const occt = await init({ locateFile });
  _cached = occt;
  log.info('occt: initialized');
  return occt;
}

async function _attemptTerminate(instance: any) {
  try {
    if (!instance) return;
    // prefer explicit terminate/dispose APIs
    if (typeof instance.terminate === 'function') {
      log.debug('occt: calling instance.terminate()');
      await Promise.resolve(instance.terminate());
    }
    if (typeof instance.dispose === 'function') {
      log.debug('occt: calling instance.dispose()');
      await Promise.resolve(instance.dispose());
    }
    // Some builds expose a `_worker` property
    if (instance._worker && typeof instance._worker.terminate === 'function') {
      log.debug('occt: terminating underlying worker');
      try { instance._worker.terminate(); } catch (e) { log.warn('occt: worker.terminate error', e); }
    }
  } catch (err) {
    log.warn('occt: error while attempting terminate/dispose', err);
  }
}

// Forcefully kill the occt instance with a timeout and retries. Returns true if resource freed.
export async function killOcct(timeoutMs = 5000, retries = 1) {
  if (_isKilling) {
    log.warn('occt: kill already in progress');
    return false;
  }
  _isKilling = true;
  try {
    for (let attempt = 0; attempt <= retries; attempt++) {
      const inst = _cached;
      if (!inst) {
        log.debug('occt: nothing to kill');
        _cached = null;
        return true;
      }
      log.info(`occt: kill attempt ${attempt + 1}/${retries + 1}`);
      const race = Promise.race([
        _attemptTerminate(inst),
        new Promise((_, rej) => setTimeout(() => rej(new Error('terminate timeout')), timeoutMs))
      ]);
      try {
        await race;
      } catch (e) {
        log.warn('occt: terminate attempt failed or timed out', e);
      }
      // if instance didn't clear, try to null pointers
      try { _cached = null; } catch (e) { log.warn('occt: unable to null _cached', e); }
      if (!_cached) {
        log.info('occt: successfully killed/cleared');
        return true;
      }
      // otherwise, small delay before retry
      await new Promise((res) => setTimeout(res, 250));
    }
    log.warn('occt: kill attempts exhausted, instance may still be resident');
    return false;
  } finally {
    _isKilling = false;
    _unloadTimer = null;
  }
}

// Schedule unload of occt instance after inactivity (ms). Best-effort: call dispose/terminate if available.
export function scheduleUnloadOcct(timeoutMs = 30000) {
  if (_unloadTimer) clearTimeout(_unloadTimer);
  log.debug('occt: schedule unload in', timeoutMs, 'ms');
  _unloadTimer = setTimeout(async () => {
    log.info('occt: unload timer fired; attempting kill');
    try {
      await killOcct(5000, 1);
    } catch (e) {
      log.warn('occt: error during scheduled kill', e);
    } finally {
      _cached = null;
      _unloadTimer = null;
    }
  }, timeoutMs) as any;
  try {
    // allow Node to exit even if unload timer is pending
    if (_unloadTimer && typeof _unloadTimer.unref === 'function') {
      try { _unloadTimer.unref(); } catch (_) { /* ignore */ }
    }
  } catch (_) {}
}

export function clearUnloadSchedule() {
  if (_unloadTimer) { clearTimeout(_unloadTimer); _unloadTimer = null; log.debug('occt: cleared unload schedule'); }
}

export function getOcctStatus() {
  return {
    initialized: !!_cached,
    isKilling: !!_isKilling,
    initCount: _initCount,
    lastInitAt: _lastInitAt,
  };
}
