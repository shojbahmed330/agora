// api/token.js
const { RtcTokenBuilder, RtmTokenBuilder, RtcRole, RtmRole } = require("agora-token");

module.exports = (req, res) => {
  try {
    const APP_ID = process.env.APP_ID;
    const APP_CERTIFICATE = process.env.APP_CERTIFICATE;

    if (!APP_ID || !APP_CERTIFICATE) {
      return res.status(500).json({ error: "Missing APP_ID or APP_CERTIFICATE in env vars" });
    }

    const query = req.method === "GET" ? req.query : req.body || {};
    const channelName = query.channelName;
    const uid = query.uid || "0";
    const role = (query.role || "publisher").toLowerCase();
    const tokenType = (query.tokentype || "rtc").toLowerCase();
    const expiry = parseInt(query.expiry, 10) || 3600; // default 1 hour

    if (!channelName) {
      return res.status(400).json({ error: "channelName is required" });
    }

    if (tokenType === "rtc") {
      const uidInt = Number(uid) || 0;
      const roleConst =
        role === "publisher" || role === "host"
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
      return res.json({ rtcToken: token, expiresIn: expiry });
    }

    if (tokenType === "rtm") {
      const token = RtmTokenBuilder.buildToken(
        APP_ID,
        APP_CERTIFICATE,
        String(uid),
        RtmRole.Rtm_User,
        expiry
      );
      return res.json({ rtmToken: token, expiresIn: expiry });
    }

    return res.status(400).json({ error: "Invalid tokenType. Use rtc or rtm." });
  } catch (err) {
    console.error("Token error:", err);
    res.status(500).json({ error: "Internal server error", message: err.message });
  }
};
