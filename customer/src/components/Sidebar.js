import { Link } from "react-router-dom";
import { useRef, useEffect } from "react";

import "../styles/Sidebar.css";
import DataFile from "../assets/DataFile";

export default function Sidebar({
  category,
  isOpen,
  onClose,
  onMouseEnter,
  onMouseLeave,
  categories = [],
  onCategoryClick,
}) {
  const sidebarRef = useRef(null);
  const currentCategory = category?.toLowerCase();

  const filteredTypes = DataFile.productTypeDetails.filter((item) =>
    item.category.includes(currentCategory)
  );

   useEffect(() => {
    if (!isOpen || !window.matchMedia("(max-width: 768px)").matches) return;

    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        onClose(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Desktop view 
  if (category && !window.matchMedia("(max-width: 768px)").matches) {
    const currentCategory = category.toLowerCase();
    const filteredTypes = DataFile.productTypeDetails.filter((item) =>
      item.category.includes(currentCategory)
    );
    const uniqueNames = Array.from(
      new Set(filteredTypes.map((item) => item.name))
    );

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
              <Link key={idx} className="nav-link">
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

  // Mobile view: show selected category options + other categories
  if (isOpen) {
    return (
      <aside
        ref={sidebarRef}
        className="sidebar open"
        onClick={(e) => e.stopPropagation()}
      >
        {/* If category is selected*/}
        {category && (
          <>
            <h5 className="mb-3 px-3">{category} Collection</h5>
            {filteredTypes.length > 0 ? (
                 Array.from(new Set(filteredTypes.map((item) => item.name))).map((name, idx) => (
                <div key={idx} className="sidebar-category-item px-3">
                  {name}
                </div>
              ))
            ) : (
              <span className="text-muted px-3">No items found</span>
            )}
          </>
        )}

        {/* show other categories */}
        <div className="sidebar-other-categories mt-4">
          <h6 className="mb-2 px-3">
            {category ? "Browse Other Categories" : "Browse Categories"}
          </h6>
          {categories.map((cat) => (
            <div
              key={cat.catId}
              className={`sidebar-category-item px-3 py-2 ${
                cat.name.toLowerCase() === currentCategory ? "text-primary" : ""
              }`}
              onClick={() => onCategoryClick(cat.name)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === "Enter") onCategoryClick(cat.name);
              }}
            >
              {cat.name}
            </div>
          ))}
        </div>
      </aside>
    );
  }

  return null;
}
