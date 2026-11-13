import { createHash, randomBytes, randomUUID } from 'node:crypto';

const token = randomBytes(32).toString('base64url');
const device = { id: randomUUID(), sha256: createHash('sha256').update(token).digest('hex'), enabled: true };
console.log('Private device token (enter on this device only; do not commit or share):');
console.log(token);
// The server expects a JSON array; printing it ready to paste avoids a bare-object misconfiguration.
console.log('Paste this as server DEVICE_TOKENS_JSON (to add devices, put more records inside the same brackets):');
console.log(JSON.stringify([device]));
