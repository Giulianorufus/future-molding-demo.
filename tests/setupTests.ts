import "@testing-library/jest-dom";

if (typeof (global as any).setImmediate === 'undefined') {
	(global as any).setImmediate = (callback: (...args: any[]) => void, ...args: any[]) => setTimeout(callback, 0, ...args);
}

// Polyfill TextEncoder/TextDecoder for Node/Jest environments
if (typeof (global as any).TextEncoder === 'undefined') {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { TextEncoder, TextDecoder } = require('util');
	(global as any).TextEncoder = TextEncoder;
	(global as any).TextDecoder = TextDecoder;
}

// Ensure a crypto.subtle.digest implementation is available (Node.js compatibility)
if (typeof (global as any).crypto === 'undefined' || typeof (global as any).crypto.subtle === 'undefined') {
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const { webcrypto } = require('node:crypto');
		if (webcrypto && webcrypto.subtle) {
			(global as any).crypto = webcrypto;
		} else {
			// Fallback: implement minimal subtle.digest using Node crypto
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const nodeCrypto = require('crypto');
			(global as any).crypto = {
				subtle: {
					digest: async (_alg: string, data: ArrayBuffer) => {
						const hash = nodeCrypto.createHash('sha256');
						const buf = Buffer.from(data as any);
						hash.update(buf);
						const d = hash.digest();
						return d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength);
					}
				}
			};
		}
	} catch (e) {
		// ignore
	}
}

