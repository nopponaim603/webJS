/**
 * @file Pathfinding.js
 * @description Bresenham Line-of-Sight & Boat Navigation / Raycasting Engine.
 * @module engine/Pathfinding
 */

/**
 * Check sub-pixel corner collision when performing diagonal raycasts.
 * @param {number} currentX - Subpixel X position
 * @param {number} currentY - Subpixel Y position
 * @param {number} dirX - Normalized X direction step
 * @param {number} dirY - Normalized Y direction step
 * @param {object} map - Map object providing `getDistance(index)` and `width`
 * @returns {boolean} True if path is clear around corners
 */
export function checkSubpixelObstacle(currentX, currentY, dirX, dirY, map) {
  if (Math.abs(dirX) > Math.abs(dirY)) {
    const tile1 = Math.floor(currentX) + Math.floor(currentY + dirY - 0.49) * map.width;
    const tile2 = Math.floor(currentX) + Math.floor(currentY + dirY + 0.49) * map.width;
    if (map.getDistance(tile1) >= 0 || map.getDistance(tile2) >= 0) return false;
  } else {
    const tile1 = Math.floor(currentX + dirX - 0.49) + Math.floor(currentY) * map.width;
    const tile2 = Math.floor(currentX + dirX + 0.49) + Math.floor(currentY) * map.width;
    if (map.getDistance(tile1) >= 0 || map.getDistance(tile2) >= 0) return false;
  }
  return true;
}

/**
 * Perform Bresenham line-of-sight check between two grid tile coordinates.
 * @param {number} startX - Origin tile X grid coordinate
 * @param {number} startY - Origin tile Y grid coordinate
 * @param {number} endX - Target tile X grid coordinate
 * @param {number} endY - Target tile Y grid coordinate
 * @param {object} distanceMap - Distance field map providing `getDistance(index)` and `width`
 * @returns {boolean} True if direct line of sight exists without hitting land obstacles
 */
export function hasLineOfSight(startX, startY, endX, endY, distanceMap) {
  if (startX === endX && startY === endY) return true;

  const dx = endX - startX;
  const dy = endY - startY;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  const stepX = dx / steps;
  const stepY = dy / steps;

  let currentX = startX + 0.5;
  let currentY = startY + 0.5;

  // Check start & end points
  const startTile = startX + startY * distanceMap.width;
  if (distanceMap.getDistance(startTile) === -1 && !checkSubpixelObstacle(currentX, currentY, stepX, stepY, distanceMap)) {
    return false;
  }

  const endTile = endX + endY * distanceMap.width;
  if (distanceMap.getDistance(endTile) === -1 && !checkSubpixelObstacle(endX + 0.5, endY + 0.5, -stepX, -stepY, distanceMap)) {
    return false;
  }

  // Step through intermediate tiles
  for (let i = 1; i < steps; i++) {
    currentX += stepX;
    currentY += stepY;
    const tileIndex = Math.floor(currentX) + Math.floor(currentY) * distanceMap.width;
    const dist = distanceMap.getDistance(tileIndex);

    if (dist >= 0) return false; // Blocked by solid land
    if (dist === -1) {
      if (dx === 0 || dy === 0) continue;
      if (!checkSubpixelObstacle(currentX, currentY, stepX, stepY, distanceMap) ||
          !checkSubpixelObstacle(currentX, currentY, -stepX, -stepY, distanceMap)) {
        return false;
      }
    }
  }

  return true;
}