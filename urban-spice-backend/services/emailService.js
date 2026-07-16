const nodemailer = require('nodemailer');

/**
 * Builds a reusable SMTP transporter from environment variables.
 * Works with Gmail (App Password), SendGrid SMTP, Mailtrap, or any
 * standard SMTP provider.
 */
const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

const fromAddress = () =>
  `"${process.env.EMAIL_FROM_NAME || 'Urban Spice'}" <${process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER}>`;

/**
 * Sends an email. Failures are logged, never thrown — a customer-facing
 * booking/contact submission should still succeed even if the email
 * provider is temporarily down.
 */
const sendMail = async ({ to, subject, html }) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({ from: fromAddress(), to, subject, html });
    return true;
  } catch (error) {
    console.error(`Email send failed (${subject} -> ${to}):`, error.message);
    return false;
  }
};

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

/* ---------------------------------------------------------------------
   Reservation emails
   --------------------------------------------------------------------- */

const sendReservationConfirmationToCustomer = (reservation) =>
  sendMail({
    to: reservation.email,
    subject: 'Your Urban Spice reservation request',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#14110F;">
        <h2 style="color:#A8412B;">Urban Spice</h2>
        <p>Hi ${reservation.customerName},</p>
        <p>Thanks for booking with us — here's what we received:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:6px 0;color:#6b6058;">Date</td><td style="padding:6px 0;"><strong>${formatDate(reservation.date)}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#6b6058;">Time</td><td style="padding:6px 0;"><strong>${reservation.time}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#6b6058;">Guests</td><td style="padding:6px 0;"><strong>${reservation.guests}</strong></td></tr>
        </table>
        <p>Your table is currently <strong>pending confirmation</strong>. Our team will confirm by phone within two hours.</p>
        <p style="color:#6b6058;font-size:13px;margin-top:24px;">Urban Spice · 48 Lantern Street, Downtown District · +1 (555) 201-4477</p>
      </div>
    `,
  });

const sendReservationNotificationToAdmin = (reservation) =>
  sendMail({
    to: process.env.RESTAURANT_ADMIN_EMAIL,
    subject: `New reservation — ${reservation.customerName} (${reservation.guests} guests)`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#14110F;">
        <h2 style="color:#A8412B;">New Reservation Request</h2>
        <ul>
          <li><strong>Name:</strong> ${reservation.customerName}</li>
          <li><strong>Email:</strong> ${reservation.email}</li>
          <li><strong>Phone:</strong> ${reservation.phone}</li>
          <li><strong>Date:</strong> ${formatDate(reservation.date)}</li>
          <li><strong>Time:</strong> ${reservation.time}</li>
          <li><strong>Guests:</strong> ${reservation.guests}</li>
          <li><strong>Special request:</strong> ${reservation.specialRequest || '—'}</li>
        </ul>
      </div>
    `,
  });

/* ---------------------------------------------------------------------
   Contact emails
   --------------------------------------------------------------------- */

const sendContactNotificationToAdmin = (contact) =>
  sendMail({
    to: process.env.RESTAURANT_ADMIN_EMAIL,
    subject: `New contact message from ${contact.name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#14110F;">
        <h2 style="color:#A8412B;">New Contact Message</h2>
        <ul>
          <li><strong>Name:</strong> ${contact.name}</li>
          <li><strong>Email:</strong> ${contact.email}</li>
          <li><strong>Phone:</strong> ${contact.phone || '—'}</li>
        </ul>
        <p style="margin-top:12px;white-space:pre-wrap;">${contact.message}</p>
      </div>
    `,
  });

module.exports = {
  sendReservationConfirmationToCustomer,
  sendReservationNotificationToAdmin,
  sendContactNotificationToAdmin,
};
