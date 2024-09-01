import express, { Express, Request, Response } from "express";
import { ResultObj } from "../../lib";
import User, { user } from "../../db/models/index";
const shortid = require("shortid");
const { uid } = require("uid");

import {
  verifyPhone,
  verifyEmail,
  verifyAuth,
  verifyUsername,
} from "../../lib";
const cryptoJs = require("crypto-js");
const jwt = require("jsonwebtoken");

const server: Express = express();
/*    
End points here
1. /account  ----  for signup
2. /login  ------- for signin
3. /check-username/:username     for checking availability and validity of username
4. /check-email/:email           for checking availability and validity of email
5. /check-phone/:phone           for checking availability and vakidity of phone number
*/
//account creation
/*
/account is a post request for creation of user account. 
it expects attributes as specified in method body below
*/
server.post("/account", async (req: Request, res: Response) => {
  const body = {
    first_name: req.body.first_name as string,
    last_name: req.body.last_name as string,
    email: req.body.email as string,
    username: req.body.username as string,
    phone: req.body.phone as string,
    auth: req.body.auth as string,
  } as user;
  try {
    /*
    Email should be a true email eg abc@dce.com
    */
    if (verifyEmail(body.email)) {
      /*
      Auth (password) should have 8 charactors minimumly, 
      Contain upper case, special charactor and a number
      */
      if (verifyAuth(body.auth)) {
        /*
        Only ug phone numbers are accepted
        start with +256 .... or 07.....
        */
        if (verifyPhone(body.phone)) {
          /*
          Must atleast have 3 characters
          No space in between 
          Not morethan eight characters
          */
          if (verifyUsername(body.username)) {
            //check email availability
            const email_check = await User.findOne({
              where: { email: body.email },
            });
            //encrypt auth
            const encryptedAuth = cryptoJs.AES.encrypt(
              body.auth,
              process.env.AUTH_SECRET
            ).toString();
            if (!email_check) {
              //check username availability
              const username_check = await User.findOne({
                where: { username: body.username },
              });
              if (!username_check) {
                //check phone availability
                const phone_check = await User.findOne({
                  where: { phone: body.phone },
                });
                if (!phone_check) {
                  //create unique kanlyte_id
                  let kanlyte_id = uid(32);
                  // Check if the generated kanlyte_id already exists
                  while (await User.findOne({ where: { kanlyte_id } })) {
                    kanlyte_id = uid(32);
                  }

                  const user = await User.create({
                    kanlyte_id: kanlyte_id,
                    email: body.email,
                    first_name: body.first_name,
                    last_name: body.last_name,
                    username: body.username,
                    phone: body.phone,
                    auth: encryptedAuth,
                  });
                  const forward_result: ResultObj = {
                    result: user,
                    status: true,
                    reason: "user created",
                  };
                  res.json(forward_result);
                } else {
                  const forward_result: ResultObj = {
                    status: false,
                    reason: "phone number already used",
                  };
                  res.json(forward_result);
                }
              } else {
                const forward_result: ResultObj = {
                  status: false,
                  reason: "username taken",
                };
                res.json(forward_result);
              }
            } else {
              const forward_result: ResultObj = {
                status: false,
                reason: "email already used",
              };
              res.json(forward_result);
            }
          } else {
            const forward_result: ResultObj = {
              status: false,
              reason: "invalid username",
              // username should not have space, greater than 2 charactors and lessthan 10 characters
            };
            res.json(forward_result);
          }
        } else {
          const forward_result: ResultObj = {
            status: false,
            reason: "wrong contact format",
          };
          res.json(forward_result);
        }
      } else {
        const forward_result: ResultObj = {
          status: false,
          reason: "Weak password",
        };
        res.json(forward_result);
      }
    } else {
      const forward_result: ResultObj = {
        status: false,
        reason: "wrong email format",
      };
      res.json(forward_result);
    }
  } catch (error) {
    const forward_result: ResultObj = {
      status: false,
      reason: "Server error",
    };
    res.json(forward_result);
  }
});

