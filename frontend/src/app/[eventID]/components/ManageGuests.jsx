'use client';

import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from "../styles/portal.module.css";

const ManageGuests = ({event, guests})=>{
  useEffect(()=>{
    console.log("MANAGE GUEST LIST", guests, event)
  },[])
  return <></>
}

export default ManageGuests;
