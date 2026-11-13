import { createHash, randomBytes, randomUUID } from 'node:crypto';

const token = randomBytes(32).toString('base64url');
const device = { id: randomUUID(), sha256: createHash('sha256').update(token).digest('hex'), enabled: true };
console.log('Private device token (enter on this device only; do not commit or share):');
console.log(token);
console.log('Append this record to server DEVICE_TOKENS_JSON:');
console.log(JSON.stringify(device));
