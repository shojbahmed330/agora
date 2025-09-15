// api/token.js
const { RtcTokenBuilder, RtmTokenBuilder, RtcRole, RtmRole } = require('agora-token');

/**
 * GET /api/token?channelName=...&uid=...&role=publisher&tokentype=rtc&expiry=3600
 * or POST JSON { channelName, uid, role, tokentype, expiry }
 *
 * Query params / body:
 * - channelName (required)
 * - uid (optional, default "0")  // you can pass number or string. Here we use numeric UID for buildTokenWithUid
 * - role (publisher | subscriber) default publisher
 * - tokentype (rtc | rtm) default rtc
 * - expiry (seconds) default 3600
 *
 * Response:
 * {
 *   "rtcToken": "...",
 *   "expiresIn": 3600,
 *   "channelName":"...",
 *   "uid":"..."
 * }
 */

module.exports = (req, res) => {
  try {
    const APP_ID = process.env.APP_ID;
    const APP_CERTIFICATE = process.env.APP_CERTIFICATE;

    if (!APP_ID || !APP_CERTIFICATE) {
      return res.status(500).json({ error: 'Missing APP_ID or APP_CERTIFICATE in environment variables' });
    }

    const q = req.method === 'GET' ? req.query : (req.body || {});
    const channelName = q.channelName;
    const uid = (q.uid === undefined || q.uid === null) ? '0' : String(q.uid);
    const role = (q.role || 'publisher').toLowerCase();
    const tokenType = (q.tokentype || 'rtc').toLowerCase();
    const expiry = parseInt(q.expiry, 10) || 3600; // seconds

    if (!channelName) {
      return res.status(400).json({ error: 'channelName is required' });
    }

    if (tokenType === 'rtc') {
      // use numeric uid if possible; Agora buildTokenWithUid expects number uid
      const uidInt = Number(uid) || 0;
      const roleConst = (role === 'publisher' || role === 'host') ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
      const token = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, uidInt, roleConst, expiry);
      return res.json({
        rtcToken: token,
        expiresIn: expiry,
        channelName,
        uid: uidInt
      });
    }

    if (tokenType === 'rtm') {
      const token = RtmTokenBuilder.buildToken(APP_ID, APP_CERTIFICATE, String(uid), RtmRole.Rtm_User, expiry);
      return res.json({
        rtmToken: token,
        expiresIn: expiry,
        channelName,
        uid
      });
    }

    return res.status(400).json({ error: 'invalid tokentype (use rtc or rtm)' });
  } catch (err) {
    console.error('token error', err);
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
};
