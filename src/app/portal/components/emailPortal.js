import Image from "next/image";
import { AgGridReact } from 'ag-grid-react'
import styles from '../styles/portal.module.css'
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid

import React, { useEffect, useState, useMemo, useCallback } from 'react'


const EmailPortal = ({ event, toast }) => {

  const [cols, setCols] = useState([
    { field: 'GUID', width: 80 },
    { field: 'UID', width: 80 },
    { field: 'Name', filter: true },
    { field: 'Email', filter: true },
    { field: 'Tag', filter: true, width: 100 },
    { field: 'Sent', maxWidth: 80, minWidth: 50, filter: true },
  ]);
  const [rowData, setRowData] = useState([
    { GUID: "akjsdkajs", UID: "1", Name: "Burhanuddin Mogul", Email: "burhanuddin@bmogul.net", Tag:"Family", Sent: "Yes" },
    { GUID: "akjsdkajs", UID: "1", Name: "Burhanuddin Mogul", Email: "burhanuddin@bmogul.net", Tag:"Friend", Sent: "Yes" },
    { GUID: "akjsdkajs", UID: "1", Name: "Burhanuddin Mogul", Email: "burhanuddin@bmogul.net", Tag:"Family", Sent: "Yes" },
    { GUID: "akjsdkajs", UID: "1", Name: "Burhanuddin Mogul", Email: "burhanuddin@bmogul.net", Tag:"Out of State", Sent: "Yes" },
    { GUID: "akjsdkajs", UID: "1", Name: "Burhanuddin Mogul", Email: "burhanuddin@bmogul.net", Tag:"Out of State", Sent: "Yes" },
    { GUID: "akjsdkajs", UID: "1", Name: "Burhanuddin Mogul", Email: "burhanuddin@bmogul.net", Tag:"Jamat", Sent: "Yes" },
    { GUID: "akjsdkajs", UID: "1", Name: "Burhanuddin Mogul", Email: "burhanuddin@bmogul.net", Tag:"Jamat", Sent: "Yes" },
    { GUID: "akjsdkajs", UID: "1", Name: "Burhanuddin Mogul", Email: "burhanuddin@bmogul.net", Tag:"Family, Friend", Sent: "Yes" },
    { GUID: "akjsdkajs", UID: "1", Name: "Burhanuddin Mogul", Email: "burhanuddin@bmogul.net", Tag:"Family", Sent: "Yes" },
    { GUID: "akjsdkajs", UID: "1", Name: "Burhanuddin Mogul", Email: "burhanuddin@bmogul.net", Tag:"Family", Sent: "Yes" },
  ])
  const selection = useMemo(() => {
    return {
      mode: "multiRow",
    };
  }, []);

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

  return (
    <div className={styles.Mailbox}>
      <div>
        <h2>{event.eventTitle}</h2>
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
        />
      </div>
    </div>)
}

export default EmailPortal
