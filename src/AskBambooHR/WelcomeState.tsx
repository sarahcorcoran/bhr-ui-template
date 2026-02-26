import { employeeContext } from './employeeContext';
import './WelcomeState.css';

const WELCOME_SUGGESTIONS = [
  'Request time off',
  'Submit an expense',
  'Update my info',
];

interface WelcomeStateProps {
  onSend: (text: string) => void;
}

export function WelcomeState({ onSend }: WelcomeStateProps) {
  return (
    <div className="welcome-state">
      <div className="welcome-state__content">
        <h1 className="welcome-state__heading">
          Hi {employeeContext.employee.preferredName}!
        </h1>
        <p className="welcome-state__subtext">
          What are we tackling today?
        </p>
        <div className="welcome-state__suggestions">
          {WELCOME_SUGGESTIONS.map(label => (
            <button
              key={label}
              type="button"
              className="suggestion-pill"
              onClick={() => onSend(label)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
