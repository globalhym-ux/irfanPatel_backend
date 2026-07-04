const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
    // Sirf POST requests allow karne ke liye
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        // Form ka data parse karein
        const data = JSON.parse(event.body);
        const { name, email, subject, message } = data;

        // Transporter setup (Yahan aapko apni SMTP details dalni hongi)
        // Behtar hai ke aap Environment Variables use karein (Step 3 dekhein)
        let transporter = nodemailer.createTransport({
            host: "your-smtp-host.com", // Maslan: smtp.gmail.com ya mail.irfanpatel.com
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER, // Aapka email
                pass: process.env.EMAIL_PASS, // Aapka password ya App Password
            },
        });

        // Email options - Yahan 2 emails add kiye hain
        let mailOptions = {
            from: `"Website Form" <${process.env.EMAIL_USER}>`,
            to: "info@irfanpatel.com, muhammadirfanpatel@hotmail.com", // Comma separated emails
            subject: `New Form Submission: ${subject || 'No Subject'}`,
            html: `
                <h3>New Contact Request</h3>
                <p><b>Name:</b> ${name}</p>
                <p><b>Email:</b> ${email}</p>
                <p><b>Message:</b></p>
                <p>${message}</p>
            `,
        };

        // Email bhejein
        await transporter.sendMail(mailOptions);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Email sent successfully!" }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Error sending email", error: error.toString() }),
        };
    }
};