import './WelcomeScreen.css';

const WelcomeScreen = ({ onGetStarted }) => {
  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-header">
          <h1 className="welcome-title">
            <span className="title-digital">Digital</span>
            <span className="title-me">Me</span>
          </h1>
          <div className="title-subtitle">.dev</div>
        </div>

        <div className="welcome-description">
          <p className="description-main">
            Your AI-powered digital doppelgänger that learns your unique communication style.
          </p>
          <p className="description-detail">
            Connect your digital footprint—GitHub repositories, blog posts, or writing samples—and 
            watch as your AI twin mirrors your voice in text and code.
          </p>
        </div>

        <div className="welcome-features">
          <div className="feature-item">
            <div className="feature-icon">→</div>
            <div className="feature-text">Analyze your coding patterns and writing style</div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">→</div>
            <div className="feature-text">Generate text and code in your unique voice</div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">→</div>
            <div className="feature-text">Experience the mirror interface of human-AI duality</div>
          </div>
        </div>

        <button className="welcome-cta" onClick={onGetStarted}>
          Get Started
        </button>

        <div className="welcome-footer">
          <div className="system-message">
            [SYSTEM] Ready to initialize digital twin protocol
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
