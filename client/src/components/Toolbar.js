// Toolbar.js - Component for selecting drawing color and stroke width
import React from 'react';
import './Toolbar.css';

function Toolbar({ selectedColor, setSelectedColor, strokeWidth, setStrokeWidth, isEraser, setIsEraser }) {
  // I picked a compact palette that's readable on dark backgrounds
  // Predefined color palette
  const colors = [
    '#000000',
    '#FF0000',
    '#00FF00',
    '#0000FF',
    '#FFFF00',
    '#FF00FF',
    '#00FFFF', 
    '#FFA500',
    '#800080',
    '#FFC0CB',
    '#A52A2A',
    '#808080'
  ];

  const strokeWidths = [2, 5, 10, 15, 20];

  const handleColorChange = (color) =>{
    setSelectedColor(color);
  };


  const handleStrokeWidthChange = (width) =>{
    setStrokeWidth(width);
  };

  return (
    <div className="toolbar">
      <h3 className="toolbar-title">Drawing Tools</h3>

      <div className="toolbar-section">
        <label className="toolbar-label">Color</label>
        
        {/* Color palette*/}
        <div className="color-palette">
          {colors.map(color => (
            <button
              key={color}
              className={`color-btn ${selectedColor === color && !isEraser ? 'selected' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => {
                handleColorChange(color);
                setIsEraser(false);
              }}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>

        {/*Custom color picker*/}
        <div className="custom-color">
          <label className="toolbar-label-small">Custom:</label>
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => {
              handleColorChange(e.target.value);
              setIsEraser(false);
            }}
            className="color-picker"
          />
        </div>

        <div className="current-color-preview">
          <span className="toolbar-label-small">Current:</span>
          <div 
            className="color-preview"
            style={{ backgroundColor: isEraser ? '#0a0e27' : selectedColor }}
          />
        </div>
      </div>

      {/* Eraser Tool*/}
      <div className="toolbar-section">
        <label className="toolbar-label">Tool</label>
        <button
          className={`eraser-btn ${isEraser ? 'selected' : ''}`}
          onClick={() => setIsEraser(!isEraser)}
          title="Toggle eraser mode"
        >
          🧹 Eraser
        </button>
      </div>

      {/* Stroke Width Selection Section */}
      <div className="toolbar-section">
        <label className="toolbar-label">Brush Size</label>
        
        <div className="stroke-widths">
          {strokeWidths.map(width => (
            <button
              key={width}
              className={`stroke-btn ${strokeWidth === width ? 'selected' : ''}`}
              onClick={() => handleStrokeWidthChange(width)}
            >
              <div 
                className="stroke-preview"
                style={{
                  width: `${width}px`,
                  height: `${width}px`,
                  backgroundColor: selectedColor
                }}
              />
              <span className="stroke-label">{width}px</span>
            </button>
          ))}
        </div>

        {/*Custom stroke width slider*/}
        <div className="custom-stroke">
          <label className="toolbar-label-small">
            Custom: {strokeWidth}px
          </label>
          <input
            type="range"
            min="1"
            max="50"
            value={strokeWidth}
            onChange={(e) => handleStrokeWidthChange(parseInt(e.target.value))}
            className="stroke-slider"
          />
        </div>
      </div>

      <div className="toolbar-section">
        <label className="toolbar-label">Preview</label>
        <div className="stroke-preview-canvas">
          <svg width="100%" height="60">
            <line
              x1="10"
              y1="30"
              x2="190"
              y2="30"
              stroke={selectedColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default Toolbar;