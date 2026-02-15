import nodemailer from 'nodemailer';
import Mailgen from 'mailgen';
import { logger } from './logger.js';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

const mailGenerator = new Mailgen({
    theme: 'default',
    product: {
        name: 'Auth-System',
        link: 'http://localhost:8000' 
    }
});


export const sendMail = async ({ userEmail, subject, intro, instructions, buttonText, buttonLink, outro }) => {
    try {
        const emailBody = {
            body: {
                name: userEmail.split('@')[0],
                intro: intro,
                action: {
                    instructions: instructions,
                    button: {
                        color: '#48bb78', 
                        text: buttonText,
                        link: buttonLink
                    }
                },
                outro: outro || 'If you did not request this, please ignore this email.'
            }
        };

        const html = mailGenerator.generate(emailBody);
        
        await transporter.sendMail({
            from: `"Auth-System Admin" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject,
            html
        });

        logger.info(`Email [${subject}] sent to ${userEmail}`);
    } catch (error) {
        logger.error({ error: error.message }, "Mailer Error");
    
    }
};


export const sendOTPEmail = async (email, otp) => {
    return await sendMail({
        userEmail: email,
        subject: 'Your Verification Code - Auth-System',
        intro: `Your One-Time Password (OTP) for registration is: <b>${otp}</b>`,
        instructions: 'Please enter this code on the verification page. It will expire in 5 minutes.',
        outro: 'This is a secure code. Do not share it with anyone.'
    });
};


export const sendWelcomeEmail = async (email) => {
    return await sendMail({
        userEmail: email,
        subject: 'Welcome to Auth-System!',
        intro: 'Welcome to the platform! Your account has been successfully verified.',
        instructions: 'You can now log in and explore all the features of our management system.',
        outro: 'We are glad to have you on board!'
    });
};