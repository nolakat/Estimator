import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { calculateDrywall } from '../../utils/calculators';
import { uuid, money } from '../../utils/estimator';

export function DrywallCalculator({ sections, onAddItems }) {
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('8');
  const [includeCeiling, setIncludeCeiling] = useState(false);
  const [wasteFactor, setWasteFactor] = useState('10');
  const [sheetPrice, setSheetPrice] = useState('15');
  const [targetSection, setTargetSection] = useState(sections[0]?.id || '');
  const [results, setResults] = useState(null);

  const calculate = () => {
    const l = parseFloat(length) || 0;
    const w = parseFloat(width) || 0;
    const h = parseFloat(height) || 8;
    if (l <= 0 || w <= 0) return;

    const result = calculateDrywall({
      lengthFt: l,
      widthFt: w,
      heightFt: h,
      includeCeiling,
      wasteFactor: parseFloat(wasteFactor) / 100,
    });
    setResults(result);
  };

  const addToEstimate = () => {
    if (!results || !targetSection) return;

    const sheets = includeCeiling ? results.sheetsWithCeiling : results.sheetsForWalls;
    const items = [{
      id: uuid(),
      desc: `Drywall 4x8 sheets (${length}'x${width}' room${includeCeiling ? ' + ceiling' : ''})`,
      category: 'materials',
      qty: sheets,
      unit: 'sheets',
      unitCost: parseFloat(sheetPrice) || 0,
      taxable: true,
    }];

    onAddItems(items, targetSection);
    setResults(null);
    setLength('');
    setWidth('');
  };

  const sheets = results ? (includeCeiling ? results.sheetsWithCeiling : results.sheetsForWalls) : 0;
  const totalCost = sheets * (parseFloat(sheetPrice) || 0);

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        Calculate how many 4x8 drywall sheets you need for a room.
      </p>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="dw-length">Room Length (ft)</Label>
          <Input
            id="dw-length"
            type="number"
            step="any"
            min="0"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            placeholder="12"
          />
        </div>
        <div>
          <Label htmlFor="dw-width">Room Width (ft)</Label>
          <Input
            id="dw-width"
            type="number"
            step="any"
            min="0"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            placeholder="10"
          />
        </div>
        <div>
          <Label htmlFor="dw-height">Wall Height (ft)</Label>
          <Input
            id="dw-height"
            type="number"
            step="any"
            min="0"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="8"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dw-waste">Waste Factor (%)</Label>
          <Input
            id="dw-waste"
            type="number"
            step="1"
            min="0"
            max="50"
            value={wasteFactor}
            onChange={(e) => setWasteFactor(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="dw-price">Price per Sheet ($)</Label>
          <Input
            id="dw-price"
            type="number"
            step="0.01"
            min="0"
            value={sheetPrice}
            onChange={(e) => setSheetPrice(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="dw-ceiling"
          type="checkbox"
          checked={includeCeiling}
          onChange={(e) => setIncludeCeiling(e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <Label htmlFor="dw-ceiling" className="cursor-pointer">Include Ceiling</Label>
      </div>

      <Button onClick={calculate} disabled={!length || !width}>
        Calculate
      </Button>

      {results && (
        <div className="p-4 mt-4 space-y-3 rounded-lg bg-blue-50">
          <h4 className="font-semibold text-gray-900">Results</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Wall Area:</div>
            <div className="font-medium">{results.wallArea.toFixed(1)} sq ft</div>
            {includeCeiling && (
              <>
                <div>Ceiling Area:</div>
                <div className="font-medium">{results.ceilingArea.toFixed(1)} sq ft</div>
              </>
            )}
            <div>Waste Factor:</div>
            <div className="font-medium">{wasteFactor}%</div>
          </div>
          <div className="pt-2 border-t border-blue-200">
            <div className="text-lg font-bold text-gray-900">
              Sheets Needed: {sheets}
            </div>
            <div className="text-sm text-gray-600">
              Estimated Cost: {money(totalCost)}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <Label htmlFor="dw-section">Add to:</Label>
            <select
              id="dw-section"
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
