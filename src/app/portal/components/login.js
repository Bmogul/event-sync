import stylesL from '../styles/login.module.css'
import styles from '../styles/portal.module.css'

import Image from "next/image";
import React, { useEffect, useState } from 'react'

const Login = ({ event, setLogin, params, toast, setLoading, setGuestList, password, setPassword, handleLogin}) => {


  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };


  return (
    <div className={styles.portalBox}>
      <div className={stylesL.eventLoginInfo}>
        <h2>{event.eventTitle}</h2>
        <h3>Event ID: {event.eventID}</h3>
        <div className={stylesL.formBox}>
          <div>
            <label for="password" >Event Password:</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
            />
          </div>
          <button onClick={handleLogin}>Enter</button>
        </div>
      </div>
      <div className={styles.verticalLine} />
      <div className={styles.logoContainerB}>
        <Image className={styles.responsiveLogo} src={"/logo.svg"} alt="Event-Sync" fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
      </div>
    </div>)
}

export default Login
