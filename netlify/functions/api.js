// const nodemailer = require('nodemailer');

// exports.handler = async (event, context) => {
//     // Sirf POST requests allow karne ke liye
//     if (event.httpMethod !== "POST") {
//         return { statusCode: 405, body: "Method Not Allowed" };
//     }

//     try {
//         // Form ka data parse karein
//         const data = JSON.parse(event.body);
//         const { name, email, subject, message } = data;

//         // Transporter setup (Yahan aapko apni SMTP details dalni hongi)
//         // Behtar hai ke aap Environment Variables use karein (Step 3 dekhein)
//         let transporter = nodemailer.createTransport({
//             host: "your-smtp-host.com", // Maslan: smtp.gmail.com ya mail.irfanpatel.com
//             port: 465,
//             secure: true, // true for 465, false for other ports
//             auth: {
//                 user: process.env.EMAIL_USER, // Aapka email
//                 pass: process.env.EMAIL_PASS, // Aapka password ya App Password
//             },
//         });

//         // Email options - Yahan 2 emails add kiye hain
//         let mailOptions = {
//             from: `"Website Form" <${process.env.EMAIL_USER}>`,
//             to: "info@irfanpatel.com, muhammadirfanpatel@hotmail.com", // Comma separated emails
//             subject: `New Form Submission: ${subject || 'No Subject'}`,
//             html: `
//                 <h3>New Contact Request</h3>
//                 <p><b>Name:</b> ${name}</p>
//                 <p><b>Email:</b> ${email}</p>
//                 <p><b>Message:</b></p>
//                 <p>${message}</p>
//             `,
//         };

//         // Email bhejein
//         await transporter.sendMail(mailOptions);

//         return {
//             statusCode: 200,
//             body: JSON.stringify({ message: "Email sent successfully!" }),
//         };
//     } catch (error) {
//         console.error(error);
//         return {
//             statusCode: 500,
//             body: JSON.stringify({ message: "Error sending email", error: error.toString() }),
//         };
//     }
// };

const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
    // Check if Method is POST
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const data = JSON.parse(event.body);
        const { name, email, phone, message } = data; // Jo fields aapke form mein hain

        // 1. SMTP Transporter (cPanel Settings)
        let transporter = nodemailer.createTransport({
            host: "mail.irfanpatel.com", // cPanel ka outgoing server
            port: 465, // SSL ke liye 465 best hai
            secure: true, // true for 465
            auth: {
                user: process.env.EMAIL_USER, // info@irfanpatel.com
                pass: process.env.EMAIL_PASS, // cPanel email password
            },
            tls: {
                rejectUnauthorized: false // Taake certificate issue na aaye
            }
        });

        // 2. Email Options (Dono mails yahan add hain)
        let mailOptions = {
            from: `"Irfan Patel Website" <info@irfanpatel.com>`, 
            to: "info@irfanpatel.com, muhammadirfanpatel@hotmail.com", // Comma se separate karein
            subject: `New Inquiry from ${name}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee;">
                    <h2 style="color: #333;">New Website Message</h2>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Sender Email:</strong> ${email}</p>
                    <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
                    <p><strong>Message:</strong></p>
                    <p style="background: #f9f9f9; padding: 10px; border-left: 5px solid #007bff;">${message}</p>
                </div>
            `,
        };

        // 3. Send Email
        await transporter.sendMail(mailOptions);

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "success", message: "Email Sent Successfully!" }),
        };

    } catch (error) {
        console.error("Error details:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ status: "error", message: error.message }),
        };
    }
};