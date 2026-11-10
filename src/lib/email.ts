import nodemailer from 'nodemailer'

type OtpEmailOptions = {
  to: string
  otp: string
  purpose: 'verification' | 'password-reset'
}

type AccountStatusEmailOptions = {
  to: string
  name: string
  approved: boolean
}

type PaymentStatusEmailOptions = {
  to: string
  name: string
  amount: number
  currency: string
  status: 'COMPLETED' | 'FAILED'
}

function getTransporter() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const password = process.env.SMTP_PASSWORD

  if (!host || !user || !password) return null

  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE?.trim().toLowerCase() === 'true',
    auth: { user, pass: password },
  })
}

export function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD &&
    process.env.SMTP_FROM,
  )
}

export async function sendOtpEmail({ to, otp, purpose }: OtpEmailOptions) {
  const transporter = getTransporter()
  const from = process.env.SMTP_FROM

  if (!transporter || !from) {
    throw new Error('SMTP email settings are not configured')
  }

  const subject = purpose === 'verification' ? 'Verify your AlumniNexus email' : 'Your AlumniNexus password reset OTP'
  const action = purpose === 'verification' ? 'verify your email address' : 'reset your password'

  await transporter.sendMail({
    from,
    to,
    subject,
    text: `Your OTP is ${otp}. Use this code to ${action}. It expires in 10 minutes.`,
    html: `<p>Your OTP is:</p><h2>${otp}</h2><p>Use this code to ${action}. It expires in 10 minutes.</p><p>If you did not request this code, you can ignore this email.</p>`,
  })
}

export async function sendAccountStatusEmail({ to, name, approved }: AccountStatusEmailOptions) {
  const transporter = getTransporter()
  const from = process.env.SMTP_FROM

  if (!transporter || !from) throw new Error('SMTP email settings are not configured')

  const subject = approved ? 'Your AlumniNexus account was approved' : 'Update on your AlumniNexus registration'
  const message = approved
    ? 'Your account has been approved. You can now log in to AlumniNexus.'
    : 'Your account was not approved at this time. Please contact your department administration for more information.'

  await transporter.sendMail({
    from,
    to,
    subject,
    text: `Hello ${name}, ${message}`,
    html: `<p>Hello ${name},</p><p>${message}</p>`,
  })
}

export async function sendPaymentStatusEmail({ to, name, amount, currency, status }: PaymentStatusEmailOptions) {
  const transporter = getTransporter()
  const from = process.env.SMTP_FROM
  if (!transporter || !from) throw new Error('SMTP email settings are not configured')

  const successful = status === 'COMPLETED'
  const message = successful
    ? `Your payment of ${currency} ${amount} was successful.`
    : `Your payment of ${currency} ${amount} was not completed. No amount was charged by this portal.`

  await transporter.sendMail({
    from,
    to,
    subject: successful ? 'Razorpay payment successful' : 'Razorpay payment failed',
    text: `Hello ${name}, ${message}`,
    html: `<p>Hello ${name},</p><p>${message}</p>`,
  })
}

type DonationReceiptEmailOptions = {
  to: string
  name: string
  amount: number
  currency: string
  purpose: string
  paymentReference: string
  paidAt: Date
  organizationName?: string
}

function escapeEmailHtml(value: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return value.replace(/[&<>"']/g, (character) => entities[character] || character)
}

export async function sendDonationReceiptEmail({
  to,
  name,
  amount,
  currency,
  purpose,
  paymentReference,
  paidAt,
  organizationName = 'College AlumniNexus',
}: DonationReceiptEmailOptions) {
  const transporter = getTransporter()
  const from = process.env.SMTP_FROM
  if (!transporter || !from) throw new Error('SMTP email settings are not configured')

  const escapedName = escapeEmailHtml(name)
  const escapedPurpose = escapeEmailHtml(purpose)
  const escapedReference = escapeEmailHtml(paymentReference)
  const escapedOrganization = escapeEmailHtml(organizationName)
  const amountText = `${currency} ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const paidAtText = paidAt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

  await transporter.sendMail({
    from,
    to,
    subject: 'Donation receipt and letter of appreciation',
    text: [
      `Dear ${name},`,
      `Thank you for your ${purpose} donation of ${amountText}.`,
      `Receipt reference: ${paymentReference}`,
      `Payment verified on: ${paidAtText}`,
      'Your contribution is sincerely appreciated by the college alumni community.',
      organizationName,
    ].join('\n\n'),
    html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#172b22">
      <h1 style="color:#047857">Donation receipt</h1>
      <p>Dear ${escapedName},</p>
      <p>This email confirms that your donation payment was verified successfully.</p>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;border:1px solid #ddd">Donation purpose</td><td style="padding:8px;border:1px solid #ddd">${escapedPurpose}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd">Amount</td><td style="padding:8px;border:1px solid #ddd">${escapeEmailHtml(amountText)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd">Receipt reference</td><td style="padding:8px;border:1px solid #ddd">${escapedReference}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd">Payment verified</td><td style="padding:8px;border:1px solid #ddd">${escapeEmailHtml(paidAtText)}</td></tr>
      </table>
      <h2 style="color:#047857">Letter of appreciation</h2>
      <p>Thank you for supporting our college community. Your contribution is sincerely appreciated and will be recorded under the purpose shown above.</p>
      <p>With gratitude,<br />${escapedOrganization}</p>
    </div>`,
  })
}
