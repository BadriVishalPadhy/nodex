import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, body: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "nodex <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      html: body,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(error.message);
    }

    console.log("Message sent: %s", data?.id);
    return data;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}
