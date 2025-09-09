import React from "react";
import { Modal } from "react-bootstrap";

import '../styles/MeasureGuideModal.css';

export default function MeasureGuideModal({
  show,
  onHide,
  measureGuides = [],
  loading = false,
  baseUrl = "",
}) {
  const titleFor = (guide) => {
    if (guide?.category_name) return guide.category_name;
    if (guide?.main_category_name || guide?.sub_category_name) {
      return `${guide?.main_category_name || ""}${
        guide?.main_category_name && guide?.sub_category_name ? " - " : ""
      }${guide?.sub_category_name || ""}`;
    }
    return "How To Measure";
    };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered className="measure-modal">
      <Modal.Header className="mg-header" closeButton>
        <Modal.Title>How To Measure</Modal.Title>
      </Modal.Header>

      <Modal.Body className="mg-body">
        {loading ? (
          <p>Loading measure guides...</p>
        ) : Array.isArray(measureGuides) && measureGuides.length > 0 ? (
          <div className="measure-guides-modal">
            {measureGuides.map((guide) => (
              <div>
                {guide?.full_image_url ? (
                  <>
                    <img
                      src={`${baseUrl}${guide.full_image_url}`}
                      alt={`${titleFor(guide)} measure guide`}
                      style={{ maxWidth: "100%", height: "auto", marginBottom: "10px" }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </>
                ) : (
                  <small className="text-muted">Image not available</small>
                )}
              </div>
            ))}
          </div>
        ) : (
         <small className="text-muted">Image not available</small>
        )}
      </Modal.Body>
      <Modal.Footer className="mg-footer">
        <ul className="advice">
          <li>For the most accurate fit, measure your body wearing only undergarments. </li>
          <li>Keep the measuring tape level and snug but not tight.</li>
        </ul>
      </Modal.Footer>
    </Modal>
  );
}
