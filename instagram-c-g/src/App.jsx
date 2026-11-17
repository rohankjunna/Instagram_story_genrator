import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import Header from "./Header";
import Footer from "./Footer";
import Sidebar from "./Sidebar";
import Caption from "./Caption";
import StickerEditor from "./StickerEditor";
import { useState } from "react";

function App() {
  const [selectedTab, setSelectedTab] = useState("Caption");

  return (
    <div className="app-container d-flex">
      <Sidebar selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
      <div className="content flex-grow-1">
        <Header />
        <div className="container mt-4">
          {selectedTab === "Caption" ? <Caption /> : <StickerEditor />}
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default App;
