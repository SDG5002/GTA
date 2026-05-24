import { useState, useEffect } from "react";
import axiosInstance from "../../../../api/axiosInstance";
import { toast } from "react-hot-toast";
import { AiOutlineClose } from "react-icons/ai";

const IpRestrictionModal = ({ exam, onClose, onSave }) => {
  const [enabled, setEnabled] = useState(exam.ipRestriction || false);
  const [ipMode, setIpMode] = useState("manual"); // default to manual
  const [ipAddress, setIpAddress] = useState(exam.allowedIp || "");
  const [loadingIp, setLoadingIp] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync modal state when exam changes (modal is shared across exams)
  // No network calls here — fetch only happens on explicit user action
  useEffect(() => {
    if (exam.allowedIp) {
      setIpAddress(exam.allowedIp);
      setIpMode("manual");
    } else {
      setIpAddress("");
      setIpMode("auto");
    }
    setEnabled(exam.ipRestriction || false);
  }, [exam]);

  const fetchMyIp = async () => {
    setLoadingIp(true);
    try {
      const res = await axiosInstance.get("/professor/myIp", { withCredentials: true });
      if (res.data && res.data.ip) {
        setIpAddress(res.data.ip);
        toast.success(`Detected IP: ${res.data.ip}`);
      } else {
        toast.error("Failed to detect IP address");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching IP address");
    } finally {
      setLoadingIp(false);
    }
  };

  const handleModeChange = (mode) => {
    setIpMode(mode);
    if (mode === "auto") {
      fetchMyIp();
    }
  };

  const handleSave = async () => {
    if (enabled && !ipAddress.trim()) {
      toast.error("Please enter or detect a valid IP address");
      return;
    }

    setSaving(true);
    try {
      const res = await axiosInstance.put(
        `/professor/setIpRestriction/${exam.id}`,
        {
          ipRestriction: enabled,
          allowedIp: enabled ? ipAddress.trim() : "",
        },
        { withCredentials: true }
      );
      toast.success(res.data.message || "IP restriction updated successfully");
      onSave(exam.id, enabled, enabled ? ipAddress.trim() : "");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to update IP restriction");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ip-modal-overlay">
      <div className="ip-modal-content">
        <div className="ip-modal-header">
          <h3>🔒 IP Restriction Settings</h3>
          <button className="ip-modal-close-btn" onClick={onClose}>
            <AiOutlineClose />
          </button>
        </div>

        <div className="ip-modal-body">
          <div className="ip-exam-info-card">
            <span className="ip-exam-info-label">Active Exam</span>
            <h4 className="ip-exam-info-title">{exam.title}</h4>
          </div>

          <div className="ip-toggle-container">
            <label className="ip-switch-label">
              <span className="ip-label-text">Enable IP Restriction</span>
              <div className="ip-switch-wrapper">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                />
                <span className="ip-slider"></span>
              </div>
            </label>
            <p className="ip-help-text">
              When enabled, students can only join and take this exam if they are connected to the specified IP network.
            </p>
          </div>

          {enabled && (
            <div className="ip-config-section">
              <label className="ip-config-label">Method to Set IP:</label>
              <div className="ip-radio-group">
                <label className="ip-radio-label">
                  <input
                    type="radio"
                    name="ipMode"
                    value="auto"
                    checked={ipMode === "auto"}
                    onChange={() => handleModeChange("auto")}
                  />
                  <span>Detect Wi-Fi IP (Auto)</span>
                </label>
                <label className="ip-radio-label">
                  <input
                    type="radio"
                    name="ipMode"
                    value="manual"
                    checked={ipMode === "manual"}
                    onChange={() => handleModeChange("manual")}
                  />
                  <span>Type IP Manually</span>
                </label>
              </div>

              <div className="ip-input-wrapper">
                <label htmlFor="ipAddress" className="ip-input-label">
                  Allowed IP Address
                </label>
                <div className="ip-input-row">
                  <input
                    id="ipAddress"
                    type="text"
                    placeholder="e.g. 203.0.113.195"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    disabled={ipMode === "auto" || loadingIp}
                    className="ip-text-input"
                  />
                  {ipMode === "auto" && (
                    <button
                      type="button"
                      className="ip-refresh-btn"
                      onClick={fetchMyIp}
                      disabled={loadingIp}
                    >
                      {loadingIp ? "Detecting..." : "Re-detect"}
                    </button>
                  )}
                </div>
                {loadingIp && <div className="ip-spinner-text">Fetching your public IP...</div>}
                <div className="ip-warning-box">
                  <span className="ip-warning-icon">⚠️</span>
                  <p className="ip-warning-text">
                    If setting manually, make sure to enter the <strong>public IP</strong> of the common Wi-Fi network that students will connect to.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="ip-modal-footer">
          <button className="ip-btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="ip-btn-primary" onClick={handleSave} disabled={saving || loadingIp}>
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IpRestrictionModal;
