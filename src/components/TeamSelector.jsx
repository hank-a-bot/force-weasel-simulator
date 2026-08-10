import React, { useState } from "react";
import { CONFERENCES, NCAA_TEAMS } from "../data/ncaaTeams";
import { Search, ChevronDown, Check } from "lucide-react";

export function TeamSelector({ label, selectedTeam, onSelectTeam, disabledTeamId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeConference, setActiveConference] = useState("ALL");

  const filteredTeams = NCAA_TEAMS.filter((team) => {
    if (disabledTeamId && team.id === disabledTeamId) return false;
    if (activeConference !== "ALL" && team.conference !== activeConference) return false;
    if (searchTerm.trim() !== "") {
      const q = searchTerm.toLowerCase();
      return (
        team.name.toLowerCase().includes(q) ||
        team.mascot.toLowerCase().includes(q) ||
        team.conference.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="team-selector-container">
      <label className="team-selector-label">{label}</label>

      {/* Trigger Button styled in Selected Team Colors */}
      <button
        type="button"
        className="team-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          backgroundColor: selectedTeam.primaryColor,
          color: selectedTeam.textColor,
          borderColor: selectedTeam.secondaryColor || "#000000"
        }}
      >
        <div
          className="team-badge"
          style={{
            backgroundColor: selectedTeam.secondaryColor || "#000000",
            color: selectedTeam.primaryColor
          }}
        >
          {selectedTeam.shortName.substring(0, 2).toUpperCase()}
        </div>
        <div className="team-selector-info">
          <span className="team-name" style={{ color: selectedTeam.textColor }}>
            {selectedTeam.name}
          </span>
          <span className="team-conference" style={{ color: selectedTeam.textColor, opacity: 0.85 }}>
            {selectedTeam.conference}
          </span>
        </div>
        <ChevronDown className="chevron-icon" style={{ color: selectedTeam.textColor }} />
      </button>

      {/* Modal Dropdown */}
      {isOpen && (
        <div
          className="team-dropdown-overlay"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Select ${label}`}
        >
          <div className="team-dropdown-card" onClick={(e) => e.stopPropagation()}>
            <div className="dropdown-header">
              <h3>Select {label}</h3>
              <button className="close-btn" onClick={() => setIsOpen(false)} aria-label="Close modal">
                &times;
              </button>
            </div>

            {/* Search Box */}
            <div className="search-box">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                placeholder="Search team, mascot, conference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                aria-label="Search teams"
              />
            </div>

            {/* Conference Filter Tabs */}
            <div className="conference-tabs">
              <button
                className={`conf-tab ${activeConference === "ALL" ? "active" : ""}`}
                onClick={() => setActiveConference("ALL")}
              >
                ALL
              </button>
              {CONFERENCES.map((conf) => (
                <button
                  key={conf}
                  className={`conf-tab ${activeConference === conf ? "active" : ""}`}
                  onClick={() => setActiveConference(conf)}
                >
                  {conf}
                </button>
              ))}
            </div>

            {/* Teams Grid (Painted in Team Colors!) */}
            <div className="teams-grid">
              {filteredTeams.length === 0 ? (
                <div className="no-teams">No teams match your search.</div>
              ) : (
                filteredTeams.map((team) => (
                  <button
                    key={team.id}
                    className={`team-option-card ${selectedTeam.id === team.id ? "selected" : ""}`}
                    onClick={() => {
                      onSelectTeam(team);
                      setIsOpen(false);
                    }}
                    style={{
                      backgroundColor: team.primaryColor,
                      borderColor: team.secondaryColor || "#000000",
                      color: team.textColor
                    }}
                  >
                    <div
                      className="team-color-badge"
                      style={{
                        backgroundColor: team.secondaryColor || "#000000",
                        color: team.primaryColor
                      }}
                    >
                      {team.shortName.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="team-option-details">
                      <span className="team-option-name" style={{ color: team.textColor }}>
                        {team.shortName}
                      </span>
                      <span className="team-option-mascot" style={{ color: team.textColor, opacity: 0.85 }}>
                        {team.mascot}
                      </span>
                    </div>
                    {selectedTeam.id === team.id && (
                      <Check size={18} className="check-icon" style={{ color: team.textColor }} />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
