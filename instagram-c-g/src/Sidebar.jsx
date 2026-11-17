const Sidebar = ({ selectedTab, setSelectedTab }) => {
  return (
    <aside className="app-sidebar d-flex flex-column flex-shrink-0 p-3 text-bg-dark">
      <a className="sidebar-brand mb-3 text-white text-decoration-none" href="/">
        Image Studio
      </a>
      <nav className="nav nav-pills flex-column gap-2" aria-label="Main navigation">
        <button
          type="button"
          className={`nav-link text-start ${selectedTab === "Caption" ? "active" : "text-white"}`}
          onClick={() => setSelectedTab("Caption")}
        >
          Create caption
        </button>
        <button
          type="button"
          className={`nav-link text-start ${selectedTab === "Sticker" ? "active" : "text-white"}`}
          onClick={() => setSelectedTab("Sticker")}
        >
          Make a sticker
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;