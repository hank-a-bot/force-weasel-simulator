import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { soundEngine } from "./simulation/audioSynth";
import { RaceEngine } from "./simulation/raceEngine";
import { RaceVideoRecorder } from "./simulation/videoRecorder";
import { NCAA_TEAMS, getTeamById } from "./data/ncaaTeams";
import { TeamSelector } from "./components/TeamSelector";
import { OddsInput } from "./components/OddsInput";
import { Scorebug } from "./components/Scorebug";
import { getShareUrl, parseUrlParams } from "./utils/shareUrl";
import { Play, RotateCcw, Download, Share2, Volume2, VolumeX, Flame, Trophy } from "lucide-react";
import "./styles/main.css";

export default function App() {
  // Default matchup: Ohio State vs Michigan
  const [teamA, setTeamA] = useState(getTeamById("ohio_state"));
  const [teamB, setTeamB] = useState(getTeamById("michigan"));
  const [teamAProb, setTeamAProb] = useState(50);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1000000));

  // Game state
  const [gameState, setGameState] = useState("SETUP"); // SETUP, RACING, FINISHED
  const [raceStats, setRaceStats] = useState({ yardA: 0, yardB: 0, leader: null });
  const [winner, setWinner] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isRecordingSupported, setIsRecordingSupported] = useState(true);

  const canvasRef = useRef(null);
  const raceEngineRef = useRef(null);
  const recorderRef = useRef(null);

  // Check URL parameters for shareable matchup link on mount
  useEffect(() => {
    const params = parseUrlParams();
    if (params) {
      const loadedTeamA = getTeamById(params.teamAId);
      const loadedTeamB = getTeamById(params.teamBId);
      if (loadedTeamA && loadedTeamB && loadedTeamA.id !== loadedTeamB.id) {
        setTeamA(loadedTeamA);
        setTeamB(loadedTeamB);
        setTeamAProb(params.teamAProb);
        setSeed(params.seed);
        showToast("Loaded Matchup from Shared Link!");
      }
    }
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleSound = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  // Start 100-Yard Dash Simulation
  const handleStartRace = () => {
    // Generate fresh seed if re-running
    const currentSeed = gameState === "FINISHED" ? Math.floor(Math.random() * 1000000) : seed;
    setSeed(currentSeed);

    setGameState("RACING");
    setWinner(null);
    setRaceStats({ yardA: 0, yardB: 0, leader: null });

    setTimeout(() => {
      if (!canvasRef.current) return;

      const engine = new RaceEngine(
        canvasRef.current,
        teamA,
        teamB,
        teamAProb,
        currentSeed
      );
      raceEngineRef.current = engine;

      // Start Video Recording
      const recorder = new RaceVideoRecorder(canvasRef.current);
      recorderRef.current = recorder;
      recorder.startRecording();

      engine.onProgressUpdate = (stats) => {
        setRaceStats(stats);
      };

      engine.onRaceComplete = (winningTeam) => {
        setWinner(winningTeam);
        setGameState("FINISHED");

        // Confetti Burst!
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: [winningTeam.primaryColor, winningTeam.secondaryColor, "#FFD700"]
        });
      };

      engine.start();
    }, 100);
  };

  // Download Video Export
  const handleDownloadVideo = async () => {
    if (recorderRef.current) {
      const filename = `force-weasel-dash-${teamA.id}-vs-${teamB.id}.webm`;
      await recorderRef.current.stopAndDownload(filename);
      showToast("Downloading Race Video (.webm)...");
    } else {
      showToast("Video recording unavailable.");
    }
  };

  // Copy Shareable Link
  const handleShareLink = () => {
    const shareUrl = getShareUrl(teamA.id, teamB.id, teamAProb, seed);
    navigator.clipboard.writeText(shareUrl);
    showToast("Shareable Dash Link Copied to Clipboard!");
  };

  return (
    <div className="app-root">
      {/* Top Navbar */}
      <header className="app-header">
        <div className="brand-container">
          <Flame className="brand-icon" size={28} />
          <div>
            <div className="brand-title">FORCE WEASEL SIMULATOR</div>
            <div className="brand-subtitle">100-YARD DASH GAME DECIDER</div>
          </div>
        </div>

        <div className="header-actions">
          <button className="icon-btn" onClick={toggleSound}>
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            {isMuted ? "Sound Off" : "Sound On"}
          </button>
          <button className="icon-btn" onClick={handleShareLink}>
            <Share2 size={18} />
            Share Link
          </button>
        </div>
      </header>

      {/* Main App Container */}
      <main className="main-content">
        {gameState === "SETUP" ? (
          /* SETUP PANEL */
          <div className="setup-panel">
            <h1 className="setup-title">SELECT MATCHUP & ODDS</h1>
            <p className="setup-subtitle">
              Choose two NCAA FBS teams and set the victory odds. The Force Weasel Simulator will generate a theatrical 100-yard dash race!
            </p>

            {/* Team Selection */}
            <div className="teams-selection-grid">
              <TeamSelector
                label="Team #1 (Top Lane)"
                selectedTeam={teamA}
                onSelectTeam={setTeamA}
                disabledTeamId={teamB.id}
              />
              <div className="vs-badge-large">VS</div>
              <TeamSelector
                label="Team #2 (Bottom Lane)"
                selectedTeam={teamB}
                onSelectTeam={setTeamB}
                disabledTeamId={teamA.id}
              />
            </div>

            {/* Probability Odds Input */}
            <OddsInput
              teamA={teamA}
              teamB={teamB}
              teamAProb={teamAProb}
              onChangeProb={setTeamAProb}
            />

            {/* Launch Simulation Button */}
            <button className="launch-sim-btn" onClick={handleStartRace}>
              <Play size={26} fill="currentColor" />
              RUN THE 100-YARD DASH
            </button>
          </div>
        ) : (
          /* RACING & FINISHED VIEW */
          <div className="sim-container">
            {/* TV Scorebug Header */}
            <Scorebug
              teamA={teamA}
              teamB={teamB}
              teamAProb={teamAProb}
              yardA={raceStats.yardA}
              yardB={raceStats.yardB}
              leader={raceStats.leader}
              isFinished={gameState === "FINISHED"}
              winner={winner}
            />

            {/* 60 FPS Animation Canvas */}
            <div className="canvas-wrapper">
              <canvas
                ref={canvasRef}
                width={1000}
                height={480}
                className="race-canvas"
              />
            </div>

            {/* Victory Action Bar (Displayed when finished) */}
            {gameState === "FINISHED" && winner && (
              <div className="victory-bar">
                <div className="victory-title">
                  <Trophy size={32} color="#FFD700" />
                  <div>
                    <div className="winner-banner" style={{ color: winner.primaryColor }}>
                      {winner.name.toUpperCase()} WINS!
                    </div>
                    <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                      Odds Displayed: {winner.id === teamA.id ? teamAProb : 100 - teamAProb}%
                    </span>
                  </div>
                </div>

                <div className="victory-buttons">
                  <button className="btn-primary" onClick={handleDownloadVideo}>
                    <Download size={18} /> Download Race Video (.webm)
                  </button>
                  <button className="btn-secondary" onClick={handleStartRace}>
                    <RotateCcw size={18} /> Re-Run Dash
                  </button>
                  <button className="btn-secondary" onClick={() => setGameState("SETUP")}>
                    New Matchup
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Toast Popup Notification */}
      {toastMessage && <div className="toast-msg">{toastMessage}</div>}
    </div>
  );
}
