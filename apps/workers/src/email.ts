import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.SENDGRID_API_KEY) {
  console.warn("Warning: SENDGRID_API_KEY is not set. Email sending will fail.");
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function sendEmail(to: string, subject: string, body: string) {
  try {
    const [response] = await sgMail.send({
      to,
      from: process.env.SENDGRID_FROM_EMAIL || "noreply@example.com",
      subject,
      html: body,
    });

    console.log("Email sent via SendGrid, status: %d", response.statusCode);
    return response;
  } catch (error: any) {
    if (error.response) {
      console.error("SendGrid API error:", error.response.body);
    } else {
      console.error("Error sending email:", error);
    }
    throw error;
  }
}
