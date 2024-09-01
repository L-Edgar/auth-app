import express, { Express, Request, Response } from "express";
import { ResultObj, verifyAuth, verifyUsername } from "../../lib/index";
const { Op } = require("sequelize");
import User from "../../db/models/index";
import Otp from "../../db/models/otp";
import nodemailer from "nodemailer";
// import crypto from "crypto";
import {
  verifyPhone,
  verifyEmail,
  tokenRefresh,
  verifyAccessToken,
} from "../../lib/index";
import { where } from "sequelize";
const server: Express = express();
const cryptoJs = require("crypto-js");
const jwt = require("jsonwebtoken");

/*
  get user basing on user id
*/
server.get(
  "/single/:user_id",
  // verifyAccessToken,
  async (req: Request, res: Response) => {
    const user_id = req.params.user_id;
    try {
      const user = await User.findByPk(user_id);
      if (user) {
        const forward_result: ResultObj = {
          result: user,
          status: true,
          reason: "User found",
        };
        res.json(forward_result);
      } else {
        const forward_result: ResultObj = {
          status: false,
          reason: "User not found",
        };
        res.json(forward_result);
      }
    } catch (error) {
      console.error("Error:", error);
      const forward_result: ResultObj = {
        status: false,
        reason: "Server error",
      };
      res.json(forward_result);
    }
  }
);
/*
 * update user data
 *
 */
server.put(
  "/update/:user_id",
  tokenRefresh,
  verifyAccessToken,
  async (req: Request, res: Response) => {
    const user_id = req.params.user_id;
    const { email, username, first_name, last_name, phone } = req.body;

    try {
      // Check if the provided email is in a valid format
      if (!verifyEmail(email)) {
        const forward_result: ResultObj = {
          status: false,
          reason: "wrong email format",
        };
        return res.status(400).json(forward_result);
      }

      // Check if the provided phone number is in a valid format
      if (!verifyPhone(phone)) {
        const forward_result: ResultObj = {
          status: false,
          reason: "wrong number format",
        };
        return res.status(400).json(forward_result);
      }
      // verify username
      if (!verifyUsername(username)) {
        const forward_result: ResultObj = {
          status: false,
          reason: "wrong username formart",
        };
        return res.status(400).json(forward_result);
      }
      // }
      // Check if the email is already used by another user
      const existingUserWithEmail = await User.findOne({
        where: { email: email, user_id: { [Op.ne]: user_id } }, // Exclude the current user from the check
      });

      if (existingUserWithEmail) {
        const forward_result: ResultObj = {
          status: false,
          reason: "email already used",
        };
        return res.status(409).json(forward_result);
      }

      // Check if the username is already taken by another user
      const existingUsername = await User.findOne({
        where: { username: username, user_id: { [Op.ne]: user_id } }, // Exclude the current user from the check
      });

      if (existingUsername) {
        const forward_result: ResultObj = {
          status: false,
          reason: "username taken",
        };
        return res.status(409).json(forward_result);
      }

      // Check if the phone number is already taken by another user
      const existingPhone = await User.findOne({
        where: { phone: phone, user_id: { [Op.ne]: user_id } }, // Exclude the current user from the check
      });

      if (existingPhone) {
        const forward_result: ResultObj = {
          status: false,
          reason: "Phone number already used",
        };
        return res.status(409).json(forward_result);
      }

      // Update the user's data if all checks pass
      const user = await User.findByPk(user_id);
      if (user) {
        user.username = username || user.username;
        user.first_name = first_name || user.first_name;
        user.last_name = last_name || user.last_name;
        user.email = email || user.email;
        user.phone = phone || user.phone;
        await user.save();

        const return_user = {
          user_id: user.user_id,
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
        };

        const forward_result: ResultObj = {
          result: return_user,
          status: true,
          reason: "User updated",
        };
        res.status(200).json(forward_result); // OK
      } else {
        const forward_result: ResultObj = {
          status: false,
          reason: "User not found",
        };
        res.status(404).json(forward_result); // Not Found status code
      }
    } catch (error) {
      console.error("Error:", error);
      const forward_result: ResultObj = {
        status: false,
        reason: "Server error",
      };
      res.status(500).json(forward_result); // Internal Server Error status code
    }
  }
);

