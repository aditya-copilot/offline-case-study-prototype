import { useLocation } from 'react-router-dom';
import './ProgressBar.css';

const steps = [
  { id: 'offer', label: 'Offers', path: '/offer', icon: '💰' },
  { id: 'cykc', label: 'KYC', path: '/cykc', icon: '📝' },
  { id: 'mandate', label: 'Mandate', path: '/mandate', icon: '🔄' },
  { id: 'kfs', label: 'Agreement', path: '/kfs', icon: '📄' },
  { id: 'approved', label: 'Approved', path: '/approved', icon: '✅' },
  { id: 'invoice', label: 'Invoice', path: '/invoice', icon: '📤' },
  { id: 'disbursed', label: 'Disbursed', path: '/disbursed', icon: '🪙' }
];

export default function ProgressBar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const currentStepIndex = steps.findIndex(step =>
    currentPath.includes(step.path)
  );

  const progress = ((currentStepIndex + 1) / steps.length) * 100;
  
  return (
    <div className="progress-bar-container">
      <div className="progress-track">
        <div 
          className="progress-fill"
          style={{ width: `${Math.max(progress, 10)}%` }}
        />
      </div>
      <div className="progress-steps">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isPending = index > currentStepIndex;
          
          return (
            <div 
              key={step.id}
              className={`progress-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isPending ? 'pending' : ''}`}
            >
              <div className="step-icon">
                {isCompleted ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span>{step.icon}</span>
                )}
              </div>
              <span className="step-label">{step.label}</span>
              {isCurrent && <div className="step-pulse" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
