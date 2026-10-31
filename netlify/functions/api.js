

// const nodemailer = require('nodemailer');

// exports.handler = async (event) => {
//     // 1. Define CORS headers
//     const headers = {
//         'Access-Control-Allow-Origin': 'https://irfanpatel.com/', // Allows requests from any domain (including your local machine)
//         'Access-Control-Allow-Headers': 'Content-Type',
//         'Access-Control-Allow-Methods': 'POST, OPTIONS',
//     };

//     // 2. Handle the "Preflight" request (Sent by the browser automatically)
//     if (event.httpMethod === "OPTIONS") {
//         return {
//             statusCode: 200,
//             headers,
//             body: ''
//         };
//     }

//     // 3. Only allow POST requests for the actual form submission
//     if (event.httpMethod !== "POST") {
//         return { 
//             statusCode: 405, 
//             headers,
//             body: JSON.stringify({ error: "Method Not Allowed" }) 
//         };
//     }

//     try {
//         const data = JSON.parse(event.body);
//         const { name, email, subject, message } = data;

//         let transporter = nodemailer.createTransport({
//             service: 'gmail',
//             auth: {
//                 user: process.env.EMAIL_USER,
//                 pass: process.env.EMAIL_PASS,
//             },
//         });

//         let mailOptions = {
//             from: `"Website Contact" <${process.env.EMAIL_USER}>`,
//             to: "info@irfanpatel.com, muhammadirfanpatel@hotmail.com",
//             subject: `New Inquiry: ${subject || 'No Subject'}`,
//             html: `
//                 <div style="font-family: sans-serif; padding: 20px;">
//                     <h2>New Form Submission</h2>
//                     <p><strong>Name:</strong> ${name}</p>
//                     <p><strong>Email:</strong> ${email}</p>
//                     <p><strong>Message:</strong></p>
//                     <p style="background: #f4f4f4; padding: 15px; white-space: pre-line;">${message}</p>
//                 </div>
//             `,
//         };

//         await transporter.sendMail(mailOptions);

//         return {
//             statusCode: 200,
//             headers, // Include CORS headers here
//             body: JSON.stringify({ status: "success", message: "Email sent successfully" }),
//         };
//     } catch (error) {
//         console.error("Function Error:", error);
//         return {
//             statusCode: 500,
//             headers, // Include CORS headers here
//             body: JSON.stringify({ status: "error", error: error.message }),
//         };
//     }
// };

const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

// 🚀 1. Supabase Client Initialize
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pzrmkiawjawjwuyjwmeo.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEy);
}

exports.handler = async (event) => {
    
    const allowedOrigins = [
        'https://irfanpatel.com',
        'https://www.irfanpatel.com',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000/'
    ];

    const origin = event.headers.origin || event.headers.Origin;
    const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

    const headers = {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    // 3. Preflight Request
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== "POST") {
        return { 
            statusCode: 405, 
            headers,
            body: JSON.stringify({ error: "Method Not Allowed" }) 
        };
    }

    try {
        const data = JSON.parse(event.body || '{}');
        const { name, email, phone, subject, message, visitor_id } = data;

        // 🚀 4. NULL HANDLER: Agar email ya phone na ho, toh error na aaye balkay null set ho
        const cleanEmail = email && email.trim() !== '' ? email.trim() : null;
        const cleanPhone = phone && phone.trim() !== '' ? phone.trim() : null;
        const cleanName = name && name.trim() !== '' ? name.trim() : 'Anonymous';

        // 🚀 5. SUPABASE DATABASE MEIN SAVE KARNA
        if (supabase) {
            try {
                const { error: dbError } = await supabase
                    .from('ip_form_submissions')
                    .insert([
                        {
                            visitor_id: visitor_id || 'unknown',
                            form_name: subject || 'Contact Form Submission',
                            name: cleanName,
                            email: cleanEmail,   // Missing hone par automatically null jayega
                            phone: cleanPhone,   // Missing hone par automatically null jayega
                            all_fields: data
                        }
                    ]);

                if (dbError) {
                    console.error('Supabase Save Error:', dbError.message);
                } else {
                    console.log('✅ Form submission saved in Supabase (ip_form_submissions)');
                }
            } catch (dbErr) {
                console.error('Database connection non-fatal error:', dbErr);
            }
        }

        // 🚀 6. NODEMAILER EMAIL SENDING
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        let mailOptions = {
            from: `"Website Contact" <${process.env.EMAIL_USER}>`,
            to: "info@irfanpatel.com, muhammadirfanpatel@hotmail.com",
            replyTo: cleanEmail || process.env.EMAIL_USER,
            subject: `New Inquiry: ${subject || 'No Subject'}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 25px; border: 1px solid #e5e7eb; border-radius: 8px; max-width: 600px; color: #1f2937;">
                    <h2 style="color: #111827; border-bottom: 2px solid #f3f4f6; padding-bottom: 12px; margin-top: 0;">
                        New Form Submission
                    </h2>
                    <p style="margin: 8px 0;"><strong>Name:</strong> ${cleanName}</p>
                    <p style="margin: 8px 0;"><strong>Email:</strong> ${cleanEmail ? `<a href="mailto:${cleanEmail}">${cleanEmail}</a>` : 'Not provided'}</p>
                    <p style="margin: 8px 0;"><strong>Phone:</strong> ${cleanPhone || 'Not provided'}</p>
                    <p style="margin: 8px 0;"><strong>Visitor Cookie ID:</strong> ${visitor_id || 'N/A'}</p>
                    <p style="margin: 16px 0 8px 0;"><strong>Message:</strong></p>
                    <div style="background: #f9fafb; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb; white-space: pre-line; line-height: 1.6;">
                        ${message || 'No message content provided.'}
                    </div>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ status: "success", message: "Form submitted and lead saved successfully" }),
        };
    } catch (error) {
        console.error("Function Error:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ status: "error", error: error.message }),
        };
    }
};