import { useState, useEffect } from "react";
import MicRecorder from "mic-recorder-to-mp3";
import axios from "axios";
import "./ChatBot.css";

const Mp3Recorder = new MicRecorder({ bitrate: 128 });

function ChatBot() {
  const [input, setInput] = useState("");
  const [transcriptionText, setTranscriptionText] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [blobURL, setBlobURL] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => setIsBlocked(false))
      .catch(() => setIsBlocked(true));
  }, []);

  const startRecording = () => {
    if (isBlocked) {
      console.log("Permission Denied");
    } else {
      Mp3Recorder.start()
        .then(() => setIsRecording(true))
        .catch((e) => console.log(e));
    }
  };

  const stopRecording = () => {
    Mp3Recorder.stop()
      .getMp3()
      .then(([buffer, blob]) => {
        const blobURL = URL.createObjectURL(blob);
        setBlobURL(blobURL);
        setIsRecording(false);
      })
      .catch((e) => console.log(e));
  };

  const handleSubmit = async () => {
    if (blobURL) {
      setIsTranscribing(true);
      const formData = new FormData();
      const audioBlob = await fetch(blobURL).then((res) => res.blob());
      formData.append("audio_file", audioBlob, "audio.mp3");

      try {
        const response = await axios.post(
          "http://localhost:8000/audio", // Ganti dengan URL endpoint yang sesuai
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        const { transcription } = response.data;
        console.log(transcription);
        setTranscriptionText(transcription);
        console.log("Transcription successful");
      } catch (error) {
        console.error("Upload and transcribe error", error);
      } finally {
        setIsTranscribing(false);
      }
    }
  };

  return (
    <div className="chatBot">
      <div className="container-text">
        <div className="user">
          <div className="bubble-user">helloworld</div>
        </div>
        <div className="bot">
          <div className="bubble-bot">ini contoh bubble bot</div>
        </div>
      </div>
      <form>
        <div className="form-chat-container">
          <input
            type="text"
            className="form-chat"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a Message"
          />
          <button type="submit" className="button-send">
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatBot;
