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
  return (
    <div className="inviteContainerDiv">
      <pre>{JSON.stringify(party)}</pre>
    </div>
  )
}

export default container

