import { EmailTemplate } from "../interfaces/email-template.interface";

export const signupOtpTemplate = (
    otp: string,
    expiresIn: number,
): EmailTemplate => ({
    subject: 'Verify Your Email Address',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Verify Your Email</title>
</head>
<body style="
  margin:0;
  padding:0;
  background:#f5f7fb;
  font-family:Arial,sans-serif;
">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="
          background:#ffffff;
          border-radius:12px;
          overflow:hidden;
          box-shadow:0 2px 10px rgba(0,0,0,0.08);
        ">

          <!-- Header -->
          <tr>
            <td align="center" style="
              padding:32px;
              border-bottom:1px solid #eeeeee;
            ">
              <img
                src="https://your-domain.com/logo.png"
                alt="App Logo"
                width="60"
                height="60"
              />

              <h1 style="
                margin:12px 0 0;
                font-size:24px;
                color:#222;
              ">
                Your App Name
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px;">
              <h2 style="
                margin-top:0;
                color:#222;
              ">
                Verify Your Email
              </h2>

              <p style="
                color:#555;
                line-height:1.6;
              ">
                Thanks for signing up. Use the verification code below to
                complete your registration.
              </p>

              <div style="
                margin:30px 0;
                background:#f4f6f8;
                border-radius:10px;
                text-align:center;
                padding:20px;
              ">
                <span style="
                  font-size:34px;
                  font-weight:700;
                  letter-spacing:8px;
                  color:#111;
                ">
                  ${otp}
                </span>
              </div>

              <p style="
                color:#555;
                line-height:1.6;
              ">
                This code will expire in
                <strong>${expiresIn} minutes</strong>.
              </p>

              <p style="
                color:#555;
                line-height:1.6;
              ">
                If you did not create an account, you can safely ignore this
                email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="
              background:#fafafa;
              padding:20px;
              font-size:12px;
              color:#888;
              border-top:1px solid #eeeeee;
            ">
              © ${new Date().getFullYear()} Your App Name.
              All rights reserved.
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