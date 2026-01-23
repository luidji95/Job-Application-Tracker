import "./css/newApplicationModal.css";

export const NewApplicationModal = () => {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title">
            <h2>New application</h2>
            <p>Add details for a new job you applied for.</p>
          </div>

          <button className="modal-close" type="button" aria-label="Close">
            ✕
          </button>
        </div>

        <form className="modal-form">
          <div className="form-grid">
            <div className="field">
              <label>Company</label>
              <input type="text" placeholder="e.g. Microsoft" />
            </div>

            <div className="field">
              <label>Position</label>
              <input type="text" placeholder="e.g. Frontend Developer" />
            </div>

            <div className="field">
              <label>Location</label>
              <input type="text" placeholder="e.g. Belgrade / Remote" />
            </div>

            <div className="field">
              <label>Salary</label>
              <input type="text" placeholder="e.g. 2000€ / 60k" />
            </div>

            <div className="field field-full">
              <label>Tags</label>
              <input type="text" placeholder="e.g. remote, react, referral" />
              <div className="tags-preview">
                <span className="tag-chip">remote</span>
                <span className="tag-chip">react</span>
                <span className="tag-chip">referral</span>
              </div>
            </div>

            <div className="field field-full">
              <label>Notes</label>
              <textarea
                rows={4}
                placeholder="Links, recruiter name, next steps, etc."
              />
            </div>
          </div>

          <div className="modal-actions">
            <button className="btn btn-ghost" type="button">
              Cancel
            </button>
            <button className="btn btn-primary" type="submit">
              Add application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
