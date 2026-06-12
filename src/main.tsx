import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

console.log(
  `%c
   __
 <(o )___    you found the console.
  ( ._> /    nothing down here but smoke.
   \`---'
             ...fine. one hint:
             the street remembers old cheat codes.
             up up down down. you know the rest.
`,
  "color:#ff7a18; font-family:monospace; font-size:12px;",
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
