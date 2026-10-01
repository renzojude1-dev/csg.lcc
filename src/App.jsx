import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";

import Home from "./pages/Home";
import Announcements from "./pages/Announcements";
import AnnouncementDetail from "./pages/AnnouncementDetail";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Officers from "./pages/Officers";
import Resources from "./pages/Resources";
import Help from "./pages/Help";
import Search from "./pages/Search";
import Feedback from "./pages/Feedback";

import AdminLogin from "./pages/AdminLogin";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/announcements/:id" element={<AnnouncementDetail />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/officers" element={<Officers />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/help" element={<Help />} />
          <Route path="/search" element={<Search />} />
          <Route path="/feedback" element={<Feedback />} />
        </Route>

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}