

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

// Supabase Init
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pzrmkiawjawjwuyjwmeo.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

exports.handler = async (event) => {
    // 1. CORS Headers (Allow all origins to prevent CORS errors on live and localhost)
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    };

    // 2. Preflight (Browser Options Check)
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

        const cleanEmail = email && email.trim() !== '' ? email.trim() : null;
        const cleanPhone = phone && phone.trim() !== '' ? phone.trim() : null;
        const cleanName = name && name.trim() !== '' ? name.trim() : 'Anonymous';

        // ==========================================
        // 🚀 1. SUPABASE DATABASE MEIN SAVE KARNA
        // ==========================================
        if (supabase) {
            try {
                await supabase
                    .from('ip_form_submissions')
                    .insert([
                        {
                            visitor_id: visitor_id || 'unknown',
                            form_name: subject || 'Consultation Inquiry',
                            name: cleanName,
                            email: cleanEmail,
                            phone: cleanPhone,
                            all_fields: data
                        }
                    ]);
                console.log('✅ Lead saved to Supabase (ip_form_submissions)');
            } catch (dbErr) {
                console.error('Supabase save error:', dbErr);
            }
        }

        // ==========================================
        // 🚀 2. EMAIL CLIENT KI COMPANY EMAIL PAR BHEJNA
        // ==========================================
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        let mailOptions = {
            from: `"Irfan Patel Website" <${process.env.EMAIL_USER}>`,
            
            // 👈 Client ki company email address yahan set hai:
            to: "info@irfanpatel.com",
            
            // Client ke "Reply" karne par jawab customer ke email par jayega:
            replyTo: cleanEmail || "info@irfanpatel.com",

            subject: `⚡ New Consultation Booking from ${cleanName}: ${subject || 'Inquiry'}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 25px; border: 1px solid #e5e7eb; border-radius: 8px; max-width: 600px; color: #1f2937;">
                    <div style="background: #121820; color: #c5a059; padding: 15px; text-align: center; border-radius: 6px; margin-bottom: 20px;">
                        <h2 style="margin: 0; text-transform: uppercase; letter-spacing: 1px; color: #ffffff;">New Website Consultation Booking</h2>
                    </div>
                    
                    <p style="margin: 8px 0;"><strong>Client Name:</strong> ${cleanName}</p>
                    <p style="margin: 8px 0;"><strong>Email:</strong> ${cleanEmail ? `<a href="mailto:${cleanEmail}">${cleanEmail}</a>` : 'Not provided'}</p>
                    <p style="margin: 8px 0;"><strong>Phone:</strong> ${cleanPhone || 'Not provided'}</p>
                    <p style="margin: 8px 0;"><strong>Visitor ID:</strong> ${visitor_id || 'N/A'}</p>
                    
                    <p style="margin: 16px 0 8px 0;"><strong>Message / Requirements:</strong></p>
                    <div style="background: #f9fafb; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb; white-space: pre-line; line-height: 1.6;">
                        ${message || 'No additional details provided.'}
                    </div>

                    <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0 10px;" />
                    <p style="font-size: 11px; color: #9ca3af; text-align: center; margin: 0;">
                        This inquiry was submitted from the official irfanpatel.com website.
                    </p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ status: "success", message: "Form submitted and lead saved successfully!" }),
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