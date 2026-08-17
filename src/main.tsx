import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CareerApp } from "./App";
import { LandingPage } from "./pages/LandingPage";
import { EventJoinPage } from "./pages/event/EventJoinPage";
import { HostPage } from "./pages/event/HostPage";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/play" element={<CareerApp />} />
        <Route path="/event" element={<EventJoinPage />} />
        <Route path="/host" element={<HostPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