//user login
server.post("/login", async (req: Request, res: Response) => {
  const body = {
    email: req.body.email as string,
    auth: req.body.auth as string,
  } as user;
  try {
    if (verifyEmail(body.email)) {
      const user = await User.findOne({
        where: { email: body.email },
      });
      if (user) {
        // Decrypt the password stored in the database
        const decryptedAuth = cryptoJs.AES.decrypt(
          user.auth,
          process.env.AUTH_SECRET
        ).toString(cryptoJs.enc.Utf8);

        if (decryptedAuth === body.auth) {
          //generate access token
          const access_token = jwt.sign(
            {
              kanlyte_id: user.kanlyte_id,
              user_id: user.user_id,
              email: user.email,
              phone: user.phone,
              auth: user.auth,
            },
            process.env.ACCESS_SECRET,
            {
              expiresIn: "1d",
            }
          );
          //generate a refresh token
          const refresh_token = jwt.sign(
            {
              kanlyte_id: user.kanlyte_id,
              user_id: user.user_id,
              email: user.email,
              phone: user.phone,
              auth: user.auth,
            },
            process.env.REFRESH_SECRET,
            { expiresIn: "7d" }
          );
          const enc_refresh_token = cryptoJs.AES.encrypt(
            refresh_token,
            process.env.ENC_REFRESH_SECRET
          ).toString();
          //store encrypted refresh token in the db
          user.refresh_token = enc_refresh_token;
          await user.save();

          const return_user = {
            kanlyte_id: user.kanlyte_id,
            user_id: user.user_id,
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            email: user.email,
            phone: user.phone,
            auth: user.auth,
            role: user.role,
            refresh_token: enc_refresh_token,
            access_token: access_token,
          };
          const forward_result: ResultObj = {
            status: true,
            result: return_user,
            reason: "login sucessful",
          };
          res.json(forward_result);
        } else {
          const forward_result: ResultObj = {
            status: false,
            reason: "Wrong password",
          };
          res.json(forward_result); // Unauthorized status code
        }
      } else {
        const forward_result: ResultObj = {
          status: false,
          reason: "User not found",
        };
        res.json(forward_result); // Not Found status code
      }
    } else {
      const forward_result: ResultObj = {
        status: false,
        reason: "Wrong email format",
      };
      res.json(forward_result); // Bad Request status code
    }
  } catch (error) {
    console.error("Error:", error);
    const forward_result: ResultObj = {
      status: false,
      reason: "Server error",
    };
    res.json(forward_result); // Internal Server Error status code
  }
});

// search routes
/*

search whether the username 
if available, return username available, if taken return username taken

this applies to email and phone number as well

*/

// Route to check username availability and validity
server.get("/check/username/:username", async (req: Request, res: Response) => {
  const username = req.params.username;
  try {
    // Check if the username exists
    if (verifyUsername(username)) {
      const existingUser = await User.findOne({ where: { username } });

      if (!existingUser) {
        const forward_result: ResultObj = {
          status: true,
          reason: "username available",
        };
        res.json(forward_result);
      } else {
        const forward_result: ResultObj = {
          status: false,
          reason: "username taken",
        };
        res.json(forward_result);
      }
    } else {
      const forward_result: ResultObj = {
        status: false,
        reason: "invalid username",
        // username should not have space, greater than 2 charactors and lessthan 10 characters
      };
      res.json(forward_result);
    }
  } catch (error) {
    console.error("Error:", error);
    const forward_result: ResultObj = {
      status: false,
      reason: "server error",
    };
    res.json(forward_result);
  }
});

// Route to check email availability and validity
server.get("/check/email/:email", async (req: Request, res: Response) => {
  const email = req.params.email;

  try {
    // Check if the email exists
    if (verifyEmail(email)) {
      const existingEmail = await User.findOne({ where: { email } });

      if (!existingEmail) {
        const forward_result: ResultObj = {
          status: true,
          reason: "email available",
        };
        res.json(forward_result);
      } else {
        const forward_result: ResultObj = {
          status: false,
          reason: "email taken",
        };
        res.json(forward_result);
      }
    } else {
      const forward_result: ResultObj = {
        status: false,
        reason: "invalid email",
      };
      res.json(forward_result);
    }
  } catch (error) {
    console.error("Error:", error);
    const forward_result: ResultObj = {
      status: false,
      reason: "server error",
    };
    res.json(forward_result);
  }
});

// Route to check phone availability and validity
server.get("/check/phone/:phone", async (req: Request, res: Response) => {
  const phone = req.params.phone;

  try {
    // Check if the username exists
    if (verifyPhone(phone)) {
      const existingPhone = await User.findOne({ where: { phone } });

      if (!existingPhone) {
        const forward_result: ResultObj = {
          status: true,
          reason: "phone available",
        };
        res.json(forward_result);
      } else {
        const forward_result: ResultObj = {
          status: false,
          reason: "phone taken",
        };
        res.json(forward_result);
      }
    } else {
      const forward_result: ResultObj = {
        status: false,
        reason: "invalid phone",
        // either start with +256 or 07 --- only ug contacts allowed.
      };
      res.json(forward_result);
    }
  } catch (error) {
    console.error("Error:", error);
    const forward_result: ResultObj = {
      status: false,
      reason: "server error",
    };
    res.json(forward_result);
  }
});

module.exports = server;
