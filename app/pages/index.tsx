import React, { useEffect, useState } from "react";

/**
 * styles && material ui
 */
// import styles from "../styles/index.module.css";
import styles from "./index.module.css";
import { Button, TextField } from "@mui/material";
import { Camera, Edit, LogIn } from "react-feather";
import { Login, Verified } from "@mui/icons-material";

/**
 *
 * Libraries
 */
import Cookies from "js-cookie";

/**
 *
 * export component
 */
export default () => {
  /**
   * hooks
   *
   */
  const [state, set_state] = useState<{ user?: string; access?: string }>({});
  useEffect(() => {
    if (Cookies.get("kusr") && Cookies.get("auth_id")) {
      set_state({
        ...state,
        user: Cookies.get("auth_id"),
        access: Cookies.get("kusr"),
      });
    } else {
      console.log("An error occured")
      window.location.replace("/sign_in");
    }
  }, []);

  /**
   * functions
   */

  /**
   *
   * return Component
   */
  if (!state.user) return;

  return (
    <div className={styles.ctr}>
      <div className={styles.hdr}>
        <div>
          <div>
            <img src="/kanlyte.png" alt="PROFILE_PHOTO" />
          </div>
          <div>
            <span>Log out</span>
            <LogIn size={18} color="#fff" />
          </div>
        </div>
      </div>
      <div className={styles.main}>
        <div className={styles.profile_photo_ctr}>
          <img src="/user_cat.jpg" alt="PROFILE_PHOTO" />
          <div>
            <Camera size={20} color="#a3a3a3" />
          </div>
        </div>
        <div className={styles.name_ctr}>
          <div>Aggi Peter</div>
          <div>
            <span>Phone Number Verified</span>
            <span>
              <Verified color="success" fontSize="small" />
            </span>
          </div>
          <div>
            <span>Email Verified</span>
            <span>
              <Verified color="success" fontSize="small" />
            </span>
          </div>
          <div>
            <button>
              <Edit color="#fff" size={17} />
              <span>Edit Profle</span>
            </button>
          </div>
        </div>
        <div className={styles.details_ctr}>
          <div>
            <div>Apps Used</div>
            <div>3</div>
          </div>
          <div>
            <div>Email</div>
            <div>aggipeter25@gmail.com</div>
          </div>
          <div>
            <div>Phone</div>
            <div>+256 775 703 456</div>
          </div>
        </div>
        <div className={styles.activity_ctr}>
          <div>Activity</div>
          <div>
            <div className={styles.activity}>
              <div>
                <div>Login</div>
                <div>Lyte</div>
              </div>
              <div>May 12, 2024 &#183; 13:45</div>
            </div>
            <div className={styles.activity}>
              <div>
                <div>Login</div>
                <div>Lyte</div>
              </div>
              <div>May 12, 2024 &#183; 13:45</div>
            </div>
            <div className={styles.activity}>
              <div>
                <div>Login</div>
                <div>Lyte App</div>
              </div>
              <div>May 12, 2024 &#183; 13:45</div>
            </div>
            <div className={styles.activity}>
              <div>
                <div>Login</div>
                <div>Lyte</div>
              </div>
              <div>May 12, 2024 &#183; 13:45</div>
            </div>
            <div className={styles.activity}>
              <div>
                <div>Login</div>
                <div>Lyte</div>
              </div>
              <div>May 12, 2024 &#183; 13:45</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};