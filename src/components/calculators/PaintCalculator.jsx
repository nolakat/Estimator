import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { calculatePaint, calculateWallArea } from '../../utils/calculators';
import { uuid, money } from '../../utils/estimator';

export function PaintCalculator({ sections, onAddItems }) {
  const [inputMode, setInputMode] = useState('sqft'); // 'sqft' or 'room'
  const [squareFootage, setSquareFootage] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('8');
  const [includeCeiling, setIncludeCeiling] = useState(false);
  const [coats, setCoats] = useState('2');
  const [coverage, setCoverage] = useState('350');
  const [wasteFactor, setWasteFactor] = useState('10');
  const [pricePerGallon, setPricePerGallon] = useState('35');
  const [targetSection, setTargetSection] = useState(sections[0]?.id || '');
  const [results, setResults] = useState(null);

  const calculate = () => {
    let sqft;
    if (inputMode === 'sqft') {
      sqft = parseFloat(squareFootage) || 0;
    } else {
      sqft = calculateWallArea({
        lengthFt: parseFloat(length) || 0,
        widthFt: parseFloat(width) || 0,
        heightFt: parseFloat(height) || 8,
        includeCeiling,
      });
    }
    if (sqft <= 0) return;

    const result = calculatePaint({
      squareFootage: sqft,
      coats: parseInt(coats) || 2,
      coveragePerGallon: parseFloat(coverage) || 350,
      wasteFactor: parseFloat(wasteFactor) / 100,
    });
    setResults(result);
  };

  const addToEstimate = () => {
    if (!results || !targetSection) return;

    const desc = inputMode === 'room'
      ? `Paint (${length}'x${width}' room${includeCeiling ? ' + ceiling' : ''}, ${coats} coats)`
      : `Paint (${results.squareFootage.toFixed(0)} sq ft, ${coats} coats)`;

    const items = [{
      id: uuid(),
      desc,
      category: 'materials',
      qty: results.gallonsNeeded,
      unit: 'gallons',
      unitCost: parseFloat(pricePerGallon) || 0,
      taxable: true,
    }];

    onAddItems(items, targetSection);
    setResults(null);
    setSquareFootage('');
    setLength('');
    setWidth('');
  };

  const totalCost = results ? results.gallonsNeeded * (parseFloat(pricePerGallon) || 0) : 0;

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        Calculate how many gallons of paint you need. Standard coverage is 350-400 sq ft per gallon.
      </p>

      {/* Input Mode Toggle */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
        <button
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            inputMode === 'sqft' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setInputMode('sqft')}
        >
          Square Footage
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            inputMode === 'room' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setInputMode('room')}
        >
          Room Dimensions
        </button>
      </div>

      {inputMode === 'sqft' ? (
        <div>
          <Label htmlFor="paint-sqft">Total Square Footage</Label>
          <Input
            id="paint-sqft"
            type="number"
            step="any"
            min="0"
            value={squareFootage}
            onChange={(e) => setSquareFootage(e.target.value)}
            placeholder="500"
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="paint-length">Room Length (ft)</Label>
              <Input
                id="paint-length"
                type="number"
                step="any"
                min="0"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                placeholder="12"
              />
            </div>
            <div>
              <Label htmlFor="paint-width">Room Width (ft)</Label>
              <Input
                id="paint-width"
                type="number"
                step="any"
                min="0"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="10"
              />
            </div>
            <div>
              <Label htmlFor="paint-height">Wall Height (ft)</Label>
              <Input
                id="paint-height"
                type="number"
                step="any"
                min="0"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="8"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="paint-ceiling"
              type="checkbox"
              checked={includeCeiling}
              onChange={(e) => setIncludeCeiling(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <Label htmlFor="paint-ceiling" className="cursor-pointer">Include Ceiling</Label>
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="paint-coats">Number of Coats</Label>
          <Input
            id="paint-coats"
            type="number"
            step="1"
            min="1"
            max="5"
            value={coats}
            onChange={(e) => setCoats(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="paint-coverage">Coverage (sq ft/gallon)</Label>
          <Input
            id="paint-coverage"
            type="number"
            step="10"
            min="100"
            value={coverage}
            onChange={(e) => setCoverage(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="paint-waste">Waste Factor (%)</Label>
          <Input
            id="paint-waste"
            type="number"
            step="1"
            min="0"
            max="50"
            value={wasteFactor}
            onChange={(e) => setWasteFactor(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="paint-price">Price per Gallon ($)</Label>
          <Input
            id="paint-price"
            type="number"
            step="0.01"
            min="0"
            value={pricePerGallon}
            onChange={(e) => setPricePerGallon(e.target.value)}
          />
        </div>
      </div>

      <Button onClick={calculate} disabled={inputMode === 'sqft' ? !squareFootage : (!length || !width)}>
        Calculate
      </Button>

      {results && (
        <div className="p-4 mt-4 space-y-3 rounded-lg bg-blue-50">
          <h4 className="font-semibold text-gray-900">Results</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Surface Area:</div>
            <div className="font-medium">{results.squareFootage.toFixed(1)} sq ft</div>
            <div>Coats:</div>
            <div className="font-medium">{results.coats}</div>
            <div>Total Coverage Needed:</div>
            <div className="font-medium">{results.totalCoverage.toFixed(1)} sq ft</div>
          </div>
          <div className="pt-2 border-t border-blue-200">
            <div className="text-lg font-bold text-gray-900">
              Gallons Needed: {results.gallonsNeeded}
            </div>
            <div className="text-sm text-gray-600">
              Estimated Cost: {money(totalCost)}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <Label htmlFor="paint-section">Add to:</Label>
            <select
              id="paint-section"
              value={targetSection}
              onChange={(e) => setTargetSection(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <Button onClick={addToEstimate}>
              Add to Estimate
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
