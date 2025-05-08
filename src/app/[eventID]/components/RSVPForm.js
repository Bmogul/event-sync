/*import React, { useState } from "react";
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

export default RsvpForm;*/

import React, { useState, useEffect} from "react";
import styles from "../styles/form.module.css";
import Image from "next/image";
import Loading from "./loading";

const ResBlock = ({ member, funcCol, onResponseChange }) => {
  function convertToResponseColumn(str) {
    return str.replace(/([a-z])([A-Z])/g, "$1 $2").split(" ")[0] + "Response";
  }
  const responseKey = convertToResponseColumn(funcCol);
  const [response, setResponse] = useState(member[responseKey]);

  useEffect(() => {
    setResponse(member[responseKey]);
  }, [member, responseKey]);

  const handleResponse = (value) => {
    const newResponse = response === value ? "" : value;
    setResponse(newResponse);
    onResponseChange(member.UID, convertToResponseColumn(funcCol), newResponse);
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

  const funcKeys = Object.keys(event).filter((key) => key.startsWith("func"));

  const functionList = Object.keys(event)
    .filter((key) => key.startsWith("func"))
    .map((key) => event[key]);

  const [currentFuncIndex, setCurrentFuncIndex] = useState(0);
  const currentFunc = functionList[currentFuncIndex];


  const onResChange = (uid, funcCol, res) => {
    setParty((prevParty) => {

      return [...prevParty.map((member) =>
        member.UID === uid ? { ...member, [funcCol]: res } : member,
      )].sort((a, b) => a.FamilyOrder - b.FamilyOrder)},
    );
  };

  const openMap = () => {
    const encodedLocation = encodeURIComponent(currentFunc.location);
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`,
      "_blank",
    );
  };

  const openGoogleCalendar = () => {
    const [time, date] = currentFunc.date.split(", ");
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

    const [hours, minutes] = time.split(":");
    const isPM = time.toLowerCase().includes("pm");
    const hourVal = parseInt(hours) + (isPM && parseInt(hours) < 12 ? 12 : 0);

    const dateObj = new Date(
      year,
      monthIndex,
      parseInt(day),
      hourVal,
      parseInt(minutes),
    );

    const formatDate = (date) =>
      date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const startDate = formatDate(dateObj);
    const endDate = formatDate(new Date(dateObj.getTime() + 60 * 60 * 1000));
    const encodedTitle = encodeURIComponent(
      currentFunc.funcTitle || event.eventTitle,
    );
    const encodedLocation = encodeURIComponent(currentFunc.location);

    const calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodedTitle}&dates=${startDate}/${endDate}&details=Event%20created%20from%20app&location=${encodedLocation}&sf=true&output=xml`;
    window.open(calendarUrl, "_blank");
  };

  const handleNext = () => {
    if (currentFuncIndex < funcKeys.length - 1) {
      setCurrentFuncIndex(currentFuncIndex + 1);
    }
  };

  const changeFunc = (val)=>{
    console.log('changing', val, party);
    setCurrentFuncIndex(prev => prev+val)
  }

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
            <h3>{currentFunc.funcTitle}</h3>
            <div id="FunctionDate" className={styles.headerInfo}>
              <Image
                onClick={openGoogleCalendar}
                src={"/Date_range_fill.svg"}
                alt="Date"
                height={25}
                width={25}
                className={styles.closeBtn}
              />
              <label>{currentFunc.date}</label>
            </div>
            <div id="FunctionLocation" className={styles.headerInfo}>
              <Image
                onClick={openMap}
                src={"/Pin_alt.svg"}
                alt="Location"
                height={25}
                width={25}
                className={styles.closeBtn}
              />
              <label>{currentFunc.location}</label>
            </div>
          </div>

          <div className={styles.formBody}>
            {party
              .filter(
                (member) =>
                  member[currentFunc.funcCol] === "1" ||
                  member[currentFunc.funcCol] === 1,
              )
              .map((member) => (
                <ResBlock
                  key={member.UID}
                  member={member}
                  funcCol={currentFunc.funcCol}
                  onResponseChange={onResChange}
                />
              ))}
          </div>

          <div className={styles.formSubmit}>
            {currentFuncIndex > 0 && (
              <button
                onClick={()=>changeFunc(-1)}
                className={styles.responseBtn}
                style={{ marginRight: "1rem" }}
              >
                Back
              </button>
            )}
            {currentFuncIndex < functionList.length - 1 ? (
              <button
                onClick={()=>changeFunc(1)}
                className={styles.responseBtn}
              >
                Next
              </button>
            ) : (
              <button onClick={postResponse} className={styles.responseBtn}>
                Submit
              </button>
            )}
          </div>
        </>
      )}
    </dialog>
  );
};

export default RsvpForm;
