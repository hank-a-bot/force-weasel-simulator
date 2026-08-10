// 60 FPS HTML5 Canvas Race Engine for Force Weasel Simulator
import { soundEngine } from "./audioSynth";

export class RaceEngine {
  constructor(canvas, teamA, teamB, teamAProb, seed) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.teamA = teamA;
    this.teamB = teamB;
    this.teamAProb = teamAProb; // e.g. 50, 70, etc.
    this.seed = seed;

    this.isRunning = false;
    this.isFinished = false;
    this.startTime = null;
    this.duration = 12.5; // seconds for theatrical race

    // Determine winner based on seed and probability
    const rng = this.seededRandom(seed);
    this.teamAWins = rng < teamAProb / 100;
    this.winner = this.teamAWins ? teamA : teamB;

    // Generate dramatic trajectory splines
    this.trajectories = this.generateTrajectories(rng);

    // Particles for motion trails and victory confetti
    this.particles = [];
    this.commentaryToasts = [];
    this.lastCommentaryYard = -1;

    // Track frame stats
    this.progress = 0; // 0 to 1
    this.yardA = 0;
    this.yardB = 0;
    this.currentLeader = null;
    this.animFrameId = null;

    this.onProgressUpdate = null;
    this.onRaceComplete = null;
  }

  // Simple PRNG from seed
  seededRandom(seed) {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  // Generate dramatic lead changes
  generateTrajectories(rng) {
    // Both start at 0, end at 100 yards.
    // We create keypoints at progress: 0, 0.2, 0.4, 0.65, 0.85, 1.0
    // Keypoints define lead switches before final winner pulls ahead.
    const teamAWins = this.teamAWins;

    // Stage 1 (20 yds): loser gets early jump or winner leads
    const earlyLeadA = rng > 0.5 ? 4 : -4;
    // Stage 2 (50 yds): switch lead for drama
    const midLeadA = earlyLeadA > 0 ? -5 : 5;
    // Stage 3 (75 yds): draft close
    const lateLeadA = teamAWins ? 2 : -2;
    // Stage 4 (100 yds): winner finishes 3-5 yards ahead!
    const finalLeadA = teamAWins ? 4 : -4;

    return {
      getPosA: (p) => {
        if (p <= 0) return 0;
        if (p >= 1) return 100 + (teamAWins ? 5 : 0);
        let base = p * 100;
        let delta = 0;
        if (p < 0.2) delta = (p / 0.2) * earlyLeadA;
        else if (p < 0.5) {
          let t = (p - 0.2) / 0.3;
          delta = earlyLeadA * (1 - t) + midLeadA * t;
        } else if (p < 0.8) {
          let t = (p - 0.5) / 0.3;
          delta = midLeadA * (1 - t) + lateLeadA * t;
        } else {
          let t = (p - 0.8) / 0.2;
          delta = lateLeadA * (1 - t) + finalLeadA * t;
        }
        return Math.max(0, Math.min(105, base + delta));
      },
      getPosB: (p) => {
        if (p <= 0) return 0;
        if (p >= 1) return 100 + (!teamAWins ? 5 : 0);
        let base = p * 100;
        let delta = 0;
        if (p < 0.2) delta = (p / 0.2) * -earlyLeadA;
        else if (p < 0.5) {
          let t = (p - 0.2) / 0.3;
          delta = -earlyLeadA * (1 - t) + -midLeadA * t;
        } else if (p < 0.8) {
          let t = (p - 0.5) / 0.3;
          delta = -midLeadA * (1 - t) + -lateLeadA * t;
        } else {
          let t = (p - 0.8) / 0.2;
          delta = -lateLeadA * (1 - t) + -finalLeadA * t;
        }
        return Math.max(0, Math.min(105, base + delta));
      }
    };
  }

  start() {
    this.isRunning = true;
    this.isFinished = false;
    this.startTime = performance.now();
    
    soundEngine.playStarterGun();
    soundEngine.playWhistle();

    this.addToast("STARTER GUN BLAST! THEY'RE OFF!", "#FFD700");

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

    // Trigger Lead Change Toasts & Audio Roars
    if (prevLeader && this.currentLeader && prevLeader.id !== this.currentLeader.id && p < 0.9) {
      soundEngine.playCrowdRoar(0.8);
      this.addToast(
        `LEAD CHANGE! ${this.currentLeader.shortName.toUpperCase()} TAKES THE LEAD!`,
        this.currentLeader.primaryColor
      );
    }

    // Milestone Commentary
    const leadYard = Math.max(this.yardA, this.yardB);
    if (leadYard >= 25 && this.lastCommentaryYard < 25) {
      this.lastCommentaryYard = 25;
      this.addToast("PAST THE 25! INTENSE SPEED!", "#FFFFFF");
    } else if (leadYard >= 50 && this.lastCommentaryYard < 50) {
      this.lastCommentaryYard = 50;
      soundEngine.playCrowdRoar(0.6);
      this.addToast("AT MIDFIELD! 50 YARDS DOWN!", "#FFD700");
    } else if (leadYard >= 75 && this.lastCommentaryYard < 75) {
      this.lastCommentaryYard = 75;
      soundEngine.playCrowdRoar(0.9);
      this.addToast("RED ZONE! 25 YARDS TO THE FINISH!", "#FF4500");
    } else if (leadYard >= 90 && this.lastCommentaryYard < 90) {
      this.lastCommentaryYard = 90;
      this.addToast("FINAL SPRINT! PHOTO FINISH!", "#00FFCC");
    }

    // Footstep audio pulses
    if (Math.floor(p * 50) % 4 === 0) {
      soundEngine.playStep();
    }

    // Generate trail particles
    if (Math.random() < 0.6) {
      this.addTrailParticle(this.yardA, 1);
      this.addTrailParticle(this.yardB, 2);
    }

    // Update toasts
    this.commentaryToasts.forEach((t) => (t.life -= 0.016));
    this.commentaryToasts = this.commentaryToasts.filter((t) => t.life > 0);

    // Update particles
    this.particles.forEach((pt) => {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.alpha -= 0.02;
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
    soundEngine.playCrowdRoar(1.0);

    this.addToast(
      `TOUCHDOWN! ${this.winner.name.toUpperCase()} WINS THE 100-YARD DASH!`,
      this.winner.primaryColor
    );

    // Spawn victory fireworks particles
    for (let i = 0; i < 80; i++) {
      this.particles.push({
        x: this.canvas.width * 0.85,
        y: this.canvas.height * 0.5 + (Math.random() - 0.5) * 150,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        color: i % 2 === 0 ? this.winner.primaryColor : this.winner.secondaryColor,
        size: Math.random() * 8 + 4,
        alpha: 1.0
      });
    }

    this.render();

    if (this.onRaceComplete) {
      this.onRaceComplete(this.winner);
    }
  }

  addToast(text, color = "#FFFFFF") {
    this.commentaryToasts.push({
      text,
      color,
      life: 2.5 // seconds
    });
  }

  addTrailParticle(yard, lane) {
    const fieldX = this.yardToCanvasX(yard);
    const laneY = lane === 1 ? this.canvas.height * 0.38 : this.canvas.height * 0.62;

    this.particles.push({
      x: fieldX - 15,
      y: laneY + (Math.random() - 0.5) * 10,
      vx: -(Math.random() * 2 + 1),
      vy: (Math.random() - 0.5) * 1,
      color: lane === 1 ? this.teamA.primaryColor : this.teamB.primaryColor,
      size: Math.random() * 5 + 2,
      alpha: 0.8
    });
  }

  yardToCanvasX(yard) {
    // 0 yds at 12% width, 100 yds at 88% width
    const margin = this.canvas.width * 0.12;
    const trackWidth = this.canvas.width * 0.76;
    return margin + (yard / 100) * trackWidth;
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Render Football Field Background
    this.renderField(ctx, w, h);

    // 2. Render Motion Particles
    this.particles.forEach((pt) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.alpha);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 3. Render Weasel Sprinters
    this.renderWeaselRunner(
      ctx,
      this.yardToCanvasX(this.yardA),
      h * 0.38,
      this.teamA,
      this.progress,
      1
    );

    this.renderWeaselRunner(
      ctx,
      this.yardToCanvasX(this.yardB),
      h * 0.62,
      this.teamB,
      this.progress,
      2
    );

    // 4. Finish Line Tape
    const finishX = this.yardToCanvasX(100);
    ctx.save();
    ctx.strokeStyle = this.isFinished ? "#FFD700" : "#FFFFFF";
    ctx.lineWidth = 6;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(finishX, h * 0.25);
    ctx.lineTo(finishX, h * 0.75);
    ctx.stroke();
    ctx.restore();

    // 5. Commentary Toasts Banners
    if (this.commentaryToasts.length > 0) {
      const topToast = this.commentaryToasts[this.commentaryToasts.length - 1];
      ctx.save();
      ctx.fillStyle = "rgba(10, 15, 26, 0.85)";
      ctx.strokeStyle = topToast.color;
      ctx.lineWidth = 2;

      const rectW = Math.min(w * 0.7, 500);
      const rectH = 44;
      const rectX = (w - rectW) / 2;
      const rectY = h * 0.08;

      ctx.beginPath();
      ctx.roundRect(rectX, rectY, rectW, rectH, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = topToast.color;
      ctx.font = "bold 18px 'Outfit', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(topToast.text, w / 2, rectY + rectH / 2);
      ctx.restore();
    }
  }

  renderField(ctx, w, h) {
    // Dark grass stadium background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, "#0a1910");
    bgGrad.addColorStop(0.5, "#122e1e");
    bgGrad.addColorStop(1, "#0a1910");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    const margin = w * 0.12;
    const trackW = w * 0.76;
    const topY = h * 0.22;
    const botY = h * 0.78;
    const fieldH = botY - topY;

    // Field Turf Stripes (alternating grass shades every 10 yards)
    for (let i = 0; i < 10; i++) {
      const x1 = margin + (i / 10) * trackW;
      const stripeW = trackW / 10;
      ctx.fillStyle = i % 2 === 0 ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(x1, topY, stripeW, fieldH);
    }

    // End Zones (Team colors)
    // Left Endzone (Team A)
    ctx.fillStyle = this.teamA.primaryColor;
    ctx.fillRect(0, topY, margin, fieldH);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 20px 'Outfit', sans-serif";
    ctx.textAlign = "center";
    ctx.save();
    ctx.translate(margin / 2, topY + fieldH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(this.teamA.shortName.toUpperCase(), 0, 0);
    ctx.restore();

    // Right Endzone (Team B)
    ctx.fillStyle = this.teamB.primaryColor;
    ctx.fillRect(margin + trackW, topY, w - (margin + trackW), fieldH);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 20px 'Outfit', sans-serif";
    ctx.textAlign = "center";
    ctx.save();
    ctx.translate(margin + trackW + (w - (margin + trackW)) / 2, topY + fieldH / 2);
    ctx.rotate(Math.PI / 2);
    ctx.fillText(this.teamB.shortName.toUpperCase(), 0, 0);
    ctx.restore();

    // Field Outer Border Lines
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 4;
    ctx.strokeRect(margin, topY, trackW, fieldH);

    // Midfield Dividing Track Line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(margin, topY + fieldH / 2);
    ctx.lineTo(margin + trackW, topY + fieldH / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Yard Lines & Yard Numbers (0, 10, 20, 30, 40, 50, 40, 30, 20, 10, 0)
    const yardLabels = [0, 10, 20, 30, 40, 50, 40, 30, 20, 10, 0];
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 14px 'Outfit', sans-serif";
    ctx.textAlign = "center";

    for (let i = 0; i <= 10; i++) {
      const x = margin + (i / 10) * trackW;
      ctx.strokeStyle = i === 5 ? "#FFD700" : "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = i === 5 ? 3 : 2;

      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, botY);
      ctx.stroke();

      // Numbers on top & bottom of field
      ctx.fillText(yardLabels[i], x, topY - 10);
      ctx.fillText(yardLabels[i], x, botY + 22);
    }
  }

  renderWeaselRunner(ctx, x, y, team, progress, lane) {
    ctx.save();

    // Leg & Arm Bobbing Cycle
    const runCycle = Math.sin(progress * Math.PI * 40);
    const armCycle = Math.cos(progress * Math.PI * 40);

    // 1. Team Flag Flapping Behind
    ctx.save();
    ctx.fillStyle = team.primaryColor;
    ctx.strokeStyle = team.secondaryColor;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(x - 24, y - 10);
    ctx.lineTo(x - 45, y - 18 + Math.sin(progress * 30) * 4);
    ctx.lineTo(x - 40, y - 2);
    ctx.lineTo(x - 24, y - 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = team.textColor;
    ctx.font = "bold 9px sans-serif";
    ctx.fillText(team.shortName.substring(0, 3).toUpperCase(), x - 38, y - 8);
    ctx.restore();

    // 2. Weasel Body / Tail
    ctx.fillStyle = "#A56B34"; // Weasel fur brown
    ctx.beginPath();
    // Swishing Tail
    ctx.arc(x - 18, y + 4 + Math.sin(progress * 25) * 5, 6, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.strokeStyle = team.secondaryColor;
    ctx.lineWidth = 4;
    // Left Leg
    ctx.beginPath();
    ctx.moveTo(x - 4, y + 10);
    ctx.lineTo(x - 10 + runCycle * 8, y + 22);
    ctx.stroke();
    // Right Leg
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 10);
    ctx.lineTo(x + 10 - runCycle * 8, y + 22);
    ctx.stroke();

    // Cleats
    ctx.fillStyle = "#000000";
    ctx.fillRect(x - 14 + runCycle * 8, y + 20, 8, 4);
    ctx.fillRect(x + 6 - runCycle * 8, y + 20, 8, 4);

    // Torso / Jersey in Team Primary Color
    ctx.fillStyle = team.primaryColor;
    ctx.beginPath();
    ctx.roundRect(x - 10, y - 10, 20, 22, 6);
    ctx.fill();
    ctx.strokeStyle = team.secondaryColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Player Jersey Number
    ctx.fillStyle = team.textColor;
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(lane === 1 ? "1" : "2", x, y + 5);

    // Arms
    ctx.strokeStyle = "#A56B34";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 4);
    ctx.lineTo(x - 14 - armCycle * 6, y + 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 6, y - 4);
    ctx.lineTo(x + 14 + armCycle * 6, y + 4);
    ctx.stroke();

    // Weasel Head & Snout
    ctx.fillStyle = "#A56B34";
    ctx.beginPath();
    ctx.arc(x + 2, y - 16, 10, 0, Math.PI * 2);
    ctx.fill();

    // Snout
    ctx.beginPath();
    ctx.ellipse(x + 10, y - 14, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Nose tip
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(x + 15, y - 15, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Eyes with excitement
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(x + 5, y - 18, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(x + 6, y - 18, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Football Helmet in Team Helmet Color!
    ctx.fillStyle = team.helmetColor || team.primaryColor;
    ctx.beginPath();
    ctx.arc(x + 2, y - 18, 12, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = team.secondaryColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Helmet Face Mask
    ctx.strokeStyle = "#C0C0C0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 8, y - 16);
    ctx.lineTo(x + 15, y - 14);
    ctx.lineTo(x + 8, y - 10);
    ctx.stroke();

    ctx.restore();
  }
}
