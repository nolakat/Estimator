import React, { useState } from 'react';
import { Ruler, Percent, DollarSign, Layers, Plus, SquareStack } from 'lucide-react';
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

  const inputClasses = "w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 placeholder:text-slate-400";
  const labelClasses = "block mb-1.5 text-sm font-medium text-slate-700";

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
      <p className="text-sm text-slate-500">
        Calculate how many gallons of paint you need. Standard coverage is 350-400 sq ft per gallon.
      </p>

      {/* Input Mode Toggle */}
      <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200">
        <button
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            inputMode === 'sqft'
              ? 'bg-white shadow-sm text-slate-800'
              : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setInputMode('sqft')}
        >
          Square Footage
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            inputMode === 'room'
              ? 'bg-white shadow-sm text-slate-800'
              : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setInputMode('room')}
        >
          Room Dimensions
        </button>
      </div>

      {inputMode === 'sqft' ? (
        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <SquareStack className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Surface Area</span>
          </div>
          <div>
            <label htmlFor="paint-sqft" className={labelClasses}>
              Total Square Footage
            </label>
            <input
              id="paint-sqft"
              type="number"
              step="any"
              min="0"
              value={squareFootage}
              onChange={(e) => setSquareFootage(e.target.value)}
              placeholder="500"
              className={inputClasses}
            />
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 space-y-4">
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Room Dimensions</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="paint-length" className={labelClasses}>
                Length (ft)
              </label>
              <input
                id="paint-length"
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
              <label htmlFor="paint-width" className={labelClasses}>
                Width (ft)
              </label>
              <input
                id="paint-width"
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
              <label htmlFor="paint-height" className={labelClasses}>
                Wall Height (ft)
              </label>
              <input
                id="paint-height"
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
          <label className="flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              id="paint-ceiling"
              type="checkbox"
              checked={includeCeiling}
              onChange={(e) => setIncludeCeiling(e.target.checked)}
              className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500 focus:ring-offset-0"
            />
            <span className="text-sm text-slate-700">Include Ceiling</span>
          </label>
        </div>
      )}

      {/* Paint Options */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200">
          <label htmlFor="paint-coats" className={labelClasses}>
            Number of Coats
          </label>
          <input
            id="paint-coats"
            type="number"
            step="1"
            min="1"
            max="5"
            value={coats}
            onChange={(e) => setCoats(e.target.value)}
            className={inputClasses}
          />
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200">
          <label htmlFor="paint-coverage" className={labelClasses}>
            Coverage (sq ft/gallon)
          </label>
          <input
            id="paint-coverage"
            type="number"
            step="10"
            min="100"
            value={coverage}
            onChange={(e) => setCoverage(e.target.value)}
            className={inputClasses}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <Percent className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Waste Factor (%)</span>
          </div>
          <input
            id="paint-waste"
            type="number"
            step="1"
            min="0"
            max="50"
            value={wasteFactor}
            onChange={(e) => setWasteFactor(e.target.value)}
            className={inputClasses}
          />
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/80 to-orange-50/50 border border-amber-100">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">Price per Gallon</span>
          </div>
          <input
            id="paint-price"
            type="number"
            step="0.01"
            min="0"
            value={pricePerGallon}
            onChange={(e) => setPricePerGallon(e.target.value)}
            className="w-full px-4 py-2.5 text-sm bg-white border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200"
          />
        </div>
      </div>

      {/* Calculate Button */}
      <button
        onClick={calculate}
        disabled={inputMode === 'sqft' ? !squareFootage : (!length || !width)}
        className="w-full px-5 py-3 text-sm font-medium text-white bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl hover:from-slate-800 hover:to-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500/50 transition-all duration-200 shadow-lg shadow-slate-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
      >
        Calculate Gallons Needed
      </button>

      {/* Results */}
      {results && (
        <div className="p-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 space-y-4">
          <h4 className="font-semibold text-slate-800 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            Results
          </h4>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-white/60">
              <div className="text-slate-500 text-xs mb-1">Surface Area</div>
              <div className="font-semibold text-slate-800">{results.squareFootage.toFixed(1)} sq ft</div>
            </div>
            <div className="p-3 rounded-lg bg-white/60">
              <div className="text-slate-500 text-xs mb-1">Coats</div>
              <div className="font-semibold text-slate-800">{results.coats}</div>
            </div>
            <div className="p-3 rounded-lg bg-white/60">
              <div className="text-slate-500 text-xs mb-1">Total Coverage</div>
              <div className="font-semibold text-slate-800">{results.totalCoverage.toFixed(1)} sq ft</div>
            </div>
          </div>

          <div className="pt-4 border-t border-amber-200">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-amber-800">Gallons Needed</span>
              <span className="text-2xl font-bold text-amber-700">{results.gallonsNeeded}</span>
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
                id="paint-section"
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
