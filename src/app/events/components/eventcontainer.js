import React from 'react'
import Image from 'next/image'

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
    <div className="cardsContainerDiv">
      <Image
        src={event.func0.cardLink}
        alt="Logo"
        width={250}
        height={150}
        layout="responsive"
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

