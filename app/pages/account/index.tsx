import React, { useEffect, useState } from "react";

/**
 *
 * styles, material & icons
 */

import styles from "./index.module.css";
import { Button } from "@mui/material";

/**
 *
 * Components && libraries
 */
import Cookies from "js-cookie";
import { end_point } from "@/lib/api";
import { return_user_to_app } from "@/lib/functions";

/**
 * export component
 */
export default () => {
  /**
   * hooks
   */
  const [state, set_state] = useState<{
    user?: string;
    access?: string;
    user_loaded: boolean;
    first_name?: string;
    last_name?: string;
    username?: string;
  }>({ user_loaded: false });

  useEffect(() => {
    let url_params = new URLSearchParams(window.location.search);
    if (url_params.get("client_app")) {
      sessionStorage.setItem("client_app", url_params.get("client_app") || "");
    }
    (async () => {
      if (Cookies.get("auth_id")) {
        set_state({
          ...state,
          user: Cookies.get("auth_id"),
        });

        try {
          const result = await fetch(
            `${end_point}/auth2/user/single/${Cookies.get("auth_id")}`,
            {
              headers: { authorization: Cookies.get("kusr") || "" },
            }
          );
          if (result.status == 200) {
            const user_data = await result.json();
            if (!user_data.status) {
              set_state({
                ...state,
                user_loaded: true,
                first_name: user_data.result.first_name,
                last_name: user_data.result.last_name,
                username: user_data.result.username,
              });
            }
          }
        } catch (error) {}
      } else {
        window.location.replace("/sign_in");
      }
    })();
  }, []);

  return (
    <div className={styles.ctr}>
      <div>
        <div className={styles.left_sign_in}>
          <div>
            <img src="/kanlyte.png" alt="" />
          </div>
          <div>Kanlyte</div>
          <div>Account</div>
        </div>
        <div className={styles.right_sign_in}>
          <div className={styles.account_center}>
            <div>Continue With your Account</div>
            <div>
              <div>
                <img src="/user_cat.jpg" alt="PROFILE_PHOTO" />
              </div>
              <div>
                <div>
                  {state.first_name || "..."} {state.last_name || ""}
                </div>
                <div>{state.username || "..."}</div>
              </div>
            </div>
            <div>
              <Button
                variant="contained"
                className={styles.continue_btn}
                type="submit"
                onClick={() => {
                  return_user_to_app(state.user, state.access);
                }}
              >
                Continue
              </Button>
            </div>
            <div></div>
            <div></div>
          </div>
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
