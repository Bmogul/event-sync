import Image from "next/image";
import { AgGridReact } from "ag-grid-react";
import styles from "../styles/portal.module.css";
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid

import React, { useEffect, useState, useMemo, useCallback } from "react";

const EmailPortal = ({
  event,
  toast,
  params,
  setLoading,
  guestList,
  password,
  getGuestList,
  updateGuestList,
}) => {
  const [reminderDate, setReminderDate] = useState();
  const [selectedRows, setSelectedRows] = useState([]);

  const [cols, setCols] = useState([
    { field: "GUID", width: 80 },
    { field: "UID", width: 80 },
    { field: "FamilyOrder", filter: true, width: 80},
    { field: "Name", filter: true },
    { field: "Email", filter: true },
    { field: "MainInvite", filter: true },
    { field: "MainResponse", filter: true, width: 100 },
    { field: "Sent", maxWidth: 90, minWidth: 50, filter: true },
  ]);
  const [rowData, setRowData] = useState(guestList);

  const selection = useMemo(() => {
    return {
      mode: "multiRow",
      selectAllFiltered: true,
      suppressRowDeselection: true,
      checkboxSelection: true,
    };
  }, []);

  useEffect(() => {
    setRowData(guestList);
    console.log(guestList);
  }, [guestList]);

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

  const onRowSelection = useCallback((event) => {
    const filteredRows = event.api
      .getModel()
      .rowsToDisplay.filter((node) => node.selected);
    const selectedRowsData = filteredRows.map((node) => node.data);
    setSelectedRows(selectedRowsData);
    console.log(selectedRowsData); // For debugging
  }, []);

  // Send Mail
  const SendMail = async () => {
    console.log(password);
    toast("Sending Mail");
    const res = await fetch(`/api/${params.eventID}/sendMail`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        guestList: selectedRows,
        password: password,
        event: event,
      }),
    });
    const result = await res.json();

    if (res.status === 200 && result.validated) {
      toast("Mail sent!");
      updateGuestList(result.guestList);
    } else {
      console.log(res.status, result.validated);
      toast("Failed to send invites, try again");
    }
  };
  // Send Reminder
  const SendReminder = async () => {
    console.log(password);
    toast("Sending Reminder");
    console.log(selectedRows);
    const res = await fetch(`/api/${params.eventID}/sendReminder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        guestList: selectedRows,
        password: password,
        event: event,
      }),
    });
    const result = await res.json();

    if (res.status === 200 && result.validated) {
      toast("Reminders sent!");
      updateGuestList(result.guestList);
    } else {
      console.log(res.status, result.validated);
      toast("Failed to send invites, try again");
    }
  };
  // Send Reminder
  const SendReminderAll = async () => {
    console.log(password);
    toast("Sending Reminder");
    const reminderList = guestList.filter(
      (user) => user.Sent === "Yes" && user.MainResponse === "",
    );
    console.log(reminderList);
    const res = await fetch(`/api/${params.eventID}/sendReminder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        guestList: reminderList,
        password: password,
        event: event,
      }),
    });
    const result = await res.json();

    if (res.status === 200 && result.validated) {
      toast("Reminders sent!");
      updateGuestList(result.guestList);
    } else {
      console.log(res.status, result.validated);
      toast("Failed to send invites, try again");
    }
  };
  // Send Update
  const SendUpdateAll = async () => {
    console.log(password);
    toast("Sending Update");
    const reminderList = guestList.filter(
      (user) => user.MainResponse === "1" || user.MainResponse == 1,
    );
    console.log(reminderList);
    const res = await fetch(`/api/${params.eventID}/sendUpdate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        guestList: reminderList,
        password: password,
        event: event,
      }),
    });
    const result = await res.json();

    if (res.status === 200 && result.validated) {
      toast("Updates sent!");
      updateGuestList(result.guestList);
    } else {
      console.log(res.status, result.validated);
      toast("Failed to send invites, try again");
    }
  };

  return (
    <>
      {/* Quick Actions */}
      <div className={styles.actionButtons}>
        <button 
          className={styles.actionBtn} 
          onClick={SendMail}
          title="Send invite to selected guests"
        >
          <div className={styles.actionBtnIcon}>📮</div>
          <div>
            <div>Send Invites</div>
            <div className={styles.actionBtnSubtitle}>
              Send to selected guests
            </div>
          </div>
        </button>
        <button 
          className={styles.actionBtn} 
          onClick={SendReminder}
          title="Send reminders to selected guests"
        >
          <div className={styles.actionBtnIcon}>⏰</div>
          <div>
            <div>Send Reminders</div>
            <div className={styles.actionBtnSubtitle}>
              Remind selected guests
            </div>
          </div>
        </button>
        <button 
          className={styles.actionBtn} 
          onClick={SendReminderAll}
          title="Send reminders to all non-responders"
        >
          <div className={styles.actionBtnIcon}>📢</div>
          <div>
            <div>Send Reminder All</div>
            <div className={styles.actionBtnSubtitle}>
              Remind non-responders
            </div>
          </div>
        </button>
        <button 
          className={styles.actionBtn} 
          onClick={SendUpdateAll}
          title="Send updates to all respondents"
        >
          <div className={styles.actionBtnIcon}>🔄</div>
          <div>
            <div>Send Update All</div>
            <div className={styles.actionBtnSubtitle}>
              Event updates
            </div>
          </div>
        </button>
      </div>

      {/* Guest List Section */}
      <div className={styles.guestSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Guest Management</h2>
          <div className={styles.sectionControls}>
            <button className={styles.btnOutlineSmall}>Add Guest</button>
            <button className={styles.btnPrimarySmall}>Import List</button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedRows.length > 0 && (
          <div className={styles.bulkActions}>
            <span className={styles.bulkCount}>{selectedRows.length} guests selected</span>
            <button className={styles.btnPrimarySmall} onClick={SendMail}>Send Invites</button>
            <button className={styles.btnOutlineSmall} onClick={SendReminder}>Send Reminders</button>
            <button className={styles.btnSecondarySmall}>Export Selected</button>
          </div>
        )}

        {/* Table Controls */}
        <div className={styles.tableControls}>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search guests by name or email..."
          />
          <select className={styles.filterSelect}>
            <option value="">All Guests</option>
            <option value="sent">Invited</option>
            <option value="responded">Responded</option>
            <option value="pending">Pending</option>
          </select>
          <select className={styles.filterSelect}>
            <option value="">All Families</option>
            <option value="1">Family 1</option>
            <option value="2">Family 2</option>
            <option value="3">Family 3</option>
          </select>
        </div>

        {/* Guest Table */}
        <div className={styles.tableContainer}>
          <div
            className="ag-theme-quartz"
            style={{ height: "500px", width: "100%" }}
          >
            <AgGridReact
              rowData={rowData}
              columnDefs={cols}
              selection={selection}
              onGridSizeChanged={onGridSizeChanged}
              onSelectionChanged={onRowSelection}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default EmailPortal;
