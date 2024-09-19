import React from 'react'
import styles from '../styles/form.module.css'
import Image from "next/image";

const rsvpForm = ({ closeForm, party, postResponse, event }) => {

  return (
    <dialog open className={styles.modal}>
      <div className={styles.closeBtnDiv}>
        <Image onClick={closeForm} src={"/close_ring.svg"} alt="Close Form" height={50} width={50} className={styles.closeBtn} />
      </div>
      <div className={styles.formHeader}>
        <h3>{event.func0.funcTitle}</h3>
      </div>
    </dialog>
  )
}

export default rsvpForm
