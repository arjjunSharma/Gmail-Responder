import {
  CircularProgress,
  Container,
  TextField,
  Typography,
  Button,
} from "@mui/material";
import { Box } from "@mui/system";
import { useState } from "react";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";

import Select from "@mui/material/Select";

import "./App.css";
import axios from "axios";

function App() {
  const [emailContent, setEmailContent] = useState("");
  const [tone, setTone] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedReply, setGeneratedReply] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:8080/api/email/generate",
        {
          emailContent,
          tone,
        }
      );
      setGeneratedReply(
        typeof response.data === "string"
          ? response.data
          : JSON.stringify(response.data)
      );
    } catch (error) {
      console.error("Error generating reply:", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Container maxWidth="md" sx={{ pt: 4, pb: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Email Reply Generator
      </Typography>
      <Box sx={{ mx: 3 }}>
        <TextField
          label="Original email content"
          multiline
          rows={6}
          variant="outlined"
          fullWidth
          value={emailContent || ""}
          onChange={(e) => setEmailContent(e.target.value)}
          sx={{ mb: 3 }}
        />
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Tone (Optional)</InputLabel>
          <Select
            value={tone || ""}
            label="Tone (Optional)"
            onChange={(e) => {
              setTone(e.target.value);
            }}
          >
            <MenuItem value="">None</MenuItem>
            <MenuItem value="Professional">"Professional"</MenuItem>
            <MenuItem value="Casual">"Casual"</MenuItem>
            <MenuItem value="Friendly">"Friendly"</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!emailContent || loading}
          sx={{ mb: 3 }}
        >
          {loading ? <CircularProgress size={24} /> : "Generate Reply"}
        </Button>
      </Box>

      <Box sx={{ mx: 3 }}>
        <TextField
          multiline
          rows={6}
          variant="outlined"
          fullWidth
          value={generatedReply || ""}
          inputProps={{ readOnly: true }}
          sx={{ mb: 2 }}
        />
        <Button
          variant="outlined"
          onClick={() => {
            navigator.clipboard.writeText(generatedReply);
          }}
          disabled={!generatedReply}
        >
          Copy to Clipboard
        </Button>
      </Box>
    </Container>
  );
}

export default App;
