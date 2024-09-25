import stylesL from '../styles/login.module.css'
import styles from '../styles/portal.module.css'

import Image from "next/image";
import React, { useEffect, useState } from 'react'

const Login = ({ event, setLogin, params, toast, setLoading, setGuestList}) => {

  const [password, setPassword] = useState("")

  // Handle Login
  const handleLogin = async (e) => {
    // logic to verify password
    setLoading(true)
    const res = await fetch(`/api/events/${params.eventID}/portal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password })
    })
    const result = await res.json()
    if (res.status == 200) {
      if (result.validated) {
        setLogin(true)
        setGuestList(result.guestList)
        toast("Welcome")
      } else {
        toast("Invalid Password")
      }
    }else{
      toast("Please try again")
    }
    setPassword("")
    setLoading(false)
    //setLogin(true)
  }

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
