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
    if (guide?.style_number) return guide.style_number;
    return "How To Measure";
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered className="measure-modal">
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
                {guide?.full_image_url || guide?.image_path ? (
                  <>
                    <img
                      src={`${baseUrl}/uploads/measure-guides/${guide.image_path}`}
                      alt={`${titleFor(guide)} measure guide`}
                      className="img-fluid"
                      onLoad={(e) => {
                        console.log('Image loaded successfully:', e.currentTarget.src);
                        console.log('Image dimensions:', e.currentTarget.naturalWidth, 'x', e.currentTarget.naturalHeight);
                      }}
                      onError={(e) => {
                        console.log('Image failed to load:', e.currentTarget.src);
                        console.log('Error event:', e);
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
