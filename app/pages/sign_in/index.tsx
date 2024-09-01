import React, { FormEvent, useEffect, useState } from "react";

/**
 * styles && material ui
 */
import styles from "./index.module.css";
import { Button, CircularProgress, TextField } from "@mui/material";
import Cookies from "js-cookie";
import { end_point } from "@/lib/api";
import { return_user_to_app } from "@/lib/functions";

export default () => {
  const [state, set_state] = useState<{
    id: string;
    auth: string;
    checking: boolean;
    check_error: boolean;
    reason?: string;
  }>({
    id: "",
    auth: "",
    checking: false,
    check_error: false,
  });

  useEffect(() => {
    if (Cookies.get("kusr") && Cookies.get("auth_id"))
      window.location.replace("/");
  }, []);

  /**
   *
   * @param e | form event
   *
   * Function does sign in a user
   */
  const sign_in = async (e: FormEvent) => {
    e.preventDefault();
    set_state({
      ...state,
      checking: true,
    });
    try {
      const result = await fetch(`${end_point}/auth2/login`, {
        method: "POST",
        body: JSON.stringify({
          email: state.id,
          auth: state.auth,
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (result.status == 200) {
        const check_data = await result.json();
        if (!check_data.status) {
          set_state({
            ...state,
            checking: false,
            check_error: true,
            reason: "Wrong Details",
          });

          setTimeout(() => {
            set_state({
              ...state,
              check_error: false,
              reason: "",
            });
          }, 5000);
        } else {
          Cookies.set("kusr", check_data.result.access_token, {
            expires: 7,
            secure: true,
          });
          Cookies.set("auth_id", check_data.result.kanlyte_id, {
            expires: 7,
            secure: true,
          });

          set_state({
            ...state,
            checking: false,
            check_error: false,
          });

          return_user_to_app(
            check_data.result.kanlyte_id,
            check_data.result.access_token
          );
        }
      } else {
        set_state({
          ...state,
          checking: false,
          check_error: true,
          reason: "An Error Occured",
        });

        setTimeout(() => {
          set_state({
            ...state,
            check_error: false,
            reason: "",
          });
        }, 5000);
      }
    } catch (error) {
      set_state({
        ...state,
        checking: false,
        check_error: true,
        reason: "An Error Occurred",
      });

      setTimeout(() => {
        set_state({
          ...state,
          check_error: false,
          reason: "",
        });
      }, 5000);
    }
  };

  return (
    <div className={styles.ctr}>
      <div>
        <div className={styles.left_sign_in}>
          <div>
            <img src="/kanlyte.png" alt="" />
          </div>
          <div>Welcome</div>
          <div>Sign In</div>
        </div>
        <div className={styles.right_sign_in}>
          <form onSubmit={sign_in}>
            <TextField
              label="Email or Phone Number"
              error={state.check_error}
              helperText={state.reason ? state.reason : ""}
              variant="outlined"
              className={styles.text_field}
              onChange={(e) => {
                set_state({ ...state, id: e.currentTarget.value });
              }}
            />

            <TextField
              label="Password"
              type="password"
              helperText={state.reason ? state.reason : ""}
              error={state.check_error}
              variant="outlined"
              className={styles.text_field}
              onChange={(e) => {
                set_state({ ...state, auth: e.currentTarget.value });
              }}
            />
            <div className={styles.forgot_pass}>
              <a href="/new">Create Account</a>
              <a href="">Forgot Password?</a>
            </div>

            <Button
              variant="contained"
              className={styles.submit_btn}
              type="submit"
            >
              {state.checking ? (
                <CircularProgress size={20} thickness={5} color="inherit" />
              ) : (
                "Submit"
              )}
            </Button>
          </form>
          <div className={styles.auth_links}>
            <a href="">About</a>
            <a href="">Company</a>
            <a href="">Contact</a>
            <a href="">Help</a>
            <a href="">Privacy</a>
          </div>
        </div>
      </div>
    </div>
  );
};
