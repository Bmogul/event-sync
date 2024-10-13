import React, { useState } from "react";
import styles from "../styles/form.module.css";
import Image from "next/image";
import Loading from "./loading";

const ResBlock = ({ member, onResponseChange }) => {
  const [response, setResponse] = useState(member.MainResponse);

  const handleResponse = (value) => {
    const newResponse = response === value ? "" : value;
    setResponse(newResponse);
    onResponseChange(member.UID, newResponse);
  };

  return (
    <div className={styles.resBlock}>
      <div>
        <label>{member.Name}</label>
      </div>
      <div>
        <button
          className={`${styles.responseBtn} ${response === "1" ? styles.greenBtn : ""}`}
          onClick={() => handleResponse("1")}
        >
          Yes
        </button>
        <button
          className={`${styles.responseBtn} ${response === "0" ? styles.greenBtn : ""}`}
          onClick={() => handleResponse("0")}
        >
          No
        </button>
      </div>
    </div>
  );
};

const RsvpForm = ({
  formLoading,
  closeForm,
  party,
  setParty,
  postResponse,
  event,
}) => {
  const [sortedParty, setSortedParty] = useState(
    [...party].sort((a, b) => a.FamilyOrder - b.FamilyOrder),
  );

  const onResChange = (key, res) => {
    setParty((prevParty) =>
      prevParty.map((member) =>
        member.UID === key ? { ...member, MainResponse: res } : member,
      ),
    );
  };
  const openMap = () => {
    // Encode the location string to make it URL-safe
    const encodedLocation = encodeURIComponent(event.func0.location);

    // Construct the Google Maps URL
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;

    // Open the URL in a new tab/window
    window.open(mapUrl, "_blank");
  };

  const openGoogleCalendar = () => {
    // Parse the given date and time
    const [time, date, dayofweek] = event.func0.date.split(", ");
    // Parse date components
    const [day, month, year] = date.split(" ");
    const monthIndex = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ].indexOf(month);

    // Parse time components
    const [hours, minutes] = time.split(":");
    const isPM = time.toLowerCase().includes("pm");

    // Create date object
    const dateObj = new Date(
      year,
      monthIndex,
      parseInt(day),
      isPM ? parseInt(hours) + 12 : parseInt(hours),
      parseInt(minutes),
    );

    // Format the date and time for Google Calendar URL
    const formatDate = (date) => {
      return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    };

    const startDate = formatDate(dateObj);

    // Set event duration (e.g., 1 hour)
    const endDate = formatDate(new Date(dateObj.getTime() + 60 * 60 * 1000));
    // Encode the event details
    const encodedTitle = encodeURIComponent(event.eventTitle);
    const encodedLocation = encodeURIComponent(event.func0.location);

    // Construct the Google Calendar URL
    const calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodedTitle}&dates=${startDate}/${endDate}&details=Event%20created%20from%20app&location=${encodedLocation}&sf=true&output=xml`;

    // Open the URL in a new tab/window
    window.open(calendarUrl, "_blank");
  };
  return (
    <dialog open className={styles.modal}>
      {formLoading ? (
        <Loading />
      ) : (
        <>
          <div className={styles.closeBtnDiv}>
            <Image
              onClick={closeForm}
              src={"/close_ring.svg"}
              alt="Close Form"
              height={50}
              width={50}
              className={styles.closeBtn}
            />
          </div>
          <div className={styles.formHeader}>
            <h3>{event.func0.funcTitle}</h3>
            <div id="FunctionDate" className={styles.headerInfo}>
              <Image
                onClick={openGoogleCalendar}
                src={"/Date_range_fill.svg"}
                alt="Close Form"
                height={25}
                width={25}
                className={styles.closeBtn}
              />
              <label>{event.func0.date}</label>
            </div>
            <div id="FunctionLocation" className={styles.headerInfo}>
              <Image
                onClick={openMap}
                src={"/Pin_alt.svg"}
                alt="Close Form"
                height={25}
                width={25}
                className={styles.closeBtn}
              />
              <label>{event.func0.location}</label>
            </div>
          </div>
          <div className={styles.formBody}>
            {sortedParty.map((member) => (
              <ResBlock
                key={member.UID}
                member={member}
                onResponseChange={onResChange}
              />
            ))}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                height: "40px",
                fontSize: "20px",
                marginTop: "30px",
              }}
            ></div>
          </div>
          <div className={styles.formSubmit}>
            <button onClick={postResponse} className={styles.responseBtn}>
              Submit
            </button>
          </div>
        </>
      )}
    </dialog>
  );
};

export default RsvpForm;