//delete a user account
// ..... in the future, this should be revised to away that when a user deletes his account,
// it does not completely delete in the db but rather in the view only
server.delete(
  "/delete/:user_id",
  tokenRefresh,
  async (req: Request, res: Response) => {
    const user_id = req.params.user_id;

    try {
      const user = await User.findByPk(user_id);

      if (user) {
        await user.destroy();
        const forward_result: ResultObj = {
          result: user,
          status: true,
          reason: "User destroyed",
        };
        res.status(200).json(forward_result);
      } else {
        const forward_result: ResultObj = {
          result: user,
          status: false,
          reason: "User not dound",
        };
        res.status(404).json(forward_result);
      }
    } catch (error) {
      console.error("Error:", error);
      const forward_result: ResultObj = {
        status: false,
        reason: "Server error",
      };
      res.status(500).json(forward_result); // Internal Server Error status code
    }
  }
);

/**
 * Reset password using OTP
 * 1. Enter email adress
 * 2. Request for OTP
 * 3. Enter new password
 * 4. Finish/complete
 **/

server.post("/request/otp", async (req: Request, res: Response) => {
  const body = {
    email: req.body.email,
  };
  try {
    // Check whether the provided email is valid
    if (verifyEmail(body.email)) {
      // Check whether the email exists in the database
      const user = await User.findOne({
        where: { email: body.email },
      });

      if (!user) {
        const forward_result: ResultObj = {
          status: false,
          reason: "email not found",
        };
        res.json(forward_result);
      } else {
        // Utility function to generate OTP
        function generateOTP(length: number) {
          const digits = "0123456789";
          let otp = "";
          for (let i = 0; i < length; i++) {
            otp += digits[Math.floor(Math.random() * 10)];
          }
          return otp;
        }

        // Generate OTP and expiry time
        const otp = generateOTP(6);
        const currentTime = new Date(); // Current UTC time
        const otpExpiry = new Date(currentTime.getTime() + 3 * 60 * 1000); // Expiry 3 minutes later

        // Save OTP to DB
        const saveOtp = await Otp.create({
          user_id: user.user_id,
          otp: otp,
          expiry: otpExpiry.toISOString(),
        });
        //create mail transporter
        const mail_transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "beaconhostels@gmail.com",
            pass: "wttdwlapdndotjtm",
          },
        });

        //configure message
        const mail = {
          from: '"Lyte" <beaconhostels@gmail.com>',
          to: user.email,
          subject: "OTP for Password Reset",
          text: `Your OTP for password reset is ${saveOtp.otp}. It is valid for 3 minutes.`,
        };

        //send email

        try {
          mail_transporter.sendMail(mail);
          const forward_result: ResultObj = {
            status: true,
            result: saveOtp,
            reason: "Email sent",
          };
          res.status(200).json(forward_result);
        } catch (error) {
          console.error("Error:", error);
          const forward_result: ResultObj = {
            status: false,
            reason: "Server error",
          };
          res.status(500).json(forward_result);
        }
      }
    } else {
      const forward_result: ResultObj = {
        status: false,
        reason: "wrong email format",
      };
      res.json(forward_result);
    }
  } catch (error) {
    console.log(error);
    const forward_result: ResultObj = {
      status: false,
      reason: "server error",
    };
    res.json(forward_result);
  }
});

/**
 *
 * Route for checking whether the OTP is valid or not
 *
 *
 **/
