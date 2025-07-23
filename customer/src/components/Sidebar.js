import "../styles/Sidebar.css";

export default function Sidebar({ category, isOpen, onMouseEnter, onMouseLeave }) {
  return (
    <aside
      className={`sidebar ${isOpen ? "open" : ""}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={(e) => e.stopPropagation()}
    >
      <header className="sidebar-header d-flex justify-content-between align-items-center">
        <h2 className="sidebar-title">{category} Collection</h2>
      </header>

      <nav className="sidebar-nav">
        <a href={`/${category}/tops`} className="nav-link"> {category} Tops</a>
        <a href={`/${category}/bottoms`} className="nav-link"> {category} Bottoms</a>
        <a href={`/${category}/shoes`} className="nav-link"> {category} Shoes</a>
        <a href={`/${category}/accessories`} className="nav-link"> {category} Accessories</a>
      </nav>
    </aside>
  );
}
