import styles from './ProgressSteps.module.css'

const ProgressSteps = ({ currentStep, onStepClick }) => {
  const steps = [
    { number: 1, icon: '📝', label: 'Event Details' },
    { number: 2, icon: '🎯', label: 'Sub-Events' },
    { number: 3, icon: '👥', label: 'Guest List' },
    { number: 4, icon: '👥', label: 'RSVP Page' },
    { number: 5, icon: '🚀', label: 'Launch' },
  ]

  return (
    <div className={styles.progressSteps}>
      {steps.map((step, index) => (
        <div 
          key={step.number}
          className={`${styles.progressStep} ${currentStep === step.number ? styles.active : ''} ${currentStep > step.number ? styles.completed : ''}`}
          onClick={() => onStepClick(step.number)}
        >
          <div className={styles.stepIcon}>
            {currentStep > step.number ? '✓' : step.icon}
          </div>
          <span className={styles.stepLabel}>{step.label}</span>
          {index < steps.length - 1 && <div className={styles.stepConnector}></div>}
        </div>
      ))}
    </div>
  )
}

export default ProgressSteps
