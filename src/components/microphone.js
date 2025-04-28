import { TreeBase } from "./treebase";
import { html } from "uhtml";
import Globals from "app/globals";
import * as Props from "./props";

class Microphone extends TreeBase {
  stateName = new Props.String("$Microphone");
  serverURL = new Props.String("", { label: "Server URL" });
  /** @type {MediaRecorder} */
  mediaRecorder;
  /** @type {WebSocket} */
  socket;

  get recording() {
    return this.mediaRecorder && this.mediaRecorder.state === "recording";
  }

  template() {
    const { state } = Globals;
    if (state.hasBeenUpdated(this.stateName.value)) {
      const desiredState = state.get(this.stateName.value, "");
      if (desiredState == "record" && !this.recording) {
        this.startRecording();
      } else if (!desiredState && this.recording) {
        this.stopRecording();
      }
    }
    return html`<div />`;
  }

  async startRecording() {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        this.mediaRecorder = new MediaRecorder(stream, {
          mimeType: "audio/webm",
        });
        this.socket = new WebSocket(this.serverURL.value);
        this.socket.onerror = (error) =>
          console.error("websocket error", error);
        this.mediaRecorder.ondataavailable = (event) => {
          this.socket.send(event.data);
        };
        this.socket.onopen = () => {
          console.log("websocket connected");
          this.mediaRecorder.start(500); // 500ms per chunk
        };
        this.socket.onclose = () => {
          console.log("websocket closed");
          this.mediaRecorder.stop();
        };
      })
      .catch((error) => {
        console.error("Error accessing microphone", error);
      });
  }

  async stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
      this.mediaRecorder.stop();
      this.socket.close();
    }
  }
}
TreeBase.register(Microphone, "Microphone");
