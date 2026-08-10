import React from "react";
import { Flag, Trophy } from "lucide-react";
import { resolveJerseyColors } from "../utils/colorUtils";

export function Scorebug({ teamA, teamB, teamAProb, yardA, yardB, leader, isFinished, winner }) {
  const distanceA = Math.max(0, Math.round(100 - yardA));
  const distanceB = Math.max(0, Math.round(100 - yardB));

  const colors = resolveJerseyColors(teamA, teamB);

  return (
    <div className="scorebug-container">
      <div className="scorebug-card">
        {/* Team A Side (Top Lane) */}
        <div
          className="scorebug-team team-left"
          style={{
            backgroundColor: colors.teamAJersey,
            color: "#FFFFFF",
            borderBottom: `3px solid ${teamA.secondaryColor}`
          }}
        >
          <div className="scorebug-team-info">
            <span className="team-abbr" style={{ color: "#FFFFFF", textShadow: "2px 2px 0px #000000, -1px -1px 0px #000000, 1px -1px 0px #000000, -1px 1px 0px #000000" }}>
              {teamA.shortName.toUpperCase()}
            </span>
            <span className="team-odds" style={{ color: "#FFCC00", textShadow: "1px 1px 0px #000000" }}>
              {teamAProb}%
            </span>
          </div>
          <div className="yard-badge">{distanceA} YDS</div>
        </div>

        {/* Center Live Ticker / Leader Badge */}
        <div className="scorebug-center">
          <div className="logo-title">FORCE WEASEL DASH</div>
          {isFinished && winner ? (
            <div className="winner-pill" style={{ backgroundColor: "#000000", color: "#FFCC00", border: "2px solid #FFCC00" }}>
              <Trophy size={11} color="#FFCC00" /> {winner.shortName.toUpperCase()} WINS
            </div>
          ) : leader ? (
            <div className="leader-pill" style={{ backgroundColor: "#000000", color: "#FFCC00", border: "2px solid #FFCC00" }}>
              <Flag size={10} color="#FFCC00" /> LEADER: {leader.shortName.toUpperCase()}
            </div>
          ) : (
            <div className="versus-pill">100-YARD DASH</div>
          )}
        </div>

        {/* Team B Side (Bottom Lane) */}
        <div
          className="scorebug-team team-right"
          style={{
            backgroundColor: colors.teamBJersey,
            color: "#FFFFFF",
            borderBottom: `3px solid ${teamB.secondaryColor}`
          }}
        >
          <div className="yard-badge">{distanceB} YDS</div>
          <div className="scorebug-team-info text-right">
            <span className="team-abbr" style={{ color: "#FFFFFF", textShadow: "2px 2px 0px #000000, -1px -1px 0px #000000, 1px -1px 0px #000000, -1px 1px 0px #000000" }}>
              {teamB.shortName.toUpperCase()}
            </span>
            <span className="team-odds" style={{ color: "#FFCC00", textShadow: "1px 1px 0px #000000" }}>
              {100 - teamAProb}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
