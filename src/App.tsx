import { Input } from "./components/Input";
import { Button } from "./components/Button";
import { useState } from "react";
import "./App.css";

function App() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  return (
    <div style={{ padding: 24, display: "grid", gap: 16, maxWidth: 420 }}>
      <Input
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        helperText={`Email state: ${email}`}
      />

      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
        error={pass.length > 0 && pass.length < 6 ? "Min 6 karaktera" : undefined}
        helperText="Probaj da uneseš 1-5 karaktera."
      />

      <div style={{ display: "flex", gap: 10 }}>
        <Button onClick={() => alert(`Email: ${email}`)}>Primary</Button>
        <Button
          variant="secondary"
          onClick={() => {
            setEmail("");
            setPass("");
          }}
        >
          Reset
        </Button>
        <Button variant="danger" onClick={() => alert("Danger klik")}>
          Danger
        </Button>
      </div>

      <Button onClick={() => alert("Ovo NE SME da se okine")}>
        Loading...
      </Button>
    </div>
  );
}

export default App;
