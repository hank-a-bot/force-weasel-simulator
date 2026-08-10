// 60 FPS HTML5 Canvas Engine for Force Weasel Simulator
import { soundEngine } from "./audioSynth";
import { resolveJerseyColors } from "../utils/colorUtils";

export class RaceEngine {
  constructor(canvas, teamA, teamB, teamAProb, seed, isRerun = false) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.teamA = teamA;
    this.teamB = teamB;
    this.teamAProb = teamAProb;
    this.seed = seed;
    this.isRerun = isRerun;

    // Resolve color conflicts
    this.jerseyColors = resolveJerseyColors(teamA, teamB);

    this.isRunning = false;
    this.isFinished = false;
    this.startTime = null;
    this.duration = 11.5; // 11.5 seconds fast sprint

    // Roll winner based on seed and probability
    const rng = this.seededRandom(seed);
    this.teamAWins = rng < teamAProb / 100;
    this.winner = this.teamAWins ? teamA : teamB;

    // Lead change frequency based on seed
    const rngLeads = this.seededRandom(seed + 42);
    let baseLeads = 3;
    if (rngLeads < 0.45) baseLeads = 3;
    else if (rngLeads < 0.75) baseLeads = 4;
    else if (rngLeads < 0.90) baseLeads = 5;
    else if (rngLeads < 0.97) baseLeads = 6;
    else baseLeads = 7;

    const oddsCloseness = 1 - Math.abs(teamAProb - 50) / 50;
    this.numLeadChanges = Math.max(1, Math.round(baseLeads * (0.4 + oddsCloseness * 0.6)));

    // Generate smooth continuous forward trajectories
    this.trajectories = this.generateSmoothForwardTrajectories(rng, this.numLeadChanges);

    this.particles = [];
    this.commentaryToasts = [];
    this.leadChangeCount = 0;

    this.progress = 0;
    this.yardA = 0;
    this.yardB = 0;
    this.currentLeader = null;
    this.animFrameId = null;

