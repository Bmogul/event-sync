import Image from 'next/image'
import React, { useState, useEffect } from 'react'

import styles from '../styles/events.module.css'

const Container = ({ guid, event, party, openForm }) => {
  return (
    <>
      <Cards event={event} party={party} />
      <Invite party={party} openForm={openForm} />
    </>
  )
}

/*const Cards = ({ event, party }) => {
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
}*/

/*const Cards = ({ event, party }) => {
  // Extract all keys that start with 'func' from the event object
  const cardKeys = Object.keys(event).filter(key => key.startsWith('func'));

  return (
    <div className={styles.cardContainer}>
      {cardKeys.map((key, index) => (
        <Image
          key={index}
          src={event[key].cardLink}
          className={styles.card}
          alt={`card-${index}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ))}
    </div>
  );
};*/

const Cards = ({ event, party }) => {
  const funcKeys = Object.keys(event).filter(key => key.startsWith('func'));

  // Extract the card image URLs
  const cardImages = funcKeys.map(key => event[key].cardLink);
  console.log('cardimages', cardImages)

  const [cardOrder, setCardOrder] = useState(cardImages.reverse());

  useEffect(() => {
    console.log(cardImages.reverse())
    setCardOrder(cardImages.reverse());
  }, [event]);

  const handleCardClick = (clickedCard) => {
    const newOrder = cardOrder.filter((card) => card !== clickedCard);
    newOrder.push(clickedCard);
    setCardOrder(newOrder);
  };

  return (
    <div className={styles.cardsDiv}>
      <div className={styles.imageStack}>
        {cardOrder.map((item, index) => (
          <div
            key={index}
            className={styles.cardD}
            onClick={() => handleCardClick(item)}
            style={{ zIndex: index + 1, top: `${index * 35}px`, right: `${index * 10}px` }}
          >
            <img
              src={item}
              alt={`Card ${index}`}
              className={`${styles.cardView} card-img-top`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

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

