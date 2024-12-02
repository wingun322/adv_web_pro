const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// 이메일 전송 전에 연결 테스트
transporter.verify(function(error, success) {
  if (error) {
    console.log('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready to take our messages');
  }
});

exports.sendVerificationCode = async (email, verificationCode) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '이메일 인증 코드',
      html: `
        <h1>이메일 인증 코드</h1>
        <p>아래의 인증 코드를 입력해주세요:</p>
        <h2 style="color: #007bff; font-size: 24px; letter-spacing: 2px;">${verificationCode}</h2>
        <p>이 인증 코드는 10분 동안 유효합니다.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}; 