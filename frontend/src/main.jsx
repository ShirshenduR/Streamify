import App from "@/App";
import ProtectedLayout from "@/components/ProtectedLayout";
import HomePage from "@/pages/Home";
import LibraryPage from "@/pages/Library";
import LoginPage from "@/pages/Login";
import ProfilePage from "@/pages/Profile";
import SearchPage from "@/pages/Search";
import Providers from "@/Providers";
import "@/styles/index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Providers>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route element={<ProtectedLayout />}>
            <Route element={<App />}>
              <Route path="home" element={<HomePage />} />
              <Route path="library" element={<LibraryPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="search" element={<SearchPage />} />
            </Route>
          </Route>
        </Routes>
      </Providers>
    </BrowserRouter>
  </StrictMode>
);
