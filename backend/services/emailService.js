import nodemailer from 'nodemailer'
import { logger } from '../utils/logger.js'

const isProd = process.env.NODE_ENV === 'production'

let cachedTransporter = null
function getTransporter() {
  if (cachedTransporter) return cachedTransporter
  if (!process.env.SMTP_HOST) return null
  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  })
  return cachedTransporter
}

const escape = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c])

const baseLayout = (title, body) => `
  <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#0f172a;color:#e2e8f0;border-radius:12px">
    <h1 style="color:#38bdf8;margin:0 0 16px">${escape(title)}</h1>
    ${body}
    <p style="color:#64748b;font-size:12px;margin-top:24px">AlgoVision AI · This is an automated message, please do not reply.</p>
  </div>`

export const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = getTransporter()
  const from = process.env.MAIL_FROM || 'no-reply@algovision.ai'
  if (!transporter) {

    logger.info(
      { to, subject, text: text || html, dev: true },
      '📧 [DEV] Email not sent (no SMTP configured); would have sent above'
    )
    return { delivered: false, dev: true }
  }
  const info = await transporter.sendMail({ from, to, subject, html, text })
  return { delivered: true, messageId: info.messageId }
}

export const buildVerificationEmail = ({ name, verifyUrl }) => ({
  subject: 'Verify your AlgoVision AI email',
  html: baseLayout(
    'Verify your email',
    `<p>Hi ${escape(name)},</p>
     <p>Welcome to AlgoVision AI! Please confirm your email address by clicking the button below.</p>
     <p style="margin:24px 0"><a href="${escape(verifyUrl)}" style="background:#38bdf8;color:#0f172a;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Verify email</a></p>
     <p>This link expires in 24 hours. If you did not sign up, you can safely ignore this message.</p>`
  ),
  text: `Welcome to AlgoVision AI! Verify your email: ${verifyUrl}`,
})

export const buildPasswordResetEmail = ({ name, resetUrl }) => ({
  subject: 'Reset your AlgoVision AI password',
  html: baseLayout(
    'Reset your password',
    `<p>Hi ${escape(name)},</p>
     <p>We received a request to reset your password. Click the button below to choose a new one.</p>
     <p style="margin:24px 0"><a href="${escape(resetUrl)}" style="background:#38bdf8;color:#0f172a;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Reset password</a></p>
     <p>This link expires in 1 hour. If you did not request a reset, you can safely ignore this message — your password is unchanged.</p>`
  ),
  text: `Reset your password: ${resetUrl}`,
})

export const isEmailEnabled = () => isProd && Boolean(process.env.SMTP_HOST)
