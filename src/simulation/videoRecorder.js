// Canvas MediaRecorder for downloading race video
import { soundEngine } from "./audioSynth";

export class RaceVideoRecorder {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
  }

  startRecording() {
    this.recordedChunks = [];
    if (!this.canvas) return false;

    try {
      // 60 FPS video stream from Canvas
      const videoStream = this.canvas.captureStream(60);
      
      // Combine with audio stream from Sound Engine
      const audioTrack = soundEngine.getAudioStreamTrack();
      const tracks = [...videoStream.getVideoTracks()];
      if (audioTrack) {
        tracks.push(audioTrack);
      }

      const combinedStream = new MediaStream(tracks);

      // Determine mimeType supported by browser
      let options = { mimeType: "video/webm;codecs=vp9,opus" };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: "video/webm;codecs=vp8,opus" };
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: "video/webm" };
      }

      this.mediaRecorder = new MediaRecorder(combinedStream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100); // collect 100ms chunks
      this.isRecording = true;
      return true;
    } catch (e) {
      console.warn("Video Recording not supported or failed:", e);
      this.isRecording = false;
      return false;
    }
  }

  stopAndDownload(filename = "force-weasel-dash.webm") {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecording) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);

        // Download trigger
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 1000);

        this.isRecording = false;
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }
}
