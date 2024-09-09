import express, { Express, Request, Response } from "express";
import { ResultObj, verifyAuth, verifyUsername } from "../../lib/index";
const { Op } = require("sequelize");
import User from "../../db/models/index";
import Otp from "../../db/models/otp";
import nodemailer from "nodemailer";
// import uploadMedia from "../../lib/index";
import multer, { Multer } from "multer";
import path from "path";
// import axios from "axios";
// import crypto from "crypto";
import {
  verifyPhone,
  verifyEmail,
  tokenRefresh,
  verifyAccessToken,
} from "../../lib/index";
const server: Express = express();
const cryptoJs = require("crypto-js");
const jwt = require("jsonwebtoken");

/*
  get user basing on user id
*/
server.get(
  "/single/user/:user_id",
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

get a user by kanlyte_id. 

*/

server.get("/single/id/:kanlyte_id", async (req: Request, res: Response) => {
  const kanlyte_id = req.params.kanlyte_id;

  try {
    const user = await User.findOne({
      where: { kanlyte_id: kanlyte_id },
    });
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
});

/**
 *
 * get all users
 */

server.get(
  "/all/user",
  verifyAccessToken,
  async (req: Request, res: Response) => {
    try {
      const users = await User.findAll();
      if (users && users.length > 0) {
        const forward_result: ResultObj = {
          result: users,
          status: true,
          reason: "Users found",
        };
        res.json(forward_result);
      } else {
        const forward_result: ResultObj = {
          status: false,
          reason: "No users found",
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

/***
 * handling user profile....
 * since we already have N/A in the db, we shall only write the put route.
 * so, in front end they will check if user prfile = N/A then they display an avator
 *  else display the image in the db.
 *
 * ***/

const storage = multer.diskStorage({
  destination: (req: Request, file: any, cb: any) => {
    cb(null, "uploads/"); // Folder where files will be stored
  },
  filename: (req: Request, file: any, cb: any) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// File filter to accept only certain file types
const fileFilter = (req: Request, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only .jpeg, .jpg and .png files are allowed"));
  }
};

const uploadMedia: Multer = multer({ storage, fileFilter });

server.put(
  "/user/profile",
  verifyAccessToken,
  uploadMedia.single("profilePicture"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.body;
      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          status: false,
          reason: "User not found",
        });
      }
      // Get the path of the uploaded file
      const { path: profilePicture } = req.file || {};

      if (profilePicture) {
        // Update the user profile with the picture URL
        user.profile_picture = profilePicture;
        await user.save();

        return res.json({
          status: true,
          reason: "Profile updated successfully",
          result: user,
        });
      } else {
        return res.status(400).json({
          status: false,
          reason: "Profile picture not provided",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({
        status: false,
        reason: "Server error",
      });
    }
  }
);

module.exports = server;