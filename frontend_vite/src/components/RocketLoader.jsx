import React from 'react';
import './RocketLoader.css';

/**
 * RocketLoader Component
 * Animated rocket loading indicator with horizontal flight animation
 */
const RocketLoader = ({ text = 'LOADING' }) => {
    return (
        <div className="rocket-loader-container">
            <div className="rocket-wrapper">
                {/* Rocket SVG */}
                <svg
                    className="rocket"
                    width="200"
                    height="120"
                    viewBox="0 0 200 120"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* Top Wing (Red) */}
                    <path
                        d="M 60 30 L 100 15 L 130 55 L 90 70 Z"
                        fill="#E74C3C"
                        className="rocket-wing-top"
                    />

                    {/* Body (Yellow/Orange Gradient) */}
                    <defs>
                        <linearGradient id="rocketGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#F39C12" />
                            <stop offset="50%" stopColor="#F1C40F" />
                            <stop offset="100%" stopColor="#F39C12" />
                        </linearGradient>
                    </defs>

                    {/* Main body */}
                    <rect
                        x="70"
                        y="45"
                        width="90"
                        height="30"
                        rx="5"
                        fill="url(#rocketGradient)"
                        className="rocket-body"
                    />

                    {/* Window/Circle */}
                    <circle
                        cx="130"
                        cy="60"
                        r="8"
                        fill="#2C3E50"
                        stroke="#E74C3C"
                        strokeWidth="2"
                        className="rocket-window"
                    />

                    {/* Nose cone (Red) */}
                    <path
                        d="M 160 60 L 180 45 L 180 75 Z"
                        fill="#E74C3C"
                        className="rocket-nose"
                    />

                    {/* Bottom Wing (Red) */}
                    <path
                        d="M 60 90 L 100 105 L 130 65 L 90 50 Z"
                        fill="#E74C3C"
                        className="rocket-wing-bottom"
                    />

                    {/* Exhaust flames */}
                    <g className="exhaust-flames">
                        <ellipse cx="55" cy="60" rx="15" ry="6" fill="#FF6B6B" opacity="0.8" className="flame flame-1" />
                        <ellipse cx="45" cy="60" rx="12" ry="5" fill="#FFA500" opacity="0.9" className="flame flame-2" />
                        <ellipse cx="35" cy="60" rx="8" ry="4" fill="#FFD700" opacity="0.7" className="flame flame-3" />
                    </g>

                    {/* Speed lines */}
                    <line x1="20" y1="50" x2="50" y2="50" stroke="#95A5A6" strokeWidth="2" opacity="0.5" className="speed-line speed-line-1" />
                    <line x1="15" y1="60" x2="50" y2="60" stroke="#95A5A6" strokeWidth="2" opacity="0.5" className="speed-line speed-line-2" />
                    <line x1="25" y1="70" x2="50" y2="70" stroke="#95A5A6" strokeWidth="2" opacity="0.5" className="speed-line speed-line-3" />
                </svg>
            </div>

            {/* Loading Text */}
            <div className="loading-text">
                <span className="loading-letter">{text.charAt(0)}</span>
                <span className="loading-letter" style={{ animationDelay: '0.1s' }}>{text.charAt(1)}</span>
                <span className="loading-letter" style={{ animationDelay: '0.2s' }}>{text.charAt(2)}</span>
                <span className="loading-letter" style={{ animationDelay: '0.3s' }}>{text.charAt(3)}</span>
                <span className="loading-letter" style={{ animationDelay: '0.4s' }}>{text.charAt(4)}</span>
                <span className="loading-letter" style={{ animationDelay: '0.5s' }}>{text.charAt(5)}</span>
                <span className="loading-letter" style={{ animationDelay: '0.6s' }}>{text.charAt(6)}</span>
            </div>
        </div>
    );
};

export default RocketLoader;
