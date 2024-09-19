import React from 'react';
import styles from '../styles/loading.module.css';

const LoadingCircle = ({ size = 50, borderWidth = 4, color = '#4CAF50' }) => {
  return (
    <div className={styles.loadingContainer}>
      <div
        className={styles.loadingCircle}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderWidth: `${borderWidth}px`,
          borderTopColor: color
        }}
      ></div>
    </div>
  );
};

export default LoadingCircle;
