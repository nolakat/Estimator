import React, { useState } from 'react';
import { Ruler, Percent, DollarSign, Layers, Plus } from 'lucide-react';
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

  const inputClasses = "w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 placeholder:text-slate-400";
  const labelClasses = "block mb-1.5 text-sm font-medium text-slate-700";

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
      <p className="text-sm text-slate-500">
        Calculate how many 4x8 drywall sheets you need for a room.
      </p>

      {/* Room Dimensions */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <Ruler className="w-4 h-4 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">Room Dimensions</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="dw-length" className={labelClasses}>
              Length (ft)
            </label>
            <input
              id="dw-length"
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
            <label htmlFor="dw-width" className={labelClasses}>
              Width (ft)
            </label>
            <input
              id="dw-width"
              type="number"
              step="any"
              min="0"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              placeholder="10"
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="dw-height" className={labelClasses}>
              Wall Height (ft)
            </label>
            <input
              id="dw-height"
              type="number"
              step="any"
              min="0"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="8"
              className={inputClasses}
            />
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <Percent className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Waste Factor</span>
          </div>
          <input
            id="dw-waste"
            type="number"
            step="1"
            min="0"
            max="50"
            value={wasteFactor}
            onChange={(e) => setWasteFactor(e.target.value)}
            className={inputClasses}
          />
          <p className="mt-1.5 text-xs text-slate-400">Recommended: 10-15%</p>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/80 to-orange-50/50 border border-amber-100">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">Price per Sheet</span>
          </div>
          <input
            id="dw-price"
            type="number"
            step="0.01"
            min="0"
            value={sheetPrice}
            onChange={(e) => setSheetPrice(e.target.value)}
            className="w-full px-4 py-2.5 text-sm bg-white border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200"
          />
        </div>
      </div>

      {/* Include Ceiling */}
      <label className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
        <input
          id="dw-ceiling"
          type="checkbox"
          checked={includeCeiling}
          onChange={(e) => setIncludeCeiling(e.target.checked)}
          className="w-5 h-5 text-amber-600 border-slate-300 rounded focus:ring-amber-500 focus:ring-offset-0"
        />
        <div>
          <span className="text-sm font-medium text-slate-700">Include Ceiling</span>
          <p className="text-xs text-slate-400">Add ceiling area to calculation</p>
        </div>
      </label>

      {/* Calculate Button */}
      <button
        onClick={calculate}
        disabled={!length || !width}
        className="w-full px-5 py-3 text-sm font-medium text-white bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl hover:from-slate-800 hover:to-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500/50 transition-all duration-200 shadow-lg shadow-slate-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
      >
        Calculate Sheets Needed
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
              <div className="text-slate-500 text-xs mb-1">Wall Area</div>
              <div className="font-semibold text-slate-800">{results.wallArea.toFixed(1)} sq ft</div>
            </div>
            {includeCeiling && (
              <div className="p-3 rounded-lg bg-white/60">
                <div className="text-slate-500 text-xs mb-1">Ceiling Area</div>
                <div className="font-semibold text-slate-800">{results.ceilingArea.toFixed(1)} sq ft</div>
              </div>
            )}
            <div className="p-3 rounded-lg bg-white/60">
              <div className="text-slate-500 text-xs mb-1">Waste Factor</div>
              <div className="font-semibold text-slate-800">{wasteFactor}%</div>
            </div>
          </div>

          <div className="pt-4 border-t border-amber-200">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-amber-800">Sheets Needed</span>
              <span className="text-2xl font-bold text-amber-700">{sheets}</span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm text-amber-800">Estimated Cost</span>
              <span className="text-lg font-semibold text-amber-600">{money(totalCost)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-amber-200">
            <div className="flex items-center gap-2 flex-1">
              <Layers className="w-4 h-4 text-slate-400" />
              <select
                id="dw-section"
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
