exports.forgotPassword = function (OTP) {
  return `
    <div style="max-width: 600px; margin: auto; background: #f9f9f9; padding: 20px; border-radius: 10px; text-align: center; font-family: Arial, sans-serif; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
      <h2 style="color: #333;">🔐 Your OTP Code</h2>
      <p style="font-size: 18px; color: #555;">Use the OTP below to verify your identity:</p>
      <div style="font-size: 24px; font-weight: bold; color: #4CAF50; background: #fff; display: inline-block; padding: 15px 30px; margin: 20px 0; border-radius: 5px; box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);">
        ${OTP}
      </div>
      <p style="font-size: 14px; color: #777;">This OTP is valid for only 1 hour.</p>
      <p style="font-size: 14px; color: #777;">If you didn't request this, please ignore this email.</p>
    </div>
  `;
};


exports.forgetPasswordLinkHTML = function (req, link) {
  const logoUrl = `${req.protocol}://${req.get("host")}/assets/logo1.png`;

  return `
  <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px; font-family: Arial, sans-serif; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1); text-align: center; border: 1px solid #ddd;">
  
  <!-- Logo (Dynamically Loaded) -->
  <div style="margin-bottom: 20px;">
    <img src="${logoUrl}" alt="Company Logo" style="width: 150px;">
  </div>

  <h2 style="color: #333;">🔐 Password Reset Request</h2>
  <p style="font-size: 18px; color: #555;">You requested to reset your password. Click the button below to proceed:</p>

  <!-- Reset Password Button -->
  <a href="${link}" target="_blank" style="display: inline-block; padding: 12px 25px; font-size: 16px; color: #fff; background: #4CAF50; text-decoration: none; border-radius: 5px; margin-top: 10px; font-weight: bold;">
    Reset Password
  </a>

  <p style="font-size: 14px; color: #777; margin-top: 20px;">This link is valid for **1 hour**.</p>
  <p style="font-size: 14px; color: #777;">If you didn’t request this, please ignore this email.</p>

  <!-- Footer -->
  <hr style="border: 0.5px solid #ddd; margin: 20px 0;">
  <p style="font-size: 12px; color: #999;">&copy; 2025 YourCompany. All rights reserved.</p>

</div>
  `;
};


exports.accountApproved = function (email, password, loginUrl) {
  return `
    <div style="max-width: 600px; margin: auto; background: #f9f9f9; padding: 20px; border-radius: 10px; text-align: center; font-family: Arial, sans-serif; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
      <h2 style="color: #333;">🎉 Welcome to Our Platform!</h2>
      
      <p style="font-size: 16px; color: #555;">Thank you for registering with us. Below are your account credentials:</p>
      
      <div style="text-align: left; display: inline-block; margin: 20px auto; background: #fff; padding: 15px 25px; border-radius: 8px; box-shadow: 0 0 5px rgba(0,0,0,0.05); font-size: 16px; color: #333;">
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password}</p>
      </div>

      <a href="${loginUrl}" style="display: inline-block; margin-top: 20px; background-color: #4CAF50; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-size: 16px;">Login to Sub Admin</a>

      <p style="font-size: 13px; color: #999; margin-top: 30px;">
        If you did not request this, please ignore this email.
      </p>
    </div>
  `;
};
