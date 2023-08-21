import MicRecorder from "mic-recorder-to-mp3";
import React, { useState, useEffect } from "react";
import { FaMicrophone, FaStopCircle } from "react-icons/fa";
import "./AudioRecorder.css";
import axios from "axios";

const Mp3Recorder = new MicRecorder({ bitrate: 128 });

function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [blobURL, setBlobURL] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);

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
    <div className="AudioRecorder">
      <h1>Speech to Text</h1>
      <div className="form">
        {isRecording ? (
          <button
            className="stopRecord"
            onClick={stopRecording}
            disabled={!isRecording}
          >
            <FaStopCircle />
          </button>
        ) : (
          <button
            className="startRecord"
            onClick={startRecording}
            disabled={isRecording || isTranscribing}
          >
            <FaMicrophone />
          </button>
        )}
      </div>
      <audio src={blobURL} controls="controls" />
      <button className="submit" onClick={handleSubmit}>
        Upload and Transcribe
      </button>
      {transcriptionText && (
        <div>
          <h2>Transcription</h2>
          <p>{transcriptionText}</p>
        </div>
      )}
    </div>
  );
}

export default AudioRecorder;
