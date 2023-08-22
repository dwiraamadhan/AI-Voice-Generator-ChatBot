import { useState, useEffect } from "react";
import MicRecorder from "mic-recorder-to-mp3";
import axios from "axios";
import "./ChatBot.css";
import { FaMicrophone, FaStopCircle } from "react-icons/fa";

const Mp3Recorder = new MicRecorder({ bitrate: 128 });

function ChatBot() {
  const [input, setInput] = useState("");
  const [transcriptionText, setTranscriptionText] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [blobURL, setBlobURL] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState([]);

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

  const stopRecording = async () => {
    Mp3Recorder.stop()
      .getMp3()
      .then(async ([buffer, blob]) => {
        const blobURL = URL.createObjectURL(blob);
        setBlobURL(blobURL);
        setIsRecording(false);

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
          setMessages([
            ...messages,
            { type: "transcription", content: transcription },
          ]);
          console.log("Transcription successful");
        } catch (error) {
          console.error("Upload and transcribe error", error);
        } finally {
          setIsTranscribing(false);
        }
      })
      .catch((e) => console.log(e));
  };

  // const handleSubmit = async () => {
  //   if (blobURL) {
  //     setIsTranscribing(true);
  //     const formData = new FormData();
  //     const audioBlob = await fetch(blobURL).then((res) => res.blob());
  //     formData.append("audio_file", audioBlob, "audio.mp3");

  //     try {
  //       const response = await axios.post(
  //         "http://localhost:8000/audio", // Ganti dengan URL endpoint yang sesuai
  //         formData,
  //         {
  //           headers: {
  //             "Content-Type": "multipart/form-data",
  //           },
  //         }
  //       );

  //       const { transcription } = response.data;
  //       console.log(transcription);
  //       setTranscriptionText(transcription);
  //       console.log("Transcription successful");
  //     } catch (error) {
  //       console.error("Upload and transcribe error", error);
  //     } finally {
  //       setIsTranscribing(false);
  //     }
  //   }
  // };

  const handleSendMessage = () => {
    if (input.trim() !== "") {
      setMessages([...messages, { type: "text", content: input }]);
      setInput("");
    }
  };

  return (
    <div className="chatBot">
      <div className="container-text">
        {messages.map((message, index) => (
          <div className={`user ${message.type}`} key={index}>
            <div className="bubble-user">
              {message.content}
              {/* {transcriptionText && <p>{transcriptionText}</p>} */}
            </div>
          </div>
        ))}

        <div className="bot">
          <div className="bubble-bot">ini contoh bubble bot</div>
        </div>
      </div>
      <div>
        <div className="form-chat-container">
          <input
            type="text"
            className="form-chat"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a Message"
          />
          <button
            type="submit"
            className="button-send"
            onClick={handleSendMessage}
          >
            Send
          </button>
          <div className="recorder">
            {isRecording ? (
              <button
                className="stopRecord"
                onClick={() => {
                  stopRecording();
                  // handleSubmit();
                }}
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
        </div>
      </div>
    </div>
  );
}

export default ChatBot;
