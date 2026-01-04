import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { calculateFlooring } from '../../utils/calculators';
import { uuid, money } from '../../utils/estimator';

export function FlooringCalculator({ sections, onAddItems }) {
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [wasteFactor, setWasteFactor] = useState('10');
  const [flooringType, setFlooringType] = useState('plank');

  // Tile options
  const [tileLengthIn, setTileLengthIn] = useState('12');
  const [tileWidthIn, setTileWidthIn] = useState('12');
  const [pricePerTile, setPricePerTile] = useState('3');

  // Plank options
  const [coveragePerBox, setCoveragePerBox] = useState('20');
  const [pricePerBox, setPricePerBox] = useState('45');

  const [targetSection, setTargetSection] = useState(sections[0]?.id || '');
  const [results, setResults] = useState(null);

  const calculate = () => {
    const l = parseFloat(length) || 0;
    const w = parseFloat(width) || 0;
    if (l <= 0 || w <= 0) return;

    const result = calculateFlooring({
      lengthFt: l,
      widthFt: w,
      wasteFactor: parseFloat(wasteFactor) / 100,
      tileSize: flooringType === 'tile' ? {
        lengthIn: parseFloat(tileLengthIn) || 12,
        widthIn: parseFloat(tileWidthIn) || 12,
      } : null,
      plankCoverage: flooringType === 'plank' ? parseFloat(coveragePerBox) || 20 : null,
    });
    setResults(result);
  };

  const addToEstimate = () => {
    if (!results || !targetSection) return;

    let items;
    if (flooringType === 'tile') {
      items = [{
        id: uuid(),
        desc: `Floor Tiles ${tileLengthIn}"x${tileWidthIn}" (${length}'x${width}' room)`,
        category: 'materials',
        qty: results.tilesNeeded,
        unit: 'tiles',
        unitCost: parseFloat(pricePerTile) || 0,
        taxable: true,
      }];
    } else {
      items = [{
        id: uuid(),
        desc: `Flooring Planks (${length}'x${width}' room)`,
        category: 'materials',
        qty: results.boxesNeeded,
        unit: 'boxes',
        unitCost: parseFloat(pricePerBox) || 0,
        taxable: true,
      }];
    }

    onAddItems(items, targetSection);
    setResults(null);
    setLength('');
    setWidth('');
  };

  const totalCost = results
    ? flooringType === 'tile'
      ? results.tilesNeeded * (parseFloat(pricePerTile) || 0)
      : results.boxesNeeded * (parseFloat(pricePerBox) || 0)
    : 0;

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        Calculate flooring materials needed for a room.
      </p>

      {/* Flooring Type Toggle */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
        <button
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            flooringType === 'plank' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => { setFlooringType('plank'); setResults(null); }}
        >
          Planks/Laminate
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            flooringType === 'tile' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => { setFlooringType('tile'); setResults(null); }}
        >
          Tiles
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="floor-length">Room Length (ft)</Label>
          <Input
            id="floor-length"
            type="number"
            step="any"
            min="0"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            placeholder="12"
          />
        </div>
        <div>
          <Label htmlFor="floor-width">Room Width (ft)</Label>
          <Input
            id="floor-width"
            type="number"
            step="any"
            min="0"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            placeholder="10"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="floor-waste">Waste Factor (%)</Label>
        <Input
          id="floor-waste"
          type="number"
          step="1"
          min="0"
          max="50"
          value={wasteFactor}
          onChange={(e) => setWasteFactor(e.target.value)}
          className="max-w-[150px]"
        />
      </div>

      {flooringType === 'tile' ? (
        <div className="p-4 space-y-4 border rounded-lg bg-gray-50">
          <h4 className="font-medium text-gray-900">Tile Options</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="tile-length">Tile Length (in)</Label>
              <Input
                id="tile-length"
                type="number"
                step="1"
                min="1"
                value={tileLengthIn}
                onChange={(e) => setTileLengthIn(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="tile-width">Tile Width (in)</Label>
              <Input
                id="tile-width"
                type="number"
                step="1"
                min="1"
                value={tileWidthIn}
                onChange={(e) => setTileWidthIn(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="tile-price">Price per Tile ($)</Label>
              <Input
                id="tile-price"
                type="number"
                step="0.01"
                min="0"
                value={pricePerTile}
                onChange={(e) => setPricePerTile(e.target.value)}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 space-y-4 border rounded-lg bg-gray-50">
          <h4 className="font-medium text-gray-900">Plank/Laminate Options</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="plank-coverage">Coverage per Box (sq ft)</Label>
              <Input
                id="plank-coverage"
                type="number"
                step="0.1"
                min="1"
                value={coveragePerBox}
                onChange={(e) => setCoveragePerBox(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="plank-price">Price per Box ($)</Label>
              <Input
                id="plank-price"
                type="number"
                step="0.01"
                min="0"
                value={pricePerBox}
                onChange={(e) => setPricePerBox(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      <Button onClick={calculate} disabled={!length || !width}>
        Calculate
      </Button>

      {results && (
        <div className="p-4 mt-4 space-y-3 rounded-lg bg-blue-50">
          <h4 className="font-semibold text-gray-900">Results</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Room Area:</div>
            <div className="font-medium">{results.roomArea.toFixed(1)} sq ft</div>
            <div>With {wasteFactor}% Waste:</div>
            <div className="font-medium">{results.totalAreaWithWaste.toFixed(1)} sq ft</div>
          </div>
          <div className="pt-2 border-t border-blue-200">
            {flooringType === 'tile' ? (
              <>
                <div className="text-lg font-bold text-gray-900">
                  Tiles Needed: {results.tilesNeeded}
                </div>
                <div className="text-sm text-gray-600">
                  ({tileLengthIn}"x{tileWidthIn}" tiles @ {results.tileSqFt?.toFixed(3)} sq ft each)
                </div>
              </>
            ) : (
              <>
                <div className="text-lg font-bold text-gray-900">
                  Boxes Needed: {results.boxesNeeded}
                </div>
                <div className="text-sm text-gray-600">
                  ({coveragePerBox} sq ft per box)
                </div>
              </>
            )}
            <div className="mt-2 text-sm text-gray-600">
              Estimated Cost: {money(totalCost)}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <Label htmlFor="floor-section">Add to:</Label>
            <select
              id="floor-section"
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
