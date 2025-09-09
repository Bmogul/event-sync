import styles from '../../page.module.css'

const Branding = () => {
  return (
    <div className={styles.authBrand}>
      <div className={styles.brandLogo}>EventSync</div>
      <div className={styles.brandTagline}>Seamless Event Management</div>
      <div className={styles.brandDescription}>
        Create beautiful multi-day events, manage RSVPs, and bring your
        celebrations to life with our intuitive platform.
      </div>
      <ul className={styles.brandFeatures}>
        <li>Multi-day event planning</li>
        <li>Smart RSVP management</li>
        <li>Guest group organization</li>
        <li>Real-time notifications</li>
        <li>Beautiful event pages</li>
      </ul>
    </div>
  );
};

export default Branding;
