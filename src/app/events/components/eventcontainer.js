import React from 'react'
import Image from 'next/image'

import styles from '../styles/events.module.css'

const container = ({ guid, event, party }) => {
  return (
    <>
      <Cards event={event} party={party} />
      <Invite party={party} />
    </>
  )
}

const Cards = ({ event, party }) => {
  console.log("CARDS\n", event)
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

const Invite = ({ party }) => {
  const sortedParty = [...party].sort((a, b) => a.FamilyOrder - b.FamilyOrder);
  console.log(party)
  return (
    <div className={styles.inviteContainer}>
      <div className={styles.inviteHeader}>
        <h2>Please Join Us</h2>
      </div>
      <div className={styles.inviteList}>
        {sortedParty.map((member) => <label>{member.Name}</label>)}
      </div>
      <div className={styles.btnRSVP}>
        <button>RSVP Now</button>
      </div>
    </div>
  )
}

export default container

