import React from "react";
import { Modal, Button } from "react-bootstrap";

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
      <Modal.Header closeButton>
        <Modal.Title>How To Measure</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {loading ? (
          <p>Loading measure guides...</p>
        ) : Array.isArray(measureGuides) && measureGuides.length > 0 ? (
          <div className="measure-guides-modal">
            {measureGuides.map((guide) => (
              <div
                key={guide.id}
                className="measure-guide-item-modal"
                style={{ marginBottom: "20px" }}
              >
                <h6>{titleFor(guide)}</h6>
                {guide?.full_image_url ? (
                  <img
                    src={`${baseUrl}${guide.full_image_url}`}
                    alt={`${titleFor(guide)} measure guide`}
                    style={{ maxWidth: "100%", height: "auto", marginBottom: "10px" }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <small className="text-muted">Image not available</small>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>
            For the most accurate fit, measure your body wearing only undergarments.
            Keep the measuring tape level and snug but not tight.
          </p>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
