import { useState } from 'react';

/**
 * LaunchAnimation Component
 * 
 * A premium, ritualistic SVG stroke-draw animation that plays when
 * the user clicks "Launch Your Startup Journey" button.
 * 
 * Animation Sequence:
 * 1. Button visible, SVG hidden
 * 2. On click: Button fades out
 * 3. SVG container scales in
 * 4. Rocket path draws (stroke-dashoffset animation)
 * 5. Flames animate
 * 6. Stars/particles appear
 * 7. Growth lines extend
 * 8. ROCKET LAUNCHES AND FLIES OFF SCREEN
 * 9. Final message reveals
 * 
 * Duration: ~10 seconds total
 */
const LaunchAnimation = ({ onComplete }) => {
  const [isLaunched, setIsLaunched] = useState(false);
  const [isRocketFlying, setIsRocketFlying] = useState(false);
  const [showFinalMessage, setShowFinalMessage] = useState(false);

  const handleLaunch = () => {
    setIsLaunched(true);

    // After drawing completes (~6.5s), start rocket launch
    setTimeout(() => {
      setIsRocketFlying(true);
    }, 6500);

    // Show final message after rocket flies away (~9s)
    setTimeout(() => {
      setShowFinalMessage(true);
      if (onComplete) onComplete();
    }, 9000);
  };

  return (
    <div className="launch-animation-container">
      {/* ====== LAUNCH BUTTON ====== */}
      <button
        className={`launch-button ${isLaunched ? 'launched' : ''}`}
        onClick={handleLaunch}
        disabled={isLaunched}
      >
        <span className="launch-button-icon">🚀</span>
        <span className="launch-button-text">Launch Your Startup Journey</span>
        <span className="launch-button-glow"></span>
      </button>

      {/* ====== SVG ANIMATION CONTAINER ====== */}
      <div className={`svg-animation-wrapper ${isLaunched ? 'active' : ''}`}>
        <svg
          viewBox="0 0 800 600"
          className="launch-svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background Grid Pattern */}
          <defs>
            <linearGradient id="rocketGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00d4ff" />
              <stop offset="100%" stopColor="#9b59b6" />
            </linearGradient>
            <linearGradient id="flameGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ff6b35" />
              <stop offset="50%" stopColor="#f7931e" />
              <stop offset="100%" stopColor="#ffcc00" />
            </linearGradient>
            <linearGradient id="growthGradient" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#00d4ff" />
              <stop offset="100%" stopColor="#00ff88" />
            </linearGradient>
            <linearGradient id="trailGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ff6b35" stopOpacity="0" />
              <stop offset="30%" stopColor="#f7931e" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffcc00" stopOpacity="1" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glowStrong">
              <feGaussianBlur stdDeviation="6" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glowIntense">
              <feGaussianBlur stdDeviation="12" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ====== LAYER 1: LAUNCH PAD (Stays in place) ====== */}
          <g className="launch-pad-group">
            {/* Base Platform */}
            <path
              className="draw-path pad-base"
              d="M300 450 L500 450 L520 470 L280 470 Z"
              fill="none"
              stroke="url(#rocketGradient)"
              strokeWidth="2"
              filter="url(#glow)"
            />
            {/* Support Beams */}
            <path
              className="draw-path pad-beam-left"
              d="M320 470 L300 520"
              fill="none"
              stroke="#00d4ff"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              className="draw-path pad-beam-right"
              d="M480 470 L500 520"
              fill="none"
              stroke="#00d4ff"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              className="draw-path pad-beam-center"
              d="M400 470 L400 520"
              fill="none"
              stroke="#00d4ff"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>

          {/* ====== SMOKE/EXHAUST TRAIL (Shows during launch) ====== */}
          <g className={`exhaust-group ${isRocketFlying ? 'active' : ''}`}>
            <ellipse className="smoke smoke-1" cx="400" cy="450" rx="60" ry="20" fill="#666" opacity="0" />
            <ellipse className="smoke smoke-2" cx="380" cy="460" rx="40" ry="15" fill="#888" opacity="0" />
            <ellipse className="smoke smoke-3" cx="420" cy="465" rx="50" ry="18" fill="#777" opacity="0" />
            <ellipse className="smoke smoke-4" cx="400" cy="475" rx="70" ry="25" fill="#555" opacity="0" />
          </g>

          {/* ====== LAYER 2: ROCKET GROUP (This will fly up) ====== */}
          <g className={`rocket-flying-group ${isRocketFlying ? 'launching' : ''}`}>
            {/* Rocket Trail (visible during flight) */}
            <path
              className="rocket-trail"
              d="M400 440 L400 600"
              fill="none"
              stroke="url(#trailGradient)"
              strokeWidth="30"
              strokeLinecap="round"
              filter="url(#glowIntense)"
              opacity="0"
            />
            <path
              className="rocket-trail-inner"
              d="M400 440 L400 550"
              fill="none"
              stroke="#ffcc00"
              strokeWidth="8"
              strokeLinecap="round"
              filter="url(#glowStrong)"
              opacity="0"
            />

            {/* Main Rocket Body */}
            <path
              className="draw-path rocket-body"
              d="M400 120 
                 C400 120 360 180 360 280 
                 L360 400 
                 C360 420 380 440 400 440 
                 C420 440 440 420 440 400 
                 L440 280 
                 C440 180 400 120 400 120"
              fill="none"
              stroke="url(#rocketGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              filter="url(#glow)"
            />

            {/* Rocket Nose Cone */}
            <path
              className="draw-path rocket-nose"
              d="M400 80 L380 140 L400 120 L420 140 Z"
              fill="none"
              stroke="#00d4ff"
              strokeWidth="2"
              strokeLinejoin="round"
              filter="url(#glow)"
            />

            {/* Window */}
            <circle
              className="draw-path rocket-window"
              cx="400"
              cy="220"
              r="25"
              fill="none"
              stroke="#9b59b6"
              strokeWidth="3"
              filter="url(#glow)"
            />

            {/* Fins */}
            <path
              className="draw-path rocket-fin-left"
              d="M360 380 L320 440 L360 420"
              fill="none"
              stroke="url(#rocketGradient)"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              className="draw-path rocket-fin-right"
              d="M440 380 L480 440 L440 420"
              fill="none"
              stroke="url(#rocketGradient)"
              strokeWidth="2"
              strokeLinejoin="round"
            />

            {/* ====== FLAMES (Part of rocket, moves with it) ====== */}
            <g className="flames-group">
              <path
                className="draw-path flame-center"
                d="M400 440 
                   Q390 500 400 560 
                   Q410 500 400 440"
                fill="none"
                stroke="url(#flameGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                filter="url(#glowStrong)"
              />
              <path
                className="draw-path flame-left"
                d="M385 445 
                   Q360 510 375 550 
                   Q385 490 385 445"
                fill="none"
                stroke="#ff6b35"
                strokeWidth="4"
                strokeLinecap="round"
                filter="url(#glow)"
              />
              <path
                className="draw-path flame-right"
                d="M415 445 
                   Q440 510 425 550 
                   Q415 490 415 445"
                fill="none"
                stroke="#ff6b35"
                strokeWidth="4"
                strokeLinecap="round"
                filter="url(#glow)"
              />
            </g>
          </g>

          {/* ====== LAYER 4: STARS & PARTICLES ====== */}
          <g className="stars-group">
            {/* Star 1 */}
            <path
              className="draw-path star star-1"
              d="M150 150 L155 165 L170 165 L158 175 L163 190 L150 180 L137 190 L142 175 L130 165 L145 165 Z"
              fill="none"
              stroke="#00d4ff"
              strokeWidth="1.5"
              filter="url(#glow)"
            />
            {/* Star 2 */}
            <path
              className="draw-path star star-2"
              d="M650 120 L653 130 L663 130 L655 137 L658 147 L650 141 L642 147 L645 137 L637 130 L647 130 Z"
              fill="none"
              stroke="#9b59b6"
              strokeWidth="1.5"
              filter="url(#glow)"
            />
            {/* Star 3 */}
            <path
              className="draw-path star star-3"
              d="M100 350 L103 360 L113 360 L105 367 L108 377 L100 371 L92 377 L95 367 L87 360 L97 360 Z"
              fill="none"
              stroke="#00ff88"
              strokeWidth="1.5"
              filter="url(#glow)"
            />
            {/* Star 4 */}
            <path
              className="draw-path star star-4"
              d="M700 300 L703 310 L713 310 L705 317 L708 327 L700 321 L692 327 L695 317 L687 310 L697 310 Z"
              fill="none"
              stroke="#00d4ff"
              strokeWidth="1.5"
              filter="url(#glow)"
            />

            {/* Particle Dots */}
            <circle className="draw-path particle p-1" cx="200" cy="200" r="3" fill="none" stroke="#00d4ff" strokeWidth="2" />
            <circle className="draw-path particle p-2" cx="600" cy="180" r="2" fill="none" stroke="#9b59b6" strokeWidth="2" />
            <circle className="draw-path particle p-3" cx="180" cy="450" r="2.5" fill="none" stroke="#00ff88" strokeWidth="2" />
            <circle className="draw-path particle p-4" cx="620" cy="420" r="3" fill="none" stroke="#ff6b35" strokeWidth="2" />
          </g>

          {/* ====== LAYER 5: GROWTH CHART ====== */}
          <g className="growth-group">
            {/* Growth Line Chart */}
            <path
              className="draw-path growth-line"
              d="M80 500 L150 480 L220 490 L290 420 L360 380 L430 300 L500 250 L570 180 L640 120 L720 60"
              fill="none"
              stroke="url(#growthGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
            />
            {/* Growth Arrow Head */}
            <path
              className="draw-path growth-arrow"
              d="M720 60 L700 70 M720 60 L710 80"
              fill="none"
              stroke="#00ff88"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>

          {/* ====== LAYER 6: ORBIT RINGS ====== */}
          <g className="orbit-group">
            <ellipse
              className="draw-path orbit orbit-1"
              cx="400"
              cy="280"
              rx="180"
              ry="60"
              fill="none"
              stroke="#9b59b6"
              strokeWidth="1"
              opacity="0.5"
              strokeDasharray="10,5"
            />
            <ellipse
              className="draw-path orbit orbit-2"
              cx="400"
              cy="280"
              rx="220"
              ry="80"
              fill="none"
              stroke="#00d4ff"
              strokeWidth="1"
              opacity="0.3"
              strokeDasharray="15,10"
            />
          </g>

          {/* ====== LAYER 7: FINAL MESSAGE ====== */}
          <g className={`final-message-group ${showFinalMessage ? 'visible' : ''}`}>
            <text
              x="400"
              y="320"
              textAnchor="middle"
              className="final-message-text"
              fill="url(#rocketGradient)"
              fontSize="32"
              fontWeight="bold"
              fontFamily="'Outfit', sans-serif"
              filter="url(#glow)"
            >
              🚀 Launched Successfully!
            </text>
            <text
              x="400"
              y="370"
              textAnchor="middle"
              className="final-message-subtext"
              fill="#ffffff"
              fontSize="20"
              fontFamily="'Inter', sans-serif"
              opacity="0.7"
            >
              Your Startup Journey Begins
            </text>
          </g>
        </svg>
      </div>

      {/* ====== CSS STYLES ====== */}
      <style>{`
        /* ===== CONTAINER ===== */
        .launch-animation-container {
          position: relative;
          width: 100%;
          min-height: 600px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(ellipse at center, #1a0a2e 0%, #0a0a0a 70%);
          overflow: hidden;
          border-radius: 24px;
        }

        /* ===== LAUNCH BUTTON ===== */
        .launch-button {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 40px;
          font-size: 1.25rem;
          font-weight: 600;
          font-family: 'Outfit', sans-serif;
          color: white;
          background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
          border: none;
          border-radius: 50px;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 10;
          box-shadow: 
            0 4px 30px rgba(255, 107, 53, 0.4),
            0 0 60px rgba(255, 107, 53, 0.2);
        }

        .launch-button:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 
            0 6px 40px rgba(255, 107, 53, 0.5),
            0 0 80px rgba(255, 107, 53, 0.3);
        }

        .launch-button:active:not(:disabled) {
          transform: scale(0.98);
        }

        .launch-button.launched {
          opacity: 0;
          transform: scale(0.8);
          pointer-events: none;
        }

        .launch-button-icon {
          font-size: 1.5rem;
          animation: rocketWiggle 2s ease-in-out infinite;
        }

        .launch-button-glow {
          position: absolute;
          inset: -2px;
          background: linear-gradient(45deg, #00d4ff, #9b59b6, #ff6b35, #00d4ff);
          background-size: 400% 400%;
          border-radius: 50px;
          z-index: -1;
          opacity: 0;
          animation: glowRotate 3s linear infinite;
          transition: opacity 0.3s;
        }

        .launch-button:hover .launch-button-glow {
          opacity: 1;
        }

        @keyframes rocketWiggle {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-3px) rotate(-5deg); }
          75% { transform: translateY(-3px) rotate(5deg); }
        }

        @keyframes glowRotate {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* ===== SVG ANIMATION WRAPPER ===== */
        .svg-animation-wrapper {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transform: scale(0.8);
          pointer-events: none;
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .svg-animation-wrapper.active {
          opacity: 1;
          transform: scale(1);
          pointer-events: auto;
        }

        .launch-svg {
          width: 100%;
          max-width: 800px;
          height: auto;
        }

        /* ===== STROKE DRAW ANIMATION BASE ===== */
        .draw-path {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
        }

        /* ===== ANIMATION TRIGGERS (Only when wrapper is active) ===== */
        .svg-animation-wrapper.active .draw-path {
          animation: drawStroke var(--draw-duration, 1.5s) var(--draw-easing, cubic-bezier(0.4, 0, 0.2, 1)) var(--draw-delay, 0s) forwards;
        }

        @keyframes drawStroke {
          to {
            stroke-dashoffset: 0;
          }
        }

        /* ===== SEQUENTIAL TIMING ===== */
        
        /* Layer 1: Launch Pad (0s - 1s) */
        .pad-base { --draw-delay: 0s; --draw-duration: 0.8s; }
        .pad-beam-left { --draw-delay: 0.4s; --draw-duration: 0.4s; }
        .pad-beam-right { --draw-delay: 0.5s; --draw-duration: 0.4s; }
        .pad-beam-center { --draw-delay: 0.6s; --draw-duration: 0.4s; }
        
        /* Layer 2: Rocket (1s - 3s) */
        .rocket-body { --draw-delay: 1s; --draw-duration: 1.5s; stroke-dasharray: 2000; stroke-dashoffset: 2000; }
        .rocket-nose { --draw-delay: 2.2s; --draw-duration: 0.5s; }
        .rocket-window { --draw-delay: 2.5s; --draw-duration: 0.6s; stroke-dasharray: 160; stroke-dashoffset: 160; }
        .rocket-fin-left { --draw-delay: 2.8s; --draw-duration: 0.4s; }
        .rocket-fin-right { --draw-delay: 3s; --draw-duration: 0.4s; }
        
        /* Layer 3: Flames (3.5s - 4.5s) */
        .flame-center { --draw-delay: 3.5s; --draw-duration: 0.6s; stroke-dasharray: 300; stroke-dashoffset: 300; }
        .flame-left { --draw-delay: 3.7s; --draw-duration: 0.5s; stroke-dasharray: 250; stroke-dashoffset: 250; }
        .flame-right { --draw-delay: 3.9s; --draw-duration: 0.5s; stroke-dasharray: 250; stroke-dashoffset: 250; }
        
        /* Layer 4: Stars (4s - 5.5s) */
        .star-1 { --draw-delay: 4s; --draw-duration: 0.5s; }
        .star-2 { --draw-delay: 4.3s; --draw-duration: 0.5s; }
        .star-3 { --draw-delay: 4.6s; --draw-duration: 0.5s; }
        .star-4 { --draw-delay: 4.9s; --draw-duration: 0.5s; }
        .p-1 { --draw-delay: 4.2s; --draw-duration: 0.3s; stroke-dasharray: 20; stroke-dashoffset: 20; }
        .p-2 { --draw-delay: 4.5s; --draw-duration: 0.3s; stroke-dasharray: 15; stroke-dashoffset: 15; }
        .p-3 { --draw-delay: 4.8s; --draw-duration: 0.3s; stroke-dasharray: 18; stroke-dashoffset: 18; }
        .p-4 { --draw-delay: 5.1s; --draw-duration: 0.3s; stroke-dasharray: 20; stroke-dashoffset: 20; }
        
        /* Layer 5: Growth Chart (5s - 6s) */
        .growth-line { --draw-delay: 5s; --draw-duration: 1s; stroke-dasharray: 1500; stroke-dashoffset: 1500; }
        .growth-arrow { --draw-delay: 5.8s; --draw-duration: 0.3s; stroke-dasharray: 50; stroke-dashoffset: 50; }
        
        /* Layer 6: Orbits (5.5s - 6.5s) */
        .orbit-1 { --draw-delay: 5.5s; --draw-duration: 0.8s; stroke-dasharray: 1200; stroke-dashoffset: 1200; }
        .orbit-2 { --draw-delay: 5.8s; --draw-duration: 0.8s; stroke-dasharray: 1500; stroke-dashoffset: 1500; }

        /* ===== ROCKET LAUNCH ANIMATION ===== */
        .rocket-flying-group {
          transform-origin: center center;
          transition: none;
        }

        .rocket-flying-group.launching {
          animation: rocketLaunch 2.5s cubic-bezier(0.4, 0, 0.6, 1) forwards;
        }

        @keyframes rocketLaunch {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          20% {
            transform: translateY(10px) scale(1.02);
            opacity: 1;
          }
          30% {
            transform: translateY(-20px) scale(1);
          }
          100% {
            transform: translateY(-800px) scale(0.3);
            opacity: 0;
          }
        }

        /* Rocket trail during launch */
        .rocket-trail,
        .rocket-trail-inner {
          opacity: 0;
          transition: opacity 0.3s;
        }

        .rocket-flying-group.launching .rocket-trail {
          animation: trailAppear 2.5s ease-out forwards;
        }

        .rocket-flying-group.launching .rocket-trail-inner {
          animation: trailAppear 2.5s ease-out 0.1s forwards;
        }

        @keyframes trailAppear {
          0% { opacity: 0; }
          20% { opacity: 0; }
          30% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }

        /* Flames intensify during launch */
        .rocket-flying-group.launching .flames-group {
          animation: flamesIntensify 2.5s ease-out forwards;
        }

        @keyframes flamesIntensify {
          0% { transform: scaleY(1); filter: brightness(1); }
          20% { transform: scaleY(1.5); filter: brightness(1.3); }
          30% { transform: scaleY(2); filter: brightness(1.5); }
          100% { transform: scaleY(2.5); filter: brightness(2); }
        }

        /* ===== SMOKE/EXHAUST ANIMATION ===== */
        .exhaust-group .smoke {
          opacity: 0;
        }

        .exhaust-group.active .smoke {
          animation: smokeCloud 3s ease-out forwards;
        }

        .exhaust-group.active .smoke-1 { animation-delay: 0s; }
        .exhaust-group.active .smoke-2 { animation-delay: 0.2s; }
        .exhaust-group.active .smoke-3 { animation-delay: 0.4s; }
        .exhaust-group.active .smoke-4 { animation-delay: 0.6s; }

        @keyframes smokeCloud {
          0% {
            opacity: 0;
            transform: scale(0.5) translateY(0);
          }
          20% {
            opacity: 0.6;
            transform: scale(1) translateY(0);
          }
          100% {
            opacity: 0;
            transform: scale(2.5) translateY(50px);
          }
        }

        /* ===== FINAL MESSAGE ===== */
        .final-message-group {
          opacity: 0;
          transform: translateY(20px);
          transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .final-message-group.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .final-message-text {
          letter-spacing: 2px;
        }

        .final-message-subtext {
          letter-spacing: 1px;
        }

        /* ===== FLAME FLICKER ANIMATION ===== */
        .svg-animation-wrapper.active .flame-center,
        .svg-animation-wrapper.active .flame-left,
        .svg-animation-wrapper.active .flame-right {
          animation: 
            drawStroke var(--draw-duration) var(--draw-easing) var(--draw-delay) forwards,
            flameFlicker 0.1s ease-in-out 4.5s infinite alternate;
        }

        @keyframes flameFlicker {
          0% { opacity: 0.8; transform: scaleY(1); }
          100% { opacity: 1; transform: scaleY(1.1); }
        }

        /* ===== STAR TWINKLE ===== */
        .svg-animation-wrapper.active .star {
          animation: 
            drawStroke var(--draw-duration) var(--draw-easing) var(--draw-delay) forwards,
            starTwinkle 1.5s ease-in-out 5.5s infinite alternate;
        }

        @keyframes starTwinkle {
          0% { opacity: 0.5; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1.1); }
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 768px) {
          .launch-button {
            padding: 16px 28px;
            font-size: 1rem;
          }
          
          .launch-svg {
            max-width: 100%;
            padding: 20px;
          }
          
          .final-message-text {
            font-size: 20px !important;
          }
          
          .final-message-subtext {
            font-size: 14px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LaunchAnimation;
