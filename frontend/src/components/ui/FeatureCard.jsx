import styles from "./FeatureCard.module.css";

const FeatureCard = ({
  icon,
  title,
  description,
  benefits,
  className = "",
}) => {
  return <div className={`${styles.featureCard} ${className}`}>
    <div className={styles.featureIcon}>
      {icon}
    </div>
    <h3 className={styles.featureTitle}>{title}</h3>
    <p className={styles.featureDescription}>{description}</p>
    {benefits && (
    <ul className={styles.featureBenefits}>
        {benefits.map((benefit, index)=>(
          <li key={index}>{benefit}</li>
        ))}
    </ul>
    )}
  </div>;
};

export default FeatureCard;
