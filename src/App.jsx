import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { soundEngine } from "./simulation/audioSynth";
import { RaceEngine } from "./simulation/raceEngine";
import { RaceVideoRecorder } from "./simulation/videoRecorder";
import { NCAA_TEAMS, getTeamById } from "./data/ncaaTeams";
import { TeamSelector } from "./components/TeamSelector";
import { OddsInput } from "./components/OddsInput";
import { Scorebug } from "./components/Scorebug";
import { parseUrlParams } from "./utils/shareUrl";
import { Play, RotateCcw, Download, Volume2, VolumeX, Flame, Trophy } from "lucide-react";
import "./styles/main.css";

// Cryptographically Secure Seed Generator
function generateCryptoSeed() {
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    const arr = new Uint32Array(2);
    window.crypto.getRandomValues(arr);
    const timeEntropy = Math.floor(performance.now() * 1000) ^ Date.now();
    return Math.abs((arr[0] ^ arr[1] ^ timeEntropy) % 1000000);
  }
  return Math.floor(Math.random() * 1000000);
}

export default function App() {
  // Default matchup: Notre Dame (ND) vs Virginia (UVA)
  const [teamA, setTeamA] = useState(() => getTeamById("notre_dame"));
  const [teamB, setTeamB] = useState(() => getTeamById("virginia"));
  const [teamAProb, setTeamAProb] = useState(50);
  const [seed, setSeed] = useState(() => generateCryptoSeed());
  const [isRerun, setIsRerun] = useState(false);

  // Game state
  const [gameState, setGameState] = useState("SETUP"); // SETUP, RACING, FINISHED
  const [raceStats, setRaceStats] = useState({ yardA: 0, yardB: 0, leader: null });
  const [winner, setWinner] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

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
        setIsRerun(true);
        showToast("Loaded Matchup Seed from Link!");
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
  const handleStartRace = (forceRerun = false) => {
    let currentSeed;
    let rerunFlag = false;

    if (forceRerun) {
      rerunFlag = true;
      currentSeed = seed;
    } else {
      currentSeed = generateCryptoSeed();
      setSeed(currentSeed);
    }

    setIsRerun(rerunFlag);
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
        currentSeed,
        rerunFlag
      );
      raceEngineRef.current = engine;

      const recorder = new RaceVideoRecorder(canvasRef.current);
      recorderRef.current = recorder;
      recorder.startRecording();

      engine.onProgressUpdate = (stats) => {
        setRaceStats(stats);
      };

      engine.onRaceComplete = (winningTeam) => {
        setWinner(winningTeam);
        setGameState("FINISHED");

        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: [winningTeam.primaryColor, winningTeam.secondaryColor, "#FFCC00"]
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

  return (
    <div className="app-root">
      {/* Top Navbar */}
      <header className="app-header">
        <div className="brand-container">
          <Flame className="brand-icon" size={22} />
          <div className="brand-title">
            <span>FORCE</span>
            <span>WEASEL</span>
            <span className="brand-subline">SIMULATOR</span>
          </div>
        </div>

        <div className="header-actions">
          <button className="icon-btn" onClick={toggleSound}>
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            {isMuted ? "SOUND OFF" : "SOUND ON"}
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
              CHOOSE TWO NCAA FBS TEAMS AND SET THE WIN PROBABILITY TO SIMULATE A THEATRICAL 100-YARD DASH!
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
            <button className="launch-sim-btn" onClick={() => handleStartRace(false)}>
              <Play size={18} fill="currentColor" />
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

            {/* 60 FPS Canvas */}
            <div className="canvas-wrapper">
              {isRerun && <div className="rerun-tag">THIS IS A RERUN</div>}
              <canvas
                ref={canvasRef}
                width={900}
                height={450}
                className="race-canvas"
              />
            </div>

            {/* Victory Action Bar */}
            {gameState === "FINISHED" && winner && (
              <div className="victory-bar">
                <div className="victory-title">
                  <Trophy size={22} color="#b45309" />
                  <div>
                    <div className="winner-banner" style={{ color: winner.primaryColor }}>
                      {winner.name.toUpperCase()} WINS!
                    </div>
                    {isRerun && (
                      <span style={{ fontSize: "0.5rem", color: "#b91c1c", fontWeight: "bold" }}>
                        [ RERUN SEED #{seed} ]
                      </span>
                    )}
                  </div>
                </div>

                <div className="victory-buttons">
                  <button className="btn-primary" onClick={handleDownloadVideo}>
                    <Download size={14} /> VIDEO (.WEBM)
                  </button>
                  <button className="btn-secondary" onClick={() => handleStartRace(true)}>
                    <RotateCcw size={14} /> RE-RUN
                  </button>
                  <button className="btn-secondary" onClick={() => handleStartRace(false)}>
                    NEW RUN
                  </button>
                  <button className="btn-secondary" onClick={() => setGameState("SETUP")}>
                    NEW MATCHUP
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Toast Notification */}
      {toastMessage && <div className="toast-msg">{toastMessage}</div>}
    </div>
  );
}
