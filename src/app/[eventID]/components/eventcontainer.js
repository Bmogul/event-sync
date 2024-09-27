import React from 'react'
import Image from 'next/image'

import styles from '../styles/events.module.css'

const Container = ({ guid, event, party, openForm }) => {
  return (
    <>
      <Cards event={event} party={party} />
      <Invite party={party} openForm={openForm} />
    </>
  )
}

const Cards = ({ event, party }) => {
  return (
    <div className={styles.cardContainer}>
      <Image
        src={event.func0.cardLink}
        className={styles.card}
        alt="card"
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  )
}

const Invite = ({ party, openForm }) => {
  
  const sortedParty = [...party].sort((a, b) => a.FamilyOrder - b.FamilyOrder);

  return (
    <div className={styles.inviteContainer}>
      <div className={styles.inviteHeader}>
        <h2>Please Join Us</h2>
      </div>
      <div className={styles.inviteList}>
        {sortedParty.map((member,index) => <label key={index}>{member.Name}</label>)}
      </div>
      <div className={styles.btnRSVP}>
        <button onClick={openForm}>RSVP Now</button>
      </div>
    </div>
  )
}

export default Container

