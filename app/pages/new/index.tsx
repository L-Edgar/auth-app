import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";

/**
 * styles && material ui
 */
import styles from "./index.module.css";
import {
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  TextField,
} from "@mui/material";

/**
 * lib functions
 */
import { end_point } from "@/lib/api";
import { verify_auth, verify_username } from "@/lib/functions";

/**
 *
 * type declarations used in the function
 */
type ResultObj = {
  result?: any;
  status: boolean;
  reason: string;
};
type StateObj = {
  step: number;
  active_tab: string;
  first_name: string;
  surname: string;
  checking: boolean;
  user_create_error: boolean;
};
type UsernameState = {
  username_valid: boolean;
  username_available: boolean;
  username: string;
  error_server_check: boolean;
  checking: boolean;
};
type PasswordState = {
  password_valid: boolean;
  password: string;
  repeat_password: string;
  show_password: boolean;
};
type EmailState = {
  email: string;
  email_valid: boolean;
  email_available: boolean;
  error_server_check: boolean;
};
type PhoneState = {
  phone: string;
  phone_valid: boolean;
  phone_available: boolean;
  error_server_check: boolean;
};

/**
 * new user component
 */
export default () => {
  /**
   * REact Hooks declaration
   */
  const [state, setState] = useState<StateObj>({
    step: 1,
    active_tab: "username",
    first_name: "",
    surname: "",
    checking: false,
    user_create_error: false,
  });
  const [username_state, set_username_state] = useState<UsernameState>({
    username_valid: true,
    username_available: true,
    username: "",
    error_server_check: false,
    checking: false,
  });
  const [password_state, set_password_state] = useState<PasswordState>({
    password_valid: true,
    password: "",
    repeat_password: "",
    show_password: false,
  });
  const [email_state, set_email_state] = useState<EmailState>({
    email: "",
    email_valid: true,
    email_available: true,
    error_server_check: false,
  });
  const [phone_state, set_phone_state] = useState<PhoneState>({
    phone: "",
    phone_valid: true,
    phone_available: true,
    error_server_check: false,
  });
  useEffect(() => {
    if (Cookies.get("kusr") && Cookies.get("auth_id"))
      window.location.replace("/");
  }, []);

  /**
   *
   * functions
   */

  /**
   *
   * function checks phone number,
   * if correct, calls the next function for email
   * checking
   */
  const check_phone = async () => {
    setState({
      ...state,
      checking: true,
    });

    if (!phone_state.phone) return;
    try {
      const result = await fetch(
        `${end_point}/auth2/check/phone/${phone_state.phone}`
      );
      if (result.status == 200) {
        let check_data = await result.json();
        if (check_data.reason === "server error") {
          setState({
            ...state,
            checking: false,
          });
          set_phone_state({
            ...phone_state,
            error_server_check: true,
          });

          setTimeout(() => {
            set_phone_state({
              ...phone_state,
              error_server_check: false,
            });
          }, 10000);
        } else {
          if (check_data.reason) {
            switch (check_data.reason) {
              case "invalid phone":
                set_phone_state({
                  ...phone_state,
                  phone_valid: false,
                });
                setState({
                  ...state,
                  checking: false,
                });
                break;
              case "phone taken":
                set_phone_state({
                  ...phone_state,
                  phone_available: false,
                });
                setState({
                  ...state,
                  checking: false,
                });
                break;
              default:
                set_phone_state({
                  ...phone_state,
                  phone_valid: true,
                  phone_available: true,
                  error_server_check: false,
                });
                await check_email();
                break;
            }
          }
        }
      } else {
        set_phone_state({
          ...phone_state,
          error_server_check: true,
        });
        setState({
          ...state,
          checking: false,
        });

        setTimeout(() => {
          set_phone_state({
            ...phone_state,
            error_server_check: false,
          });
        }, 5000);
      }
    } catch (error) {
      setState({
        ...state,
        checking: false,
      });
      set_phone_state({
        ...phone_state,
        error_server_check: true,
      });

      setTimeout(() => {
        set_phone_state({
          ...phone_state,
          error_server_check: false,
        });
      }, 5000);
    }
  };

  /**
   *
   * function checks email,
   * if correct, calls the next function for submitting
   * user
   */
  const check_email = async () => {
    if (!email_state.email) return;
    try {
      const result = await fetch(
        `${end_point}/auth2/check/email/${email_state.email}`
      );
      if (result.status == 200) {
        let check_data = await result.json();
        if (check_data.reason === "server error") {
          set_email_state({
            ...email_state,
            error_server_check: true,
          });
          setState({
            ...state,
            checking: false,
          });

          setTimeout(() => {
            set_email_state({
              ...email_state,
              error_server_check: false,
            });
          }, 10000);
        } else {
          if (check_data.reason) {
            switch (check_data.reason) {
              case "invalid email":
                set_email_state({
                  ...email_state,
                  email_valid: false,
                });
                setState({
                  ...state,
                  checking: false,
                });
                break;
              case "email taken":
                set_email_state({
                  ...email_state,
                  email_available: false,
                });
                setState({
                  ...state,
                  checking: false,
                });
                break;
              default:
                set_email_state({
                  ...email_state,
                  email_valid: true,
                  email_available: true,
                  error_server_check: false,
                });
                await submit_user();
                break;
            }
          }
        }
      } else {
        set_email_state({
          ...email_state,
          error_server_check: true,
        });
        setState({
          ...state,
          checking: false,
        });
        setTimeout(() => {
          set_email_state({
            ...email_state,
            error_server_check: false,
          });
        }, 5000);
      }
    } catch (error) {
      setState({
        ...state,
        checking: false,
      });
      set_email_state({
        ...email_state,
        error_server_check: true,
      });

      setTimeout(() => {
        set_email_state({
          ...email_state,
          error_server_check: false,
        });
      }, 5000);
    }
  };

  const submit_user = async () => {
    const data = {
      first_name: state.first_name,
      last_name: state.surname,
      email: email_state.email,
      username: username_state.username,
      phone: phone_state.phone,
      auth: password_state.password,
    };
    try {
      const result = await fetch(`${end_point}/auth2/account`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      if (result.status == 200) {
        const check_data: ResultObj = await result.json();
        if (!check_data.status) {
          setState({
            ...state,
            user_create_error: true,
            checking: false,
            active_tab: "done",
          });
        } else {
          setState({
            ...state,
            user_create_error: false,
            checking: false,
            active_tab: "done",
          });
        }
      } else {
        setState({
          ...state,
          user_create_error: true,
          checking: false,
          active_tab: "done",
        });
      }
    } catch (error) {
      setState({
        ...state,
        user_create_error: true,
        checking: false,
        active_tab: "done",
      });
    }
  };

  return (
    <div className={styles.ctr}>
      <div>
        <div className={styles.left_sign_in}>
          <div>
            <img src="/kanlyte.png" alt="" />
          </div>
          <div>Sign Up</div>
          <div>Create your account</div>
        </div>
        <div className={styles.right_sign_in}>
          <form>
            <div
              className={
                state.active_tab == "username"
                  ? styles.active
                  : styles.not_active
              }
            >
              <TextField
                label="Username"
                variant="outlined"
                className={styles.text_field}
                error={
                  !username_state.username_available ||
                  !username_state.username_valid ||
                  username_state.error_server_check
                }
                helperText={
                  username_state.error_server_check
                    ? "Error While Checking Username"
                    : !username_state.username_valid
                    ? "Username is invalid"
                    : !username_state.username_available
                    ? "Username is taken"
                    : "Choose a username"
                }
                onChange={(e) => {
                  set_username_state({
                    ...username_state,
                    username: e.currentTarget.value,
                  });
                }}
              />
              <Button
                variant="contained"
                className={styles.sign_up_btn}
                disabled={!username_state.username}
                onClick={async () => {
                  set_username_state({
                    ...username_state,
                    checking: true,
                  });
                  if (!username_state.username) return;
                  try {
                    const result = await fetch(
                      `${end_point}/auth2/check/username/${username_state.username}`
                    );
                    if (result.status == 200) {
                      let check_data = await result.json();
                      if (check_data.reason === "server error") {
                        set_username_state({
                          ...username_state,
                          error_server_check: true,
                          checking: false,
                        });

                        setTimeout(() => {
                          set_username_state({
                            ...username_state,
                            error_server_check: false,
                          });
                        }, 10000);
                      } else {
                        if (check_data.reason) {
                          switch (check_data.reason) {
                            case "invalid username":
                              set_username_state({
                                ...username_state,
                                username_valid: false,
                                checking: false,
                              });
                              break;
                            case "username taken":
                              set_username_state({
                                ...username_state,
                                username_available: false,
                                checking: false,
                              });
                              break;
                            default:
                              set_username_state({
                                ...username_state,
                                username_valid: true,
                                username_available: true,
                                error_server_check: false,
                                checking: false,
                              });
                              setState({ ...state, active_tab: "password" });
                              break;
                          }
                        }
                      }
                    } else {
                      set_username_state({
                        ...username_state,
                        error_server_check: true,
                        checking: false,
                      });

                      setTimeout(() => {
                        set_username_state({
                          ...username_state,
                          error_server_check: false,
                        });
                      }, 5000);
                    }
                  } catch (error) {
                    set_username_state({
                      ...username_state,
                      error_server_check: true,
                      checking: false,
                    });

                    setTimeout(() => {
                      set_username_state({
                        ...username_state,
                        error_server_check: false,
                      });
                    }, 5000);
                  }
                }}
              >
                {username_state.checking ? (
                  <CircularProgress size={20} thickness={5} color="inherit" />
                ) : (
                  "Next"
                )}
              </Button>
            </div>
            <div
              className={
                state.active_tab == "password"
                  ? styles.active
                  : styles.not_active
              }
            >
              <TextField
                label="Password"
                variant="outlined"
                className={styles.text_field}
                type={password_state.show_password ? "text" : "password"}
                onChange={(e) => {
                  set_password_state({
                    ...password_state,
                    password_valid: verify_auth(e.currentTarget.value),
                    password: e.target.value,
                  });
                }}
                helperText={
                  password_state.password
                    ? !password_state.password_valid
                      ? "Password in Invalid"
                      : password_state.password !==
                        password_state.repeat_password
                      ? "Passwords should Match"
                      : "Accepted"
                    : "Enter Password"
                }
                error={
                  !password_state.password_valid ||
                  password_state.password !== password_state.repeat_password
                }
              />
              <TextField
                label="Repeat Password"
                variant="outlined"
                className={styles.text_field}
                type={password_state.show_password ? "text" : "password"}
                disabled={!password_state.password_valid}
                onChange={(e) => {
                  set_password_state({
                    ...password_state,
                    repeat_password: e.target.value,
                  });
                }}
                helperText={
                  password_state.password
                    ? password_state.password_valid
                      ? password_state.password !==
                        password_state.repeat_password
                        ? "Passwords should Match"
                        : "Accepted"
                      : ""
                    : ""
                }
                error={
                  password_state.password_valid &&
                  password_state.password !== password_state.repeat_password
                }
              />
              <div className={styles.password_help_ctr}>
                <div className={styles.show_password}>
                  <FormControlLabel
                    label="Show Password"
                    control={
                      <Checkbox
                        title="Show Password"
                        checked={password_state.show_password}
                        onChange={() => {
                          set_password_state({
                            ...password_state,
                            show_password: !password_state.show_password,
                          });
                        }}
                      />
                    }
                  />
                </div>
                <div className={styles.password_info}>
                  <div>Password should have:</div>
                  <ul>
                    <li>At least 8 Characters</li>
                    <li>A Special Character</li>
                    <li>An Upper and lowercase letter</li>
                    <li>A number</li>
                  </ul>
                </div>
              </div>
              <Button
                variant="contained"
                className={styles.sign_up_btn}
                onClick={() => {
                  setState({ ...state, active_tab: "full_name" });
                }}
                disabled={
                  !password_state.password_valid ||
                  password_state.password !== password_state.repeat_password
                }
              >
                Next
              </Button>
            </div>
            <div
              className={
                state.active_tab == "full_name"
                  ? styles.active
                  : styles.not_active
              }
            >
              <TextField
                label="First Name (s)"
                variant="outlined"
                className={styles.text_field}
                onChange={(e) => {
                  setState({
                    ...state,
                    first_name: e.currentTarget.value,
                  });
                }}
              />
              <TextField
                label="Surname"
                variant="outlined"
                className={styles.text_field}
                onChange={(e) => {
                  setState({
                    ...state,
                    surname: e.currentTarget.value,
                  });
                }}
              />
              <Button
                variant="contained"
                className={styles.sign_up_btn}
                disabled={!state.first_name || !state.surname}
                onClick={() => {
                  if (!state.first_name || !state.surname) return;
                  setState({ ...state, active_tab: "email_&_phone" });
                }}
              >
                Next
              </Button>
            </div>
            <div
              className={
                state.active_tab == "email_&_phone"
                  ? styles.active
                  : styles.not_active
              }
            >
              <TextField
                label="Email"
                variant="outlined"
                type="email"
                className={styles.text_field}
                error={
                  !email_state.email_available ||
                  !email_state.email_valid ||
                  email_state.error_server_check
                }
                helperText={
                  email_state.error_server_check
                    ? "Error While Checking Email"
                    : !email_state.email_valid
                    ? "Email is Invalid"
                    : !email_state.email_available
                    ? "Email is used"
                    : "Enter Email"
                }
                onChange={(e) => {
                  set_email_state({
                    ...email_state,
                    email: e.currentTarget.value,
                  });
                }}
              />

              <TextField
                label="Phone Number"
                variant="outlined"
                className={styles.text_field}
                error={
                  !phone_state.phone_available ||
                  !phone_state.phone_valid ||
                  phone_state.error_server_check
                }
                helperText={
                  phone_state.error_server_check
                    ? "Error While Checking phone"
                    : !phone_state.phone_valid
                    ? "Phone Number is Invalid"
                    : !phone_state.phone_available
                    ? "Phone Number is used"
                    : "Enter Phone(format +256- or 07-)"
                }
                onChange={(e) => {
                  set_phone_state({
                    ...phone_state,
                    phone: e.currentTarget.value,
                  });
                }}
              />
              <Button
                variant="contained"
                className={styles.sign_up_btn}
                onClick={check_phone}
              >
                {state.checking ? (
                  <CircularProgress size={20} thickness={5} color="inherit" />
                ) : (
                  "Next"
                )}
              </Button>
            </div>
            <div
              className={
                state.active_tab == "done" ? styles.active : styles.not_active
              }
            >
              {state.user_create_error ? (
                <>
                  <div>Error!!!</div>
                  <div>We encountered errors while creating your account.</div>
                  <div>
                    <a href="/new">
                      <Button
                        variant="contained"
                        className={styles.sign_up_btn}
                      >
                        Retry
                      </Button>
                    </a>
                  </div>
                </>
              ) : (
                <>
                  <div>Success!!!</div>
                  <div>Your account has been created.</div>
                  <div>
                    <a href="/">
                      <Button
                        variant="contained"
                        className={styles.sign_up_btn}
                      >
                        Profile
                      </Button>
                    </a>
                  </div>
                </>
              )}
            </div>
          </form>

          {/* 
          commented out these links for future reference
          */}

          {/* <div className={styles.auth_links}>
            <a href="">About</a>
            <a href="">Company</a>
            <a href="">Contact</a>
            <a href="">Help</a>
            <a href="">Privacy</a>
          </div> */}
        </div>
      </div>
    </div>
  );
};