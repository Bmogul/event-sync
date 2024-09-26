import Image from "next/image";
import { AgGridReact } from 'ag-grid-react'
import styles from '../styles/portal.module.css'
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid

import React, { useEffect, useState, useMemo, useCallback } from 'react'


const EmailPortal = ({ event, toast, params, setLoading, guestList, password }) => {

  const [reminderDate, setReminderDate] = useState()
  const [selectedRows, setSelectedRows] = useState([])

  console.log(guestList)

  const [cols, setCols] = useState([
    { field: 'GUID', width: 80 },
    { field: 'UID', width: 80 },
    { field: 'Name', filter: true },
    { field: 'Email', filter: true },
    { field: 'Tag', filter: true, width: 100 },
    { field: 'Sent', maxWidth: 90, minWidth: 50, filter: true },
  ]);
  const [rowData, setRowData] = useState(guestList)
  const selection = useMemo(() => {
    return {
      mode: "multiRow",
    };
  }, []);

  useEffect(()=>{setRowData(guestList)}, [guestList])

  const onGridSizeChanged = useCallback(
    (params) => {
      // get the current grids width
      var gridWidth = document.querySelector(".ag-body-viewport").clientWidth;
      // keep track of which columns to hide/show
      var columnsToShow = [];
      var columnsToHide = [];
      // iterate over all columns (visible or not) and work out
      // now many columns can fit (based on their minWidth)
      var totalColsWidth = 0;
      var allColumns = params.api.getColumns();
      if (allColumns && allColumns.length > 0) {
        for (var i = 0; i < allColumns.length; i++) {
          var column = allColumns[i];
          totalColsWidth += column.getMinWidth();
          if (totalColsWidth > gridWidth) {
            columnsToHide.push(column.getColId());
          } else {
            columnsToShow.push(column.getColId());
          }
        }
      }
      // show/hide columns based on current grid width
      params.api.setColumnsVisible(columnsToShow, true);
      params.api.setColumnsVisible(columnsToHide, false);
      // wait until columns stopped moving and fill out
      // any available space to ensure there are no gaps
      window.setTimeout(() => {
        params.api.sizeColumnsToFit();
      }, 10);
    },
    [window],
  );

  const onRowSelection = useCallback(event => {
    let rows = event.api.getSelectedNodes()
    rows = rows.map(node => node.data)
    setSelectedRows(rows)
  })

  useEffect(() => {
    console.log("selected Rows", selectedRows)
  }, [selectedRows])

  // Send Mail
  const SendMail = async () => {
    console.log(selectedRows)
    console.log(`/api/events/${params.eventID}/portal`)
    const res = await fetch(`/api/events/${params.eventID}/portal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({guestList: selectedRows, password: password, event: event}),
    });

    const result = await res.json();
    console.log("Result of send", result);
  }

  return (
    <div className={styles.Mailbox}>
      <div className={styles.MailboxHeader}>
        <h2>{event.eventTitle}</h2>
        <div className={styles.verticalLine} />
        <div className={styles.menuTitle}>
          <h3>Send Mail</h3>
          <Image src={"/Send_fill.svg"} alt="Close Form" height={30} width={30} className={styles.closeBtn} />
        </div>
      </div>
      <div className={styles.mailControlBox}>
        <div className={styles.reminderMenu}>
          <label>Set reminder</label> <input type='datetime-local' value={reminderDate}></input>
        </div>
        <button onClick={SendMail}>Send</button>
      </div>
      <div
        className="ag-theme-quartz" // applying the Data Grid theme
        style={{ height: '100%', width: '100%' }} // the Data Grid will fill the size of the parent container
      >
        <AgGridReact
          rowData={rowData}
          columnDefs={cols}
          selection={selection}
          onGridSizeChanged={onGridSizeChanged}
          onSelectionChanged={onRowSelection}
        />
      </div>
    </div>)
}

export default EmailPortal
