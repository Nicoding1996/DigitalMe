import './LoadingIndicator.css';

const LoadingIndicator = () => {
  return (
    <div className="loading-indicator">
      <div className="loading-dots">
        <span className="loading-dot"></span>
        <span className="loading-dot"></span>
        <span className="loading-dot"></span>
      </div>
      <p className="loading-text">[ PROCESSING ]</p>
    </div>
  );
};

export default LoadingIndicator;
