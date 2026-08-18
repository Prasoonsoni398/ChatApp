import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import sendEmail from '../utils/sendEmail.js';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const otp = generateOTP();
        const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        const user = await User.create({
            name,
            email,
            password,
            otp,
            otpExpires,
        });

        if (user) {
            await sendEmail({
                email: user.email,
                subject: 'Verify your email - ChatApp',
                html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ChatApp OTP Verification</title>
</head>

<body class="bg-base-200 text-base-content" style="
  margin:0;
  padding:0;
  background:#f3f4f6;
  font-family:Arial, Helvetica, sans-serif;
  color:#1f2937;
">

  <table width="100%" cellpadding="0" cellspacing="0" border="0"
    class="bg-base-200" style="background:#f3f4f6; padding:40px 15px;">
    <tr>
      <td align="center">

        <!-- Main Container -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          class="bg-base-100 border-base-300"
          style="
            max-width:600px;
            background:#ffffff;
            border-radius:20px;
            overflow:hidden;
            border:1px solid #e5e7eb;
          ">

          <!-- Header -->
          <tr>
            <td align="center" class="bg-primary text-primary-content"
              style="
                background:#4f46e5;
                padding:32px 20px;
              ">

              <div class="bg-primary-content text-primary" style="
                width:58px;
                height:58px;
                line-height:58px;
                background:#ffffff;
                color:#4f46e5;
                border-radius:16px;
                font-size:25px;
                font-weight:bold;
                margin-bottom:15px;
              ">
                C
              </div>

              <h1 class="text-primary-content" style="
                margin:0;
                color:#ffffff;
                font-size:28px;
                font-weight:700;
              ">
                Welcome to ChatApp
              </h1>

              <p class="text-primary-content/80" style="
                margin:8px 0 0;
                color:#e0e7ff;
                font-size:15px;
              ">
                Your secure communication starts here.
              </p>

            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px 35px;">

              <h2 class="text-base-content" style="
                margin:0 0 12px;
                font-size:23px;
                color:#1f2937;
              ">
                Verify your account 🔐
              </h2>

              <p class="text-base-content/70" style="
                margin:0 0 25px;
                color:#4b5563;
                font-size:15px;
                line-height:1.7;
              ">
                We received a request to verify your ChatApp account.
                Use the verification code below to continue.
              </p>

              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" class="bg-primary/10 border-primary"
                    style="
                      background:#eef2ff;
                      border:2px dashed #4f46e5;
                      border-radius:14px;
                      padding:22px;
                    ">

                    <p class="text-base-content/60" style="
                      margin:0 0 8px;
                      font-size:12px;
                      color:#6b7280;
                      text-transform:uppercase;
                      letter-spacing:2px;
                      font-weight:bold;
                    ">
                      Your OTP
                    </p>

                    <div class="text-primary" style="
                      font-size:36px;
                      letter-spacing:10px;
                      font-weight:700;
                      color:#4f46e5;
                      padding-left:10px;
                    ">
                      ${otp}
                    </div>

                  </td>
                </tr>
              </table>

              <!-- Expiry -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                style="margin-top:22px;">
                <tr>
                  <td align="center">

                    <div class="bg-warning/20 text-warning-content" style="
                      display:inline-block;
                      background:#fef3c7;
                      color:#92400e;
                      padding:9px 16px;
                      border-radius:30px;
                      font-size:13px;
                      font-weight:600;
                    ">
                      ⏱ Expires in 10 minutes
                    </div>

                  </td>
                </tr>
              </table>

              <p class="text-base-content/70" style="
                margin:28px 0 0;
                color:#4b5563;
                font-size:14px;
                line-height:1.7;
                text-align:center;
              ">
                Please do not share this OTP with anyone.
                ChatApp will never ask you for this code.
              </p>

              <!-- Divider -->
              <div class="bg-base-300" style="
                height:1px;
                background:#e5e7eb;
                margin:30px 0;
              "></div>

              <!-- Security Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="bg-base-200" style="
                    background:#f9fafb;
                    border-radius:12px;
                    padding:18px;
                  ">

                    <p class="text-base-content" style="
                      margin:0 0 6px;
                      font-weight:700;
                      font-size:14px;
                      color:#1f2937;
                    ">
                      🛡️ Security Notice
                    </p>

                    <p class="text-base-content/70" style="
                      margin:0;
                      font-size:13px;
                      line-height:1.6;
                      color:#4b5563;
                    ">
                      If you didn't request this verification code,
                      you can safely ignore this email.
                    </p>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" class="bg-base-200 border-base-300"
              style="
                background:#f9fafb;
                padding:25px 20px;
                border-top:1px solid #e5e7eb;
              ">

              <p class="text-base-content/70" style="
                margin:0 0 8px;
                font-size:13px;
                color:#4b5563;
              ">
                © ${new Date().getFullYear()} ChatApp
              </p>

              <p class="text-base-content/50" style="
                margin:0;
                font-size:12px;
                color:#9ca3af;
              ">
                Secure. Simple. Connected.
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
                `,
            });

            res.status(201).json({
                message: 'OTP sent to your email. Please verify to complete registration.',
                userId: user._id,
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'User is already verified' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (Date.now() > user.otpExpires) {
            return res.status(400).json({ message: 'OTP has expired' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.json({
            message: 'Email verified successfully',
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            if (!user.isVerified) {
                return res.status(401).json({ message: 'Please verify your email first' });
            }
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
