/**
 * sendSMS.js
 * Real-time SMS Dispatch Gateway
 * Supports Twilio, Fast2SMS, 2Factor, and automated console logging.
 */

export const sendSMS = async ({ phone, otp, message }) => {
  const textMessage =
    message || `Your ChatApp verification code is ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;

  console.log(`\n======================================================`);
  console.log(`📲 [REAL-TIME PHONE OTP GATEWAY]`);
  console.log(`📞 Recipient Number: ${phone}`);
  console.log(`🔑 Verification OTP: ${otp}`);
  console.log(`💬 SMS Content: "${textMessage}"`);
  console.log(`⏰ Dispatched At: ${new Date().toISOString()}`);
  console.log(`======================================================\n`);

  let dispatched = false;
  const dispatchErrors = [];

  // 1. Try Twilio if configured
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    (process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_MESSAGING_SERVICE_SID)
  ) {
    try {
      const auth = Buffer.from(
        `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
      ).toString("base64");

      const bodyParams = new URLSearchParams();
      bodyParams.append("To", phone);
      bodyParams.append("Body", textMessage);
      if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
        bodyParams.append("MessagingServiceSid", process.env.TWILIO_MESSAGING_SERVICE_SID);
      } else {
        bodyParams.append("From", process.env.TWILIO_PHONE_NUMBER);
      }

      const twilioRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: bodyParams.toString(),
        }
      );

      const twilioData = await twilioRes.json();
      if (twilioRes.ok) {
        console.log(`✅ [Twilio SMS Delivered] SID: ${twilioData.sid}`);
        dispatched = true;
      } else {
        console.warn(`⚠️ [Twilio SMS Warning]: ${twilioData.message || JSON.stringify(twilioData)}`);
        dispatchErrors.push(`Twilio: ${twilioData.message}`);
      }
    } catch (err) {
      console.warn(`⚠️ [Twilio Network Error]:`, err.message);
      dispatchErrors.push(`Twilio error: ${err.message}`);
    }
  }

  // 2. Try Fast2SMS if configured (popular for Indian numbers)
  if (!dispatched && process.env.FAST2SMS_API_KEY) {
    try {
      const cleanDigits = phone.replace(/[^0-9]/g, "").slice(-10);
      const f2sRes = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "otp",
          variables_values: otp,
          numbers: cleanDigits,
        }),
      });

      const f2sData = await f2sRes.json();
      if (f2sData.return) {
        console.log(`✅ [Fast2SMS Delivered] Request ID: ${f2sData.request_id}`);
        dispatched = true;
      } else {
        console.warn(`⚠️ [Fast2SMS Warning]:`, f2sData.message);
        dispatchErrors.push(`Fast2SMS: ${f2sData.message}`);
      }
    } catch (err) {
      console.warn(`⚠️ [Fast2SMS Network Error]:`, err.message);
      dispatchErrors.push(`Fast2SMS error: ${err.message}`);
    }
  }

  // 3. Try 2Factor if configured
  if (!dispatched && process.env.TWOFACTOR_API_KEY) {
    try {
      const cleanDigits = phone.replace(/[^0-9]/g, "").slice(-10);
      const tfRes = await fetch(
        `https://2factor.in/v1/API/V1/${process.env.TWOFACTOR_API_KEY}/SMS/${cleanDigits}/${otp}/ChatApp+OTP`
      );
      const tfData = await tfRes.json();
      if (tfData.Status === "Success") {
        console.log(`✅ [2Factor SMS Delivered] Session: ${tfData.Details}`);
        dispatched = true;
      } else {
        console.warn(`⚠️ [2Factor Warning]:`, tfData.Details);
      }
    } catch (err) {
      console.warn(`⚠️ [2Factor Network Error]:`, err.message);
    }
  }

  return {
    success: true,
    dispatchedRealSms: dispatched,
    phone,
    otp,
    errors: dispatchErrors.length ? dispatchErrors : undefined,
  };
};

export default sendSMS;
