import { useState } from "react";
import "./FileForm.css";
import axios from "axios";

function FileForm() {
  const [file, setFile] = useState(null);
  const [transcriptionText, setTranscription] = useState("");

  const handleFileInputChange = (event) => {
    console.log(event.target.files);
    setFile(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("audio_file", file);

    try {
      const response = await axios.post(
        "http://localhost:8000/audio",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const { transcription } = response.data;
      console.log(transcription);
      setTranscription(transcription);
      console.log(response.data);
    } catch (error) {
      console.error("upload file audio error", error);
    }
  };

  return (
    <div className="STT">
      <h1>Speech To Text</h1>

      <form>
        <div>
          <input
            className="form"
            type="file"
            onChange={handleFileInputChange}
            accept="audio/*"
          />
        </div>
        <button type="submit" onClick={handleSubmit}>
          Upload and Transcribe
        </button>
      </form>
      {transcriptionText && (
        <div>
          <h2>Transcription</h2>
          <p>{transcriptionText}</p>
        </div>
      )}
    </div>
  );
}

export default FileForm;
