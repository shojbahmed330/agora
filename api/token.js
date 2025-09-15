// api/token.js
const { RtcTokenBuilder, RtmTokenBuilder, RtcRole, RtmRole } = require('agora-token');

module.exports = (req, res) => {
  try {
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
    const expiry = parseInt(q.expiry, 10) || 3600; // default 1 hour

    // channelName generate
    let channelName = q.channelName;
    if (!channelName) {
      if (callee) {
        // caller + callee মিলিয়ে deterministic channel name বানানো
        channelName = `call_${[uid, callee].sort().join('_')}`;
      } else {
        // যদি শুধু uid থাকে, তাহলে random unique channel বানাবে
        channelName = `call_${uid}_${Date.now()}`;
      }
    }

    if (tokenType === 'rtc') {
      const uidInt = Number(uid) || 0;
      const roleConst = (role === 'publisher' || role === 'host')
        ? RtcRole.PUBLISHER
        : RtcRole.SUBSCRIBER;

      const token = RtcTokenBuilder.buildTokenWithUid(
        APP_ID,
        APP_CERTIFICATE,
        channelName,
        uidInt,
        roleConst,
        expiry
      );

      return res.json({
        rtcToken: token,
        expiresIn: expiry,
        channelName,
        uid: uidInt
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
