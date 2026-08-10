import React from "react";
import { Flag, Trophy } from "lucide-react";

export function Scorebug({ teamA, teamB, teamAProb, yardA, yardB, leader, isFinished, winner }) {
  const distanceA = Math.max(0, Math.round(100 - yardA));
  const distanceB = Math.max(0, Math.round(100 - yardB));

  return (
    <div className="scorebug-container">
      <div className="scorebug-card">
        {/* Team A Side */}
        <div
          className="scorebug-team team-left"
          style={{
            background: `linear-gradient(135deg, ${teamA.primaryColor} 0%, #0d1322 100%)`,
            borderLeft: `6px solid ${teamA.secondaryColor}`
          }}
        >
          <div className="scorebug-team-info">
            <span className="team-abbr">{teamA.shortName.toUpperCase()}</span>
            <span className="team-odds">{teamAProb}% CHANCE</span>
          </div>
          <div className="yard-badge">{distanceA} YDS TO GO</div>
        </div>

        {/* Center Live Ticker / VS Badge */}
        <div className="scorebug-center">
          <div className="logo-title">FORCE WEASEL DASH</div>
          {isFinished && winner ? (
            <div className="winner-pill" style={{ backgroundColor: winner.primaryColor }}>
              <Trophy size={14} /> WINNER: {winner.shortName.toUpperCase()}
            </div>
          ) : leader ? (
            <div className="leader-pill" style={{ backgroundColor: leader.primaryColor }}>
              <Flag size={12} /> LEADER: {leader.shortName.toUpperCase()}
            </div>
          ) : (
            <div className="versus-pill">100-YARD DASH</div>
          )}
        </div>

        {/* Team B Side */}
        <div
          className="scorebug-team team-right"
          style={{
            background: `linear-gradient(225deg, ${teamB.primaryColor} 0%, #0d1322 100%)`,
            borderRight: `6px solid ${teamB.secondaryColor}`
          }}
        >
          <div className="yard-badge">{distanceB} YDS TO GO</div>
          <div className="scorebug-team-info text-right">
            <span className="team-abbr">{teamB.shortName.toUpperCase()}</span>
            <span className="team-odds">{100 - teamAProb}% CHANCE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
