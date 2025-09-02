
'use client'
import { useEffect, useState } from "react";
import styles from "./page.module.css"

const SignIn = () => {
  let [signUp, setSignUp] = useState(false)
  let [form, setForm] = useState('')

  useEffect(()=>{
    if(signUp){

    }
  },[signUp])

  return(
  <div className="auth-container fade-in">
      Hllo
    </div>
  )
}

export default SignIn;
