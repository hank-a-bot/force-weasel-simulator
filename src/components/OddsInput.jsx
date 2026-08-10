import React from "react";

export function OddsInput({ teamA, teamB, teamAProb, onChangeProb }) {
  const teamBProb = 100 - teamAProb;

  const handleSliderChange = (e) => {
    onChangeProb(Number(e.target.value));
  };

  const handleTeamAInputChange = (e) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val)) val = 0;
    val = Math.max(0, Math.min(100, val));
    onChangeProb(val);
  };

  const handleTeamBInputChange = (e) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val)) val = 0;
    val = Math.max(0, Math.min(100, val));
    onChangeProb(100 - val);
  };

  return (
    <div className="odds-input-container">
      <div className="odds-header">
        <span>WIN PROBABILITY / ODDS</span>
        <span className="odds-subtext">50/50 DEFAULT</span>
      </div>

      {/* Visual Bar showing team probability splits */}
      <div className="odds-visual-bar">
        <div
          className="odds-segment"
          style={{
            width: `${teamAProb}%`,
            backgroundColor: teamA.primaryColor,
            color: teamA.textColor
          }}
        >
          {teamAProb >= 15 && `${teamA.shortName}: ${teamAProb}%`}
        </div>
        <div
          className="odds-segment"
          style={{
            width: `${teamBProb}%`,
            backgroundColor: teamB.primaryColor,
            color: teamB.textColor
          }}
        >
          {teamBProb >= 15 && `${teamB.shortName}: ${teamBProb}%`}
        </div>
      </div>

      {/* Range Slider */}
      <input
        type="range"
        min="1"
        max="99"
        value={teamAProb}
        onChange={handleSliderChange}
        className="odds-range-slider"
        aria-label="Adjust win probability slider"
      />

      {/* Numeric Inputs */}
      <div className="numeric-inputs-row">
        <div className="num-box">
          <label style={{ color: teamA.primaryColor }}>{teamA.shortName} %</label>
          <input
            type="number"
            min="0"
            max="100"
            value={teamAProb}
            onChange={handleTeamAInputChange}
            aria-label={`${teamA.name} win probability percentage`}
          />
        </div>
        <div className="num-box">
          <label style={{ color: teamB.primaryColor }}>{teamB.shortName} %</label>
          <input
            type="number"
            min="0"
            max="100"
            value={teamBProb}
            onChange={handleTeamBInputChange}
            aria-label={`${teamB.name} win probability percentage`}
          />
        </div>
      </div>
    </div>
  );
}
