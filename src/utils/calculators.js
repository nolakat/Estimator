/**
 * Drywall Calculator
 * Standard sheet: 4' x 8' = 32 sq ft
 */
export function calculateDrywall({
  lengthFt,
  widthFt,
  heightFt,
  includeCeiling = false,
  wasteFactor = 0.10,
  sheetSize = 32,
}) {
  const perimeter = 2 * (lengthFt + widthFt);
  const wallArea = perimeter * heightFt;
  const ceilingArea = lengthFt * widthFt;

  const totalWallArea = wallArea * (1 + wasteFactor);
  const totalWithCeiling = (wallArea + ceilingArea) * (1 + wasteFactor);

  return {
    wallArea,
    ceilingArea,
    sheetsForWalls: Math.ceil(totalWallArea / sheetSize),
    sheetsWithCeiling: Math.ceil(totalWithCeiling / sheetSize),
    totalSqFtWalls: totalWallArea,
    totalSqFtWithCeiling: totalWithCeiling,
  };
}

/**
 * Paint Calculator
 * Standard coverage: 350-400 sq ft per gallon
 */
export function calculatePaint({
  squareFootage,
  coats = 2,
  coveragePerGallon = 350,
  wasteFactor = 0.10,
}) {
  const totalCoverage = squareFootage * coats * (1 + wasteFactor);
  const gallons = totalCoverage / coveragePerGallon;

  return {
    squareFootage,
    coats,
    totalCoverage,
    gallonsNeeded: Math.ceil(gallons),
    gallonsExact: parseFloat(gallons.toFixed(2)),
  };
}

/**
 * Flooring Calculator
 * Supports both tiles (by dimensions) and planks (by box coverage)
 */
export function calculateFlooring({
  lengthFt,
  widthFt,
  wasteFactor = 0.10,
  tileSize = null,
  plankCoverage = null,
}) {
  const roomArea = lengthFt * widthFt;
  const totalArea = roomArea * (1 + wasteFactor);

  const result = {
    roomArea,
    totalAreaWithWaste: totalArea,
    wasteFactor,
  };

  if (tileSize) {
    const tileSqFt = (tileSize.lengthIn * tileSize.widthIn) / 144;
    result.tilesNeeded = Math.ceil(totalArea / tileSqFt);
    result.tileSqFt = tileSqFt;
  }

  if (plankCoverage) {
    result.boxesNeeded = Math.ceil(totalArea / plankCoverage);
    result.coveragePerBox = plankCoverage;
  }

  return result;
}

/**
 * Calculate wall area from room dimensions (for paint calculator)
 */
export function calculateWallArea({
  lengthFt,
  widthFt,
  heightFt,
  includeCeiling = false,
}) {
  const perimeter = 2 * (lengthFt + widthFt);
  const wallArea = perimeter * heightFt;
  const ceilingArea = includeCeiling ? lengthFt * widthFt : 0;
  return wallArea + ceilingArea;
}
