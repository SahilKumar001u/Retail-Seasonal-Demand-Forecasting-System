import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload as UploadIcon, FileSpreadsheet, CheckCircle, AlertCircle, X, Trash2 } from 'lucide-react';
import './Upload.css';
const API_BASE = process.env.REACT_APP_API_URL;

const Upload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [datasetExists, setDatasetExists] = useState(false);
  const [datasetPreview, setDatasetPreview] = useState(null);
  const [deleting, setDeleting] = useState(false);



  useEffect(() => {
    checkDatasetStatus();
  }, []);

  const fetchDatasetPreview = async () => {
    try {
      const response = await axios.get(`${API_BASE}/dataset-preview`);
      if (response.data.success) {
        setDatasetPreview(response.data);
      } else {
        setDatasetPreview(null);
      }
    } catch (error) {
      setDatasetPreview(null);
    }
  };

  const checkDatasetStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE}/dataset-status`);
      setDatasetExists(response.data.exists);
      if (response.data.exists) {
        fetchDatasetPreview();
      } else {
        setDatasetPreview(null);
      }
    } catch (error) {
      setDatasetExists(false);
      setDatasetPreview(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (uploadedFile) => {
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];

    if (!validTypes.includes(uploadedFile.type)) {
      setUploadStatus({ type: 'error', message: 'Please upload a valid Excel file (.xlsx or .xls)' });
      return;
    }

    setFile(uploadedFile);
    setUploadStatus(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadStatus({ type: 'info', message: '⏳ Uploading and processing data...' });
    const formData = new FormData();
    formData.append('file', file);

    try {
      // This call BLOCKS until parquet + dashboard stats are ready (~3-7s).
      // No polling needed — dashboard is ready the moment this resolves.
      await axios.post(`${API_BASE}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000, // 5 min safety ceiling for very large files
      });

      setUploadStatus({ type: 'success', message: '✅ Dataset ready! Dashboard updated.' });
      setDatasetExists(true);
      fetchDatasetPreview();

      // Tell Overview + Forecast pages to refresh — data is already there
      window.dispatchEvent(new Event('datasetUploaded'));

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({ type: 'error', message: 'Upload failed. Please try again.' });
    } finally {
      setUploading(false);
    }
  };


  const handleDeleteDataset = async () => {
    if (!window.confirm('Are you sure you want to delete the uploaded dataset? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await axios.delete(`${API_BASE}/dataset`);
      if (response.data.success) {
        setUploadStatus({
          type: 'success',
          message: 'Dataset deleted successfully!'
        });
        setDatasetExists(false);
        setDatasetPreview(null);
        setFile(null);

        // Trigger dashboard refresh
        window.dispatchEvent(new Event('datasetDeleted'));
      } else {
        setUploadStatus({
          type: 'error',
          message: response.data.message || 'Failed to delete dataset'
        });
      }
    } catch (error) {
      console.error('Error deleting dataset:', error);
      setUploadStatus({
        type: 'error',
        message: 'Error deleting dataset. Please try again.'
      });
    } finally {
      setDeleting(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setUploadStatus(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="upload-page">
      <div className="page-header">
        <h1>Upload Dataset</h1>
        <p>Upload your retail sales data in Excel format</p>
      </div>

      <div className="upload-container">
        <div className="upload-card">
          <div className="upload-icon-wrapper">
            <UploadIcon size={48} className="upload-icon" />
          </div>

          <h2>Upload Your Dataset</h2>
          <p className="upload-description">
            Upload an Excel file (.xlsx or .xls) containing your retail sales data with columns:
            InvoiceDate, Description, Quantity, UnitPrice
          </p>

          {datasetExists && !file && (
            <div className="dataset-exists-banner">
              <div className="banner-content">
                <CheckCircle size={20} />
                <div>
                  <strong>Dataset Ready for Forecasting</strong>
                  <p>A dataset is currently loaded. Upload a new file to replace it or delete the existing one.</p>
                </div>
              </div>
              <button
                className="delete-dataset-btn"
                onClick={handleDeleteDataset}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <div className="spinner-small"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Dataset
                  </>
                )}
              </button>
            </div>
          )}

          <div
            className={`drop-zone ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {!file ? (
              <>
                <FileSpreadsheet size={64} className="drop-icon" />
                <p className="drop-text">Drag and drop your Excel file here</p>
                <p className="drop-subtext">or</p>
                <label className="browse-btn">
                  Browse Files
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileInput}
                    hidden
                  />
                </label>
                <p className="file-info">Supported formats: .xlsx, .xls (Max 50MB)</p>
              </>
            ) : (
              <div className="file-preview">
                <FileSpreadsheet size={48} className="file-icon" />
                <div className="file-details">
                  <p className="file-name">{file.name}</p>
                  <p className="file-size">{formatFileSize(file.size)}</p>
                </div>
                <button className="remove-btn" onClick={removeFile}>
                  <X size={20} />
                </button>
              </div>
            )}
          </div>

          {uploadStatus && (
            <div className={`upload-status ${uploadStatus.type}`}>
              {uploadStatus.type === 'success' ? (
                <CheckCircle size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
              <span>{uploadStatus.message}</span>
            </div>
          )}

          {file && (
            <button
              className="upload-submit-btn"
              onClick={handleUpload}
              disabled={uploading || uploadStatus?.type === 'success'}
            >
              {uploading ? (
                <>
                  <div className="spinner"></div>
                  Uploading...
                </>
              ) : uploadStatus?.type === 'success' ? (
                <>
                  <CheckCircle size={18} />
                  Uploaded Successfully
                </>
              ) : (
                <>
                  <UploadIcon size={18} />
                  Upload Dataset
                </>
              )}
            </button>
          )}
        </div>

        <div className="upload-info-card">
          <h3>📋 Dataset Requirements</h3>
          <ul className="requirements-list">
            <li>
              <CheckCircle size={16} className="check-icon" />
              <div>
                <strong>Required Columns:</strong>
                <p>InvoiceDate, Description, Quantity, UnitPrice</p>
              </div>
            </li>
            <li>
              <CheckCircle size={16} className="check-icon" />
              <div>
                <strong>Date Format:</strong>
                <p>Any standard date format (e.g., YYYY-MM-DD, DD/MM/YYYY)</p>
              </div>
            </li>
            <li>
              <CheckCircle size={16} className="check-icon" />
              <div>
                <strong>Minimum Data:</strong>
                <p>At least 50 rows per category for accurate forecasting</p>
              </div>
            </li>
            <li>
              <CheckCircle size={16} className="check-icon" />
              <div>
                <strong>File Size:</strong>
                <p>Maximum 50MB per file</p>
              </div>
            </li>
          </ul>

          {datasetExists && datasetPreview && (
            <div className="sample-data">
              <h4>Dataset Preview (First {datasetPreview.rows?.length || 0} rows):</h4>
              <div className="sample-table">
                <table>
                  <thead>
                    <tr>
                      {datasetPreview.columns.map(col => <th key={col}>{col}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {datasetPreview.rows.map((row, i) => (
                      <tr key={i}>
                        {datasetPreview.columns.map(col => <td key={col}>{row[col]}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Upload;
