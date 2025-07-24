import { Link } from "react-router-dom";
import "../styles/Sidebar.css";
import DataFile from "../assets/DataFile";

export default function Sidebar({ category, isOpen, onMouseEnter, onMouseLeave }) {
  // Make sure category is lowercase to match data
  const currentCategory = category?.toLowerCase();

  // Filter all items where currentCategory exists inside category array
  const filteredTypes = DataFile.productTypeDetails.filter((item) => {
    return item.category.includes(currentCategory);
  });

  // Get unique product type names for sidebar links
  const uniqueNames = Array.from(
    new Set(filteredTypes.map((item) => item.name))
  );

  console.log(category, uniqueNames);

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

      <nav className="sidebar-nav d-flex flex-column">
        {uniqueNames.length > 0 ? (
          uniqueNames.map((type, idx) => (
            <Link
              key={idx}
              // to={`/shop/:category/:productType`}
              className="nav-link"
            >
              {type}
            </Link>
          ))
        ) : (
          <span className="text-muted px-3">No items found</span>
        )}
      </nav>
    </aside>
  );
}

