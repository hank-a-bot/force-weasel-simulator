import React from "react";
import { Zap } from "lucide-react";

export function OddsInput({ teamA, teamB, teamAProb, onChangeProb }) {
  const teamBProb = 100 - teamAProb;

  const handleSliderChange = (e) => {
    onChangeProb(parseInt(e.target.value, 10));
  };

  const handleNumberChange = (val) => {
    let num = parseInt(val, 10);
    if (isNaN(num)) num = 50;
    num = Math.max(1, Math.min(99, num));
    onChangeProb(num);
  };

  return (
    <div className="odds-input-container">
      <div className="odds-header">
        <span>WIN PROBABILITY / ODDS</span>
        <span className="odds-subtext">Default 50/50 - Adjust to simulate game odds</span>
      </div>

      {/* Visual Percentage Bar */}
      <div className="odds-visual-bar">
        <div
          className="odds-segment team-a-segment"
          style={{
            width: `${teamAProb}%`,
            backgroundColor: teamA.primaryColor
          }}
        >
          <span>{teamA.shortName}: {teamAProb}%</span>
        </div>
        <div
          className="odds-segment team-b-segment"
          style={{
            width: `${teamBProb}%`,
            backgroundColor: teamB.primaryColor
          }}
        >
          <span>{teamB.shortName}: {teamBProb}%</span>
        </div>
      </div>

      {/* Slider Input */}
      <div className="slider-wrapper">
        <input
          type="range"
          min="1"
          max="99"
          value={teamAProb}
          onChange={handleSliderChange}
          className="odds-range-slider"
        />
      </div>

      {/* Synchronized Numeric Inputs */}
      <div className="numeric-inputs-row">
        <div className="num-box">
          <label style={{ color: teamA.primaryColor }}>{teamA.shortName} %</label>
          <input
            type="number"
            min="1"
            max="99"
            value={teamAProb}
            onChange={(e) => handleNumberChange(e.target.value)}
          />
        </div>

        <div className="versus-badge">VS</div>

        <div className="num-box">
          <label style={{ color: teamB.primaryColor }}>{teamB.shortName} %</label>
          <input
            type="number"
            min="1"
            max="99"
            value={teamBProb}
            onChange={(e) => handleNumberChange(100 - parseInt(e.target.value || 50, 10))}
          />
        </div>
      </div>

      {/* Quick Presets */}
      <div className="odds-presets">
        <button className="preset-btn" onClick={() => onChangeProb(50)}>
          <Zap size={14} /> 50/50 Even
        </button>
        <button className="preset-btn" onClick={() => onChangeProb(60)}>
          60/40 Favorite
        </button>
        <button className="preset-btn" onClick={() => onChangeProb(75)}>
          75/25 Heavy Fav
        </button>
        <button className="preset-btn" onClick={() => onChangeProb(90)}>
          90/10 Huge Fav
        </button>
      </div>
    </div>
  );
}
