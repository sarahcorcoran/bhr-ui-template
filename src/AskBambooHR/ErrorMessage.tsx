import { Icon } from '../components/Icon';
import { Button } from '../components/Button';
import './ErrorMessage.css';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="error-bubble">
      <div className="error-bubble__icon">
        <Icon name="circle-exclamation" size={16} />
      </div>
      <div className="error-bubble__content">
        <span className="error-bubble__text">{message}</span>
        {onRetry && (
          <Button
            variant="outlined"
            size="small"
            className="error-bubble__retry"
            onClick={onRetry}
          >
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
