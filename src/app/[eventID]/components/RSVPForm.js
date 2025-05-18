import React, { useState, useEffect } from "react";
import styles from "../styles/form.module.css";
import Image from "next/image";
import Loading from "./loading";

const ResBlock = ({ member, funcCol, onResponseChange }) => {
  function convertToResponseColumn(str) {
    return str.replace(/([a-z])([A-Z])/g, "$1 $2").split(" ")[0] + "Response";
  }

  const responseKey = convertToResponseColumn(funcCol);
  const [response, setResponse] = useState(0);

  useEffect(() => {
    const value = member[responseKey];
    setResponse(value === "" ? "" : String(value));
  }, [member, responseKey]);

  const handleResponse = (value) => {
    const newResponse = response === value ? "" : value;
    setResponse(newResponse);
    onResponseChange(member.UID, convertToResponseColumn(funcCol), newResponse);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    // Allow only digits or empty string
    if (/^\d*$/.test(value)) {
      setResponse(value);
      onResponseChange(
        member.UID,
        convertToResponseColumn(funcCol),
        value === "" ? "" : parseInt(value),
      );
    }
  };

  if (member[funcCol] === "x") {
    return (
      <div className={styles.resBlock}>
        <div>
          <label>How Many People Shall be Attending?</label>
        </div>
        <div>
          <input
            type="number"
            className={styles.responseInput}
            value={response}
            onChange={handleInputChange}
          />
        </div>
      </div>
    );
  } else {
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
  }
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
      return [
        ...prevParty.map((member) =>
          member.UID === uid
            ? { ...member, [funcCol]: isNaN(res) || res < 0 ? 0 : res }
            : member,
        ),
      ].sort((a, b) => a.FamilyOrder - b.FamilyOrder);
    });
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

  const changeFunc = (val) => {
    console.log("changing", val, party);
    setCurrentFuncIndex((prev) => prev + val);
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
                  member[currentFunc.funcCol] === 1 ||
                  member[currentFunc.funcCol] === "x",
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
                onClick={() => changeFunc(-1)}
                className={styles.responseBtn}
                style={{ marginRight: "1rem" }}
              >
                Back
              </button>
            )}
            {currentFuncIndex < functionList.length - 1 ? (
              <button
                onClick={() => changeFunc(1)}
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