    this.onProgressUpdate = null;
    this.onRaceComplete = null;
  }

  seededRandom(seed) {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  generateSmoothForwardTrajectories(rng, numChanges) {
    const teamAWins = this.teamAWins;
    const freq = numChanges * Math.PI;

    return {
      getPosA: (p) => {
        if (p <= 0) return 0;
        if (p >= 1) return 100 + (teamAWins ? 4 : 0);

        let pos = p * 100;
        let leadDelta = Math.sin(p * freq) * 2.2;

        if (p > 0.85) {
          const finishFactor = (p - 0.85) / 0.15;
          const winnerSurge = teamAWins ? finishFactor * 4 : -finishFactor * 4;
          leadDelta = leadDelta * (1 - finishFactor) + winnerSurge;
        }

        return Math.max(0, Math.min(104, pos + leadDelta));
      },
      getPosB: (p) => {
        if (p <= 0) return 0;
        if (p >= 1) return 100 + (!teamAWins ? 4 : 0);

        let pos = p * 100;
        let leadDelta = -Math.sin(p * freq) * 2.2;

        if (p > 0.85) {
          const finishFactor = (p - 0.85) / 0.15;
          const winnerSurge = !teamAWins ? finishFactor * 4 : -finishFactor * 4;
          leadDelta = leadDelta * (1 - finishFactor) + winnerSurge;
        }

        return Math.max(0, Math.min(104, pos + leadDelta));
      }
    };
  }

  start() {
    this.isRunning = true;
    this.isFinished = false;
    this.startTime = performance.now();

    soundEngine.playStarterGun();
    soundEngine.playWhistle();

    if (this.jerseyColors.isConflict) {
      this.addToast(
        `COLOR CONFLICT! ${this.teamB.shortName.toUpperCase()} WEARING SECONDARY KIT!`,
        "#FFCC00"
      );
    } else {
      this.addToast("STARTER GUN BLAST! THEY'RE OFF!", "#FFCC00");
    }

    const loop = (timestamp) => {
      if (!this.isRunning) return;
      const elapsed = (timestamp - this.startTime) / 1000;
      this.progress = Math.min(1, elapsed / this.duration);

      this.update(this.progress);
      this.render();

      if (this.progress < 1) {
        this.animFrameId = requestAnimationFrame(loop);
      } else {
        this.finish();
      }
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  stop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
  }

  update(p) {
    this.yardA = this.trajectories.getPosA(p);
    this.yardB = this.trajectories.getPosB(p);

    const prevLeader = this.currentLeader;
    if (Math.abs(this.yardA - this.yardB) > 0.8) {
      this.currentLeader = this.yardA > this.yardB ? this.teamA : this.teamB;
    }

    if (prevLeader && this.currentLeader && prevLeader.id !== this.currentLeader.id && p < 0.92) {
      this.leadChangeCount++;
      soundEngine.playCrowdRoar(0.7);
      this.addToast(
        `LEAD CHANGE! ${this.currentLeader.shortName.toUpperCase()} SURGES AHEAD!`,
        "#FFCC00"
      );
    }

    if (Math.floor(p * 50) % 4 === 0) {
      soundEngine.playStep();
    }

    if (Math.random() < 0.5) {
      this.addParticle(this.yardA, 1);
      this.addParticle(this.yardB, 2);
    }

    this.commentaryToasts.forEach((t) => (t.life -= 0.016));
    this.commentaryToasts = this.commentaryToasts.filter((t) => t.life > 0);

    this.particles.forEach((pt) => {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.alpha -= 0.03;
    });
    this.particles = this.particles.filter((pt) => pt.alpha > 0);

    if (this.onProgressUpdate) {
      this.onProgressUpdate({
        progress: p,
        yardA: this.yardA,
        yardB: this.yardB,
        leader: this.currentLeader,
        isFinished: false
      });
    }
  }

  finish() {
    this.isRunning = false;
    this.isFinished = true;

    soundEngine.playWhistle();
    soundEngine.playVictoryFanfare();

    this.addToast(
      `TOUCHDOWN! ${this.winner.name.toUpperCase()} WINS!`,
      "#FFCC00"
    );

    for (let i = 0; i < 70; i++) {
      this.particles.push({
        x: this.canvas.width * 0.86 + (Math.random() - 0.5) * 60,
        y: this.canvas.height * 0.5 + (Math.random() - 0.5) * 120,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        color: i % 2 === 0 ? this.winner.primaryColor : "#FFCC00",
        size: Math.random() * 6 + 4,
        alpha: 1.0
      });
    }

    this.render();

    if (this.onRaceComplete) {
      this.onRaceComplete(this.winner);
    }
  }

  addToast(text, color = "#FFCC00") {
    this.commentaryToasts.push({
      text,
      color,
      life: 2.2
    });
  }

  addParticle(yard, lane) {
    const x = this.yardToCanvasX(yard);
    const y = lane === 1 ? this.canvas.height * 0.38 : this.canvas.height * 0.65;

    this.particles.push({
      x: x - 10,
      y: y + 10,
      vx: -(Math.random() * 2 + 1),
      vy: (Math.random() - 0.5) * 1,
      color: lane === 1 ? this.jerseyColors.teamAJersey : this.jerseyColors.teamBJersey,
      size: Math.random() * 4 + 2,
      alpha: 0.8
    });
  }

  yardToCanvasX(yard) {
    const margin = this.canvas.width * 0.12;
    const trackWidth = this.canvas.width * 0.76;
    return margin + (yard / 100) * trackWidth;
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    this.renderField(ctx, w, h);

    this.particles.forEach((pt) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.alpha);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Render Sprinters
    this.renderSprinter(
      ctx,
      this.yardToCanvasX(this.yardA),
      h * 0.38,
      this.teamA,
      this.jerseyColors.teamAJersey,
      this.jerseyColors.teamAText,
      this.progress,
      1
    );

    this.renderSprinter(
      ctx,
      this.yardToCanvasX(this.yardB),
      h * 0.65,
      this.teamB,
      this.jerseyColors.teamBJersey,
      this.jerseyColors.teamBText,
      this.progress,
      2
    );

    const finishX = this.yardToCanvasX(100);
    ctx.save();
    ctx.strokeStyle = this.isFinished ? "#FFCC00" : "#FFFFFF";
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(finishX, h * 0.22);
    ctx.lineTo(finishX, h * 0.78);
    ctx.stroke();
    ctx.restore();

    // 100% High-Contrast Commentary Banner
    if (this.commentaryToasts.length > 0) {
      const topToast = this.commentaryToasts[this.commentaryToasts.length - 1];
      ctx.save();
      ctx.fillStyle = "#000000";
      ctx.strokeStyle = "#FFCC00";
      ctx.lineWidth = 3;

      const rectW = Math.min(w * 0.82, 560);
      const rectH = 38;
      const rectX = (w - rectW) / 2;
      const rectY = h * 0.03;

      ctx.beginPath();
      ctx.roundRect(rectX, rectY, rectW, rectH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.font = "bold 12px 'Press Start 2P', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Black text stroke shadow for maximum pop
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 4;
      ctx.strokeText(topToast.text, w / 2, rectY + rectH / 2);

      ctx.fillStyle = "#FFCC00";
      ctx.fillText(topToast.text, w / 2, rectY + rectH / 2);
      ctx.restore();
    }

    if (this.isRerun) {
      ctx.save();
      ctx.fillStyle = "#dc2626";
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;

      const tagW = 160;
      const tagH = 24;
      const tagX = w - tagW - 12;
      const tagY = 12;

      ctx.fillRect(tagX, tagY, tagW, tagH);
      ctx.strokeRect(tagX, tagY, tagW, tagH);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 9px 'Press Start 2P', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`RERUN | SEED #${this.seed}`, tagX + tagW / 2, tagY + tagH / 2);
      ctx.restore();
    }
  }

  renderField(ctx, w, h) {
    const margin = w * 0.12;
    const trackW = w * 0.76;
    const topY = h * 0.22;
    const botY = h * 0.78;
    const fieldH = botY - topY;

    ctx.fillStyle = "#0c121e";
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 10; i++) {
      const x1 = margin + (i / 10) * trackW;
      const stripeW = trackW / 10;
      ctx.fillStyle = i % 2 === 0 ? "#1b472a" : "#245c37";
      ctx.fillRect(x1, topY, stripeW, fieldH);
    }

    // Left Endzone (Team A)
    ctx.fillStyle = this.jerseyColors.teamAJersey;
    ctx.fillRect(0, topY, margin, fieldH);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 11px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.save();
    ctx.translate(margin / 2, topY + fieldH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.strokeText(this.teamA.shortName.toUpperCase(), 0, 0);
    ctx.fillText(this.teamA.shortName.toUpperCase(), 0, 0);
    ctx.restore();

    // Right Endzone (Team B)
    ctx.fillStyle = this.jerseyColors.teamBJersey;
    ctx.fillRect(margin + trackW, topY, w - (margin + trackW), fieldH);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 11px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.save();
    ctx.translate(margin + trackW + (w - (margin + trackW)) / 2, topY + fieldH / 2);
    ctx.rotate(Math.PI / 2);
    ctx.strokeText(this.teamB.shortName.toUpperCase(), 0, 0);
    ctx.fillText(this.teamB.shortName.toUpperCase(), 0, 0);
    ctx.restore();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.strokeRect(margin, topY, trackW, fieldH);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(margin, topY + fieldH / 2);
    ctx.lineTo(margin + trackW, topY + fieldH / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const yardLabels = [0, 10, 20, 30, 40, 50, 40, 30, 20, 10, 0];
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 10px 'Press Start 2P', monospace";
    ctx.textAlign = "center";

    for (let i = 0; i <= 10; i++) {
      const x = margin + (i / 10) * trackW;
      ctx.strokeStyle = i === 5 ? "#FFCC00" : "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = i === 5 ? 3 : 2;

      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, botY);
      ctx.stroke();

      ctx.fillText(yardLabels[i], x, topY - 8);
      ctx.fillText(yardLabels[i], x, botY + 18);
    }
  }

  renderSprinter(ctx, x, y, team, jerseyColor, textColor, progress, lane) {
    ctx.save();

    const legPhase = Math.sin(progress * Math.PI * 35);
    const armPhase = Math.cos(progress * Math.PI * 35);

    ctx.save();
    ctx.fillStyle = jerseyColor;
    ctx.strokeStyle = team.secondaryColor;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(x - 14, y - 10);
    ctx.lineTo(x - 34, y - 16 + Math.sin(progress * 25) * 3);
    ctx.lineTo(x - 28, y - 2);
    ctx.lineTo(x - 14, y - 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 7px 'Press Start 2P', monospace";
    ctx.fillText(team.shortName.substring(0, 3).toUpperCase(), x - 28, y - 6);
    ctx.restore();

    ctx.fillStyle = "#A56B34";
    ctx.beginPath();
    ctx.arc(x - 14, y + 2 + Math.sin(progress * 20) * 3, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = team.secondaryColor;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(x - 2, y + 8);
    ctx.lineTo(x - 8 + legPhase * 8, y + 18);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + 4, y + 8);
    ctx.lineTo(x + 10 - legPhase * 8, y + 18);
    ctx.stroke();

    ctx.fillStyle = "#000000";
    ctx.fillRect(x - 12 + legPhase * 8, y + 16, 7, 3);
    ctx.fillRect(x + 6 - legPhase * 8, y + 16, 7, 3);

    ctx.fillStyle = jerseyColor;
    ctx.fillRect(x - 8, y - 8, 16, 16);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 8, y - 8, 16, 16);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 9px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.fillText(lane === 1 ? "1" : "2", x, y + 4);

    ctx.strokeStyle = "#A56B34";
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(x - 4, y - 2);
    ctx.lineTo(x - 10 - armPhase * 5, y + 4);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + 4, y - 2);
    ctx.lineTo(x + 10 + armPhase * 5, y + 4);
    ctx.stroke();

    ctx.fillStyle = "#A56B34";
    ctx.beginPath();
    ctx.arc(x + 2, y - 14, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(x + 8, y - 12, 5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(x + 12, y - 13, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = team.helmetColor || jerseyColor;
    ctx.beginPath();
    ctx.arc(x + 2, y - 15, 10, Math.PI * 0.9, Math.PI * 2.1);
    ctx.fill();
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.strokeStyle = "#C0C0C0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 6, y - 14);
    ctx.lineTo(x + 12, y - 12);
    ctx.lineTo(x + 6, y - 9);
    ctx.stroke();

    ctx.restore();
  }
}