server.post("/verify/otp/:user_id", async (req: Request, res: Response) => {
  const user_id = req.params.user_id;
  const body = {
    otp: req.body.otp,
  };

  try {
    // Check if the user exists
    const user = await Otp.findOne({ where: { user_id: user_id } });

    if (!user) {
      const forward_result: ResultObj = {
        status: false,
        reason: "User does not exist",
      };
      return res.status(404).json(forward_result);
    }

    // Check the most current OTP for the user
    const otpRecord = await Otp.findOne({
      where: { user_id: user_id },
      order: [["createdAt", "DESC"]], // Get the latest OTP
    });

    if (!otpRecord) {
      const forward_result: ResultObj = {
        status: false,
        reason: "No OTP found",
      };
      return res.status(404).json(forward_result);
    }
    if (otpRecord.otp !== body.otp) {
      const forward_result: ResultObj = {
        status: false,
        reason: "OTP incorrect",
      };
      return res.status(400).json(forward_result);
    }
    // Validate the OTP
    const currentTimeUTC = new Date();
    const currentTime = new Date(currentTimeUTC.getTime() - 3 * 60 * 60 * 1000); // Current UTC time
    const otpExpiryTime = new Date(otpRecord.expiry);

    console.log("current time", currentTime);
    console.log("currentTimeUTC", currentTimeUTC);
    console.log("otpExpiryTime", otpExpiryTime);

    if (currentTime > otpExpiryTime) {
      const forward_result: ResultObj = {
        status: false,
        reason: "OTP expired",
      };
      return res.status(400).json(forward_result);
    }

    // All conditions are fulfilled, return true,
    const forward_result: ResultObj = {
      status: true,
      reason: "OTP verified",
    };
    return res.status(200).json(forward_result);
  } catch (error) {
    console.error("Error:", error);
    const forward_result: ResultObj = {
      status: false,
      reason: "Server error",
    };
    return res.status(500).json(forward_result);
  }
});

/*
 *  Route for resetting the password now,
 *  Here, we shall check the most current OTP in the db that
 *  corresponds with the user who is trying to update their password
 *  there after we shall check whether the OTP is correct and not expired
 *  there after, update the password.
 *
 *
 */

server.put("/reset/password/:user_id", async (req: Request, res: Response) => {
  const user_id = req.params.user_id;
  const body = {
    password: req.body.password,
    otp: req.body.otp,
  };

  try {
    // Check if the user exists
    const user = await Otp.findOne({ where: { user_id: user_id } });

    if (!user) {
      const forward_result: ResultObj = {
        status: false,
        reason: "User does not exist",
      };
      return res.status(404).json(forward_result);
    }

    // Check the most current OTP for the user
    const otpRecord = await Otp.findOne({
      where: { user_id: user_id },
      order: [["createdAt", "DESC"]], // Get the latest OTP
    });

    if (!otpRecord) {
      const forward_result: ResultObj = {
        status: false,
        reason: "No OTP found",
      };
      return res.status(404).json(forward_result);
    }

    if (otpRecord.otp !== body.otp) {
      const forward_result: ResultObj = {
        status: false,
        reason: "OTP incorrect",
      };
      return res.status(400).json(forward_result);
    }
    // Validate the OTP
    const currentTimeUTC = new Date();
    const currentTime = new Date(currentTimeUTC.getTime() - 3 * 60 * 60 * 1000); // Current UTC time
    const otpExpiryTime = new Date(otpRecord.expiry);

    if (currentTime > otpExpiryTime) {
      const forward_result: ResultObj = {
        status: false,
        reason: "OTP expired",
      };
      return res.status(400).json(forward_result);
    }

    if (verifyAuth(body.password)) {
      // All conditions are fulfilled, update the password
      const hashedPassword = cryptoJs.AES.encrypt(
        body.password,
        process.env.AUTH_SECRET
      ).toString();

      await User.update(
        { auth: hashedPassword },
        { where: { user_id: user_id } }
      );

      const forward_result: ResultObj = {
        status: true,
        result: hashedPassword,
        reason: "Password reset successfully",
      };
      return res.status(200).json(forward_result);
    } else {
      const forward_result: ResultObj = {
        status: false,
        reason: "Weak password",
      };
      res.json(forward_result);
    }
  } catch (error) {
    console.error("Error:", error);
    const forward_result: ResultObj = {
      status: false,
      reason: "Server error",
    };
    return res.status(500).json(forward_result);
  }
});

// get all OTPs for a user
server.get("/all/otp/:user_id", async (req: Request, res: Response) => {
  const user_id = req.params.user_id;
  try {
    const otps = await Otp.findAll({
      where: { user_id: user_id },
    });

    // If OTPs are found, return them
    if (otps.length > 0) {
      res.status(200).json({
        success: true,
        data: otps,
      });
    } else {
      // If no OTPs are found, return a message indicating so
      res.status(404).json({
        success: false,
        message: "No OTPs found for this user.",
      });
    }
  } catch (error) {
    console.error("Error:", error);
    const forward_result: ResultObj = {
      status: false,
      reason: "Server error",
    };
    res.json(forward_result);
  }
});

module.exports = server;
