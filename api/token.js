// api/token.js
const { RtcTokenBuilder, RtmTokenBuilder, RtcRole, RtmRole } = require('agora-token');

module.exports = (req, res) => {
  try {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const APP_ID = process.env.APP_ID;
    const APP_CERTIFICATE = process.env.APP_CERTIFICATE;

    if (!APP_ID || !APP_CERTIFICATE) {
      return res.status(500).json({ error: 'Missing APP_ID or APP_CERTIFICATE in environment variables' });
    }

    const q = req.method === 'GET' ? req.query : (req.body || {});
    const uid = (q.uid === undefined || q.uid === null) ? '0' : String(q.uid);
    const callee = q.callee ? String(q.callee) : null;
    const role = (q.role || 'publisher').toLowerCase();
    const tokenType = (q.tokentype || 'rtc').toLowerCase();
    const expiry = parseInt(q.expiry, 10) || 3600;

    // channelName generate
    let channelName = q.channelName;
    if (!channelName) {
      if (callee) {
        channelName = `call_${[uid, callee].sort().join('_')}`;
      } else {
        channelName = `call_${uid}_${Date.now()}`;
      }
    }

    if (tokenType === 'rtc') {
      const roleConst =
        (role === 'publisher' || role === 'host')
          ? RtcRole.PUBLISHER
          : RtcRole.SUBSCRIBER;

      let token;
      let responseUid;

      // ✅ যদি numeric uid হয়
      if (!isNaN(Number(uid))) {
        token = RtcTokenBuilder.buildTokenWithUid(
          APP_ID,
          APP_CERTIFICATE,
          channelName,
          Number(uid),
          roleConst,
          expiry
        );
        responseUid = Number(uid);
      } else {
        // ✅ যদি string uid হয়
        token = RtcTokenBuilder.buildTokenWithAccount(
          APP_ID,
          APP_CERTIFICATE,
          channelName,
          uid,
          roleConst,
          expiry
        );
        responseUid = uid;
      }

      return res.json({
        rtcToken: token,
        expiresIn: expiry,
        channelName,
        uid: responseUid
      });
    }

    if (tokenType === 'rtm') {
      const token = RtmTokenBuilder.buildToken(
        APP_ID,
        APP_CERTIFICATE,
        String(uid),
        RtmRole.Rtm_User,
        expiry
      );

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
