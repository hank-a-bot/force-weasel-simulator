import React, { useState } from "react";
import { CONFERENCES, NCAA_TEAMS } from "../data/ncaaTeams";
import { Search, ChevronDown, Check } from "lucide-react";

export function TeamSelector({ label, selectedTeam, onSelectTeam, disabledTeamId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeConference, setActiveConference] = useState("ALL");

  // Filter teams based on conference, search, and exclude disabled team
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

      {/* Trigger Button */}
      <button
        type="button"
        className="team-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          borderColor: selectedTeam.primaryColor,
          boxShadow: `0 0 15px ${selectedTeam.primaryColor}40`
        }}
      >
        <div className="team-badge" style={{ backgroundColor: selectedTeam.primaryColor }}>
          <span style={{ color: selectedTeam.textColor }}>
            {selectedTeam.shortName.substring(0, 2).toUpperCase()}
          </span>
        </div>
        <div className="team-selector-info">
          <span className="team-name">{selectedTeam.name}</span>
          <span className="team-conference">{selectedTeam.conference}</span>
        </div>
        <ChevronDown className="chevron-icon" />
      </button>

      {/* Dropdown Modal */}
      {isOpen && (
        <div className="team-dropdown-overlay" onClick={() => setIsOpen(false)}>
          <div className="team-dropdown-card" onClick={(e) => e.stopPropagation()}>
            <div className="dropdown-header">
              <h3>Select {label}</h3>
              <button className="close-btn" onClick={() => setIsOpen(false)}>
                &times;
              </button>
            </div>

            {/* Search Input */}
            <div className="search-box">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                placeholder="Search team, mascot, conference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
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

            {/* Teams List */}
            <div className="teams-grid">
              {filteredTeams.length === 0 ? (
                <div className="no-teams">No teams match your search.</div>
              ) : (
                filteredTeams.map((team) => (
                  <button
                    key={team.id}
                    className={`team-option-card ${
                      selectedTeam.id === team.id ? "selected" : ""
                    }`}
                    onClick={() => {
                      onSelectTeam(team);
                      setIsOpen(false);
                    }}
                  >
                    <div
                      className="team-color-swatch"
                      style={{
                        backgroundColor: team.primaryColor,
                        borderRight: `6px solid ${team.secondaryColor}`
                      }}
                    />
                    <div className="team-option-details">
                      <span className="team-option-name">{team.shortName}</span>
                      <span className="team-option-mascot">{team.mascot}</span>
                    </div>
                    {selectedTeam.id === team.id && <Check size={18} className="check-icon" />}
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
