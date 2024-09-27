import React, { useState } from 'react'
import styles from '../styles/form.module.css'
import Image from "next/image";
import Loading from './loading'

const ResBlock = ({ member, onResponseChange }) => {
  const [response, setResponse] = useState(member.MainResponse)

  const handleResponse = (value) => {
    const newResponse = response === value ? "" : value
    setResponse(newResponse)
    onResponseChange(member.UID, newResponse)
  }

  return (
    <div className={styles.resBlock}>
      <div>
        <label>{member.Name}</label>
      </div>
      <div>
        <button
          className={`${styles.responseBtn} ${response === "1" ? styles.greenBtn : ''}`}
          onClick={() => handleResponse("1")}
        >
          Yes
        </button>
        <button
          className={`${styles.responseBtn} ${response === "0" ? styles.greenBtn : ''}`}
          onClick={() => handleResponse("0")}
        >
          No
        </button>
      </div>
    </div>
  )
}

const RsvpForm = ({ formLoading, closeForm, party, setParty, postResponse, event }) => {

  const [sortedParty, setSortedParty] = useState([...party].sort((a, b) => a.FamilyOrder - b.FamilyOrder));

  const onResChange = (key, res) => {
    setParty(prevParty =>
      prevParty.map(member =>
        member.UID === key ? { ...member, MainResponse: res } : member
      )
    )
  }

  return (
    <dialog open className={styles.modal}>
      {formLoading ? (
        <Loading />
      ) : (
        <>
          <div className={styles.closeBtnDiv}>
            <Image onClick={closeForm} src={"/close_ring.svg"} alt="Close Form" height={50} width={50} className={styles.closeBtn} />
          </div>
          <div className={styles.formHeader}>
            <h3>{event.func0.funcTitle}</h3>
            <div className={styles.headerInfo}>
              <Image onClick={closeForm} src={"/Date_range_fill.svg"} alt="Close Form" height={25} width={25} className={styles.closeBtn} />
              <label>{event.func0.date}</label>
            </div>
            <div className={styles.headerInfo}>
              <Image onClick={closeForm} src={"/Pin_alt.svg"} alt="Close Form" height={25} width={25} className={styles.closeBtn} />
              <label>{event.func0.location}</label>
            </div>
          </div>
          <div className={styles.formBody}>
            {sortedParty.map(member => (
              <ResBlock key={member.UID} member={member} onResponseChange={onResChange} />
            ))}
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', height: '40px', fontSize: '20px', marginTop: '30px' }}>
              <button onClick={postResponse} className={styles.responseBtn}>Submit</button>
            </div>
          </div>
          <div className={styles.formSubmit}>
          </div>
        </>
      )}
    </dialog>
  )
}

export default RsvpForm
