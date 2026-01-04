import React, { useState } from 'react';
import { Ruler, Percent, DollarSign, Layers, Plus, Grid2X2, LayoutList } from 'lucide-react';
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

  const inputClasses = "w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 placeholder:text-slate-400";
  const labelClasses = "block mb-1.5 text-sm font-medium text-slate-700";

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
      <p className="text-sm text-slate-500">
        Calculate flooring materials needed for a room.
      </p>

      {/* Flooring Type Toggle */}
      <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200">
        <button
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            flooringType === 'plank'
              ? 'bg-white shadow-sm text-slate-800'
              : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => { setFlooringType('plank'); setResults(null); }}
        >
          <LayoutList className="w-4 h-4" />
          Planks/Laminate
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            flooringType === 'tile'
              ? 'bg-white shadow-sm text-slate-800'
              : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => { setFlooringType('tile'); setResults(null); }}
        >
          <Grid2X2 className="w-4 h-4" />
          Tiles
        </button>
      </div>

      {/* Room Dimensions */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <Ruler className="w-4 h-4 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">Room Dimensions</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="floor-length" className={labelClasses}>
              Length (ft)
            </label>
            <input
              id="floor-length"
              type="number"
              step="any"
              min="0"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              placeholder="12"
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="floor-width" className={labelClasses}>
              Width (ft)
            </label>
            <input
              id="floor-width"
              type="number"
              step="any"
              min="0"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              placeholder="10"
              className={inputClasses}
            />
          </div>
        </div>
      </div>

      {/* Waste Factor */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <Percent className="w-4 h-4 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">Waste Factor (%)</span>
        </div>
        <input
          id="floor-waste"
          type="number"
          step="1"
          min="0"
          max="50"
          value={wasteFactor}
          onChange={(e) => setWasteFactor(e.target.value)}
          className={`${inputClasses} max-w-[200px]`}
        />
        <p className="mt-1.5 text-xs text-slate-400">Recommended: 10% for standard rooms, 15% for diagonal patterns</p>
      </div>

      {/* Type-specific options */}
      {flooringType === 'tile' ? (
        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 space-y-4">
          <div className="flex items-center gap-2">
            <Grid2X2 className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Tile Options</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="tile-length" className={labelClasses}>
                Tile Length (in)
              </label>
              <input
                id="tile-length"
                type="number"
                step="1"
                min="1"
                value={tileLengthIn}
                onChange={(e) => setTileLengthIn(e.target.value)}
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor="tile-width" className={labelClasses}>
                Tile Width (in)
              </label>
              <input
                id="tile-width"
                type="number"
                step="1"
                min="1"
                value={tileWidthIn}
                onChange={(e) => setTileWidthIn(e.target.value)}
                className={inputClasses}
              />
            </div>
            <div className="p-3 -m-3 rounded-lg bg-gradient-to-br from-amber-50/80 to-orange-50/50 border border-amber-100">
              <label htmlFor="tile-price" className="block mb-1.5 text-sm font-medium text-amber-800">
                <span className="inline-flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  Price per Tile
                </span>
              </label>
              <input
                id="tile-price"
                type="number"
                step="0.01"
                min="0"
                value={pricePerTile}
                onChange={(e) => setPricePerTile(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-white border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 space-y-4">
          <div className="flex items-center gap-2">
            <LayoutList className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Plank/Laminate Options</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="plank-coverage" className={labelClasses}>
                Coverage per Box (sq ft)
              </label>
              <input
                id="plank-coverage"
                type="number"
                step="0.1"
                min="1"
                value={coveragePerBox}
                onChange={(e) => setCoveragePerBox(e.target.value)}
                className={inputClasses}
              />
            </div>
            <div className="p-3 -m-3 rounded-lg bg-gradient-to-br from-amber-50/80 to-orange-50/50 border border-amber-100">
              <label htmlFor="plank-price" className="block mb-1.5 text-sm font-medium text-amber-800">
                <span className="inline-flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  Price per Box
                </span>
              </label>
              <input
                id="plank-price"
                type="number"
                step="0.01"
                min="0"
                value={pricePerBox}
                onChange={(e) => setPricePerBox(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-white border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200"
              />
            </div>
          </div>
        </div>
      )}

      {/* Calculate Button */}
      <button
        onClick={calculate}
        disabled={!length || !width}
        className="w-full px-5 py-3 text-sm font-medium text-white bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl hover:from-slate-800 hover:to-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500/50 transition-all duration-200 shadow-lg shadow-slate-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
      >
        Calculate {flooringType === 'tile' ? 'Tiles' : 'Boxes'} Needed
      </button>

      {/* Results */}
      {results && (
        <div className="p-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 space-y-4">
          <h4 className="font-semibold text-slate-800 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            Results
          </h4>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-white/60">
              <div className="text-slate-500 text-xs mb-1">Room Area</div>
              <div className="font-semibold text-slate-800">{results.roomArea.toFixed(1)} sq ft</div>
            </div>
            <div className="p-3 rounded-lg bg-white/60">
              <div className="text-slate-500 text-xs mb-1">With {wasteFactor}% Waste</div>
              <div className="font-semibold text-slate-800">{results.totalAreaWithWaste.toFixed(1)} sq ft</div>
            </div>
          </div>

          <div className="pt-4 border-t border-amber-200">
            {flooringType === 'tile' ? (
              <>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-amber-800">Tiles Needed</span>
                  <span className="text-2xl font-bold text-amber-700">{results.tilesNeeded}</span>
                </div>
                <p className="text-xs text-amber-600/70 mt-1">
                  {tileLengthIn}"x{tileWidthIn}" tiles @ {results.tileSqFt?.toFixed(3)} sq ft each
                </p>
              </>
            ) : (
              <>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-amber-800">Boxes Needed</span>
                  <span className="text-2xl font-bold text-amber-700">{results.boxesNeeded}</span>
                </div>
                <p className="text-xs text-amber-600/70 mt-1">
                  {coveragePerBox} sq ft per box
                </p>
              </>
            )}
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-sm text-amber-800">Estimated Cost</span>
              <span className="text-lg font-semibold text-amber-600">{money(totalCost)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-amber-200">
            <div className="flex items-center gap-2 flex-1">
              <Layers className="w-4 h-4 text-slate-400" />
              <select
                id="floor-section"
                value={targetSection}
                onChange={(e) => setTargetSection(e.target.value)}
                className={`${inputClasses} flex-1`}
              >
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={addToEstimate}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl hover:from-amber-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200 shadow-lg shadow-amber-500/25"
            >
              <Plus className="w-4 h-4" />
              Add to Estimate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
