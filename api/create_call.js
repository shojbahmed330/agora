// api/create_call.js
const { v4: uuidv4 } = require('uuid');

/**
 * POST /api/create_call
 * Body (JSON):
 * {
 *   "callerId": "123",
 *   "calleeId": "456",
 *   "oneTime": false   // optional; default false
 * }
 *
 * Response:
 * {
 *   "callId": "...",           // a unique id for this call (uuid)
 *   "channelName": "call_123_456",  // or call_<uuid> if oneTime
 *   "createdAt": 169xxx
 * }
 *
 * NOTE: This server DOES NOT notify the callee. Your app should:
 *  - call this endpoint (caller)
 *  - then notify callee (push/socket/in-app) with channelName & callId
 *  - callee will then call /api/token to get token and join
 */

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    const body = req.body || {};
    const callerId = String(body.callerId || '').trim();
    const calleeId = String(body.calleeId || '').trim();
    const oneTime = !!body.oneTime;

    if (!callerId || !calleeId) {
      return res.status(400).json({ error: 'callerId and calleeId are required' });
    }

    // Deterministic pair-based channel name (same pair => same channel)
    // Use sorted ids so order (A,B) or (B,A) gives same name.
    let channelName;
    if (oneTime) {
      channelName = 'call_' + uuidv4(); // brand new channel every time
    } else {
      const a = callerId < calleeId ? callerId : calleeId;
      const b = callerId < calleeId ? calleeId : callerId;
      // sanitize: remove spaces, special chars (keep simple)
      const safeA = a.replace(/\s+/g, '_').replace(/[^\w-]/g, '');
      const safeB = b.replace(/\s+/g, '_').replace(/[^\w-]/g, '');
      channelName = `call_${safeA}_${safeB}`;
    }

    const callId = uuidv4();
    const createdAt = Date.now();

    // NOTE: If you want to persist call record, save (callId, channelName, callerId, calleeId, createdAt) in DB here.

    return res.json({
      callId,
      channelName,
      callerId,
      calleeId,
      oneTime,
      createdAt
    });
  } catch (err) {
    console.error('create_call error', err);
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
};
