// Placeholder email utility — swap sendEmail() body for SendGrid/Resend/Nodemailer when ready.
// Everything else (sendVerificationEmail, sendGroupInviteEmail) stays the same.

async function sendEmail({ to, subject, html }) {
  console.log(`[EMAIL PLACEHOLDER] To: ${to} | Subject: ${subject}`)
  console.log(html)
}

async function sendVerificationEmail(email, token) {
  const link = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`
  await sendEmail({
    to: email,
    subject: "Verify your Krystle's Cottage email",
    html: `<p>Click to verify your email: <a href="${link}">${link}</a></p>`,
  })
}

async function sendGroupInviteEmail(email, inviteCode, groupName, inviterName) {
  const link = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/welcome?code=${inviteCode}`
  await sendEmail({
    to: email,
    subject: `You've been invited to join ${groupName} on Krystle's Cottage`,
    html: `<p>${inviterName} has invited you to join their group <strong>${groupName}</strong>.</p>
           <p>Your invite code is: <strong>${inviteCode}</strong></p>
           <p>Or click here to join directly: <a href="${link}">${link}</a></p>`,
  })
}

module.exports = { sendVerificationEmail, sendGroupInviteEmail }
