/**
 * @file Heap.js
 * @description Priority Queue Data Structures & Color Utility Classes for WarFront Engine.
 * @module core/Heap
 */

/**
 * Binary Heap Priority Queue implementation.
 * Supports arbitrary comparison function for min-heap or max-heap.
 * @template T
 */
export class BinaryHeap {
  /**
   * @param {function(T, T): boolean} comparator - Returns true if item A has higher priority than item B
   */
  constructor(comparator) {
    this.comparator = comparator;
    /** @type {T[]} */
    this.heap = [];
  }

  /**
   * Check if the heap is empty.
   * @returns {boolean}
   */
  isEmpty() {
    return this.heap.length === 0;
  }

  /**
   * Get the current count of elements in the heap.
   * @returns {number}
   */
  size() {
    return this.heap.length;
  }

  /**
   * View the highest priority item without removing it.
   * @returns {T|undefined}
   */
  peek() {
    return this.heap[0];
  }

  /**
   * Insert a new element into the priority queue.
   * @param {T} item
   * @returns {number} New size of heap
   */
  push(item) {
    this.siftUp(item);
    return this.size();
  }

  /**
   * Extract and return the highest priority element.
   * @returns {T|undefined}
   */
  pop() {
    if (this.size() === 1) return this.heap.pop();
    if (this.size() === 0) return undefined;

    const topItem = this.heap[0];
    const lastItem = this.heap.pop();
    if (this.size() > 0) {
      this.siftDown(lastItem);
    }
    return topItem;
  }

  /**
   * Update an item matching the predicate callback.
   * @param {function(T): boolean} predicate
   * @param {T} newItem
   * @returns {number} Heap size
   */
  update(predicate, newItem) {
    const index = this.heap.findIndex(predicate);
    if (index !== -1) {
      this.heap[index] = newItem;
      this.siftUp(newItem, index);
    }
    return this.size();
  }

  /**
   * Move element up to restore heap order property.
   * @param {T} item
   * @param {number} [targetIndex]
   * @protected
   */
  siftUp(item, targetIndex = this.size()) {
    let index = targetIndex;
    while (index > 0) {
      const parentIndex = ((index + 1) >>> 1) - 1;
      const parentItem = this.heap[parentIndex];
      if (!this.comparator(item, parentItem)) break;
      this.heap[index] = parentItem;
      index = parentIndex;
    }
    this.heap[index] = item;
  }

  /**
   * Move element down to restore heap order property.
   * @param {T} item
   * @protected
   */
  siftDown(item) {
    let index = 0;
    const halfSize = this.size() >>> 1;
    while (index < halfSize) {
      const leftIndex = 1 + (index << 1);
      const rightIndex = leftIndex + 1;
      const leftChild = this.heap[leftIndex];
      const rightChild = this.heap[rightIndex];

      if (rightIndex < this.size() && this.comparator(rightChild, leftChild)) {
        if (!this.comparator(rightChild, item)) break;
        this.heap[index] = rightChild;
        index = rightIndex;
      } else {
        if (!this.comparator(leftChild, item)) break;
        this.heap[index] = leftChild;
        index = leftIndex;
      }
    }
    this.heap[index] = item;
  }
}

/**
 * Priority-sorted list maintaining elements ordered by numeric rank values.
 * @template T
 */
export class PriorityList {
  constructor() {
    /** @type {T[]} */
    this.elements = [];
    /** @type {number[]} */
    this.values = [];
  }

  /**
   * Add item sorted by ascending value.
   * @param {T} item
   * @param {number} value
   */
  add(item, value) {
    const insertIndex = this.values.findIndex((v) => v <= value);
    if (insertIndex === -1) {
      this.elements.push(item);
      this.values.push(value);
    } else {
      this.elements.splice(insertIndex, 0, item);
      this.values.splice(insertIndex, 0, value);
    }
  }

  /**
   * Remove an item from the list.
   * @param {T} item
   */
  remove(item) {
    const index = this.elements.indexOf(item);
    if (index !== -1) {
      this.elements.splice(index, 1);
      this.values.splice(index, 1);
    }
  }

  /**
   * Find element matching predicate.
   * @param {function(T): boolean} predicate
   * @returns {T|undefined}
   */
  find(predicate) {
    return this.elements.find(predicate);
  }

  /**
   * Iterate over all elements.
   * @param {function(T, number): void} callback
   */
  forEach(callback) {
    this.elements.forEach(callback);
  }

  some(predicate) {
    return this.elements.some(predicate);
  }

  every(predicate) {
    return this.elements.every(predicate);
  }

  [Symbol.iterator]() {
    return this.elements[Symbol.iterator]();
  }
}

/**
 * Extended Map with default value generator for missing keys.
 * @template K, V
 * @extends {Map<K, V>}
 */
export class DefaultMap extends Map {
  /**
   * @param {function(): V} defaultValueFactory
   */
  constructor(defaultValueFactory) {
    super();
    this.defaultValueFactory = defaultValueFactory;
  }

  /**
   * Get existing value or compute, set and return default value.
   * @param {K} key
   * @returns {V}
   */
  getOrSet(key) {
    if (this.has(key)) {
      return this.get(key);
    }
    const defaultValue = this.defaultValueFactory();
    this.set(key, defaultValue);
    return defaultValue;
  }
}

/**
 * RGBA Color Representation & Buffer Blending Utility
 */
export class RGBColor {
  /**
   * @param {number} r - Red component (0-255)
   * @param {number} g - Green component (0-255)
   * @param {number} b - Blue component (0-255)
   * @param {number} [a=1] - Alpha transparency (0.0 - 1.0)
   */
  constructor(r, g, b, a = 1) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  toString() {
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
  }

  writeToBuffer(buffer, offset) {
    buffer[offset] = this.r;
    buffer[offset + 1] = this.g;
    buffer[offset + 2] = this.b;
    buffer[offset + 3] = (this.a * 255) | 0;
  }

  blendWithBuffer(buffer, offset, opacity = 1) {
    const alpha = opacity * this.a;
    const invAlpha = 1 - alpha;
    buffer[offset] = alpha * this.r + invAlpha * buffer[offset];
    buffer[offset + 1] = alpha * this.g + invAlpha * buffer[offset + 1];
    buffer[offset + 2] = alpha * this.b + invAlpha * buffer[offset + 2];
  }

  withRed(red) {
    return new RGBColor(Math.min(255, Math.max(0, red)), this.g, this.b, this.a);
  }

  withGreen(green) {
    return new RGBColor(this.r, Math.min(255, Math.max(0, green)), this.b, this.a);
  }

  withBlue(blue) {
    return new RGBColor(this.r, this.g, Math.min(255, Math.max(0, blue)), this.a);
  }

  withAlpha(alpha) {
    return new RGBColor(this.r, this.g, this.b, Math.min(1, Math.max(0, alpha)));
  }
}

/**
 * HSLA Color Representation
 */
export class HSLAColor {
  /**
   * @param {number} h - Hue (0 - 360)
   * @param {number} s - Saturation (0.0 - 1.0)
   * @param {number} l - Lightness (0.0 - 1.0)
   * @param {number} [a=1] - Alpha (0.0 - 1.0)
   */
  constructor(h, s, l, a = 1) {
    this.h = h;
    this.s = s;
    this.l = l;
    this.a = a;
  }

  toString() {
    return `hsla(${this.h}, ${(this.s * 100).toFixed(1)}%, ${(this.l * 100).toFixed(1)}%, ${this.a})`;
  }

  toRGB() {
    return new RGBColor(
      this.toRGBComponent(0),
      this.toRGBComponent(8),
      this.toRGBComponent(4),
      this.a
    );
  }

  withHue(hue) {
    return new HSLAColor(((hue % 360) + 360) % 360, this.s, this.l, this.a);
  }

  withSaturation(saturation) {
    return new HSLAColor(this.h, Math.min(1, Math.max(0, saturation)), this.l, this.a);
  }

  withLightness(lightness) {
    return new HSLAColor(this.h, this.s, Math.min(1, Math.max(0, lightness)), this.a);
  }

  withAlpha(alpha) {
    return new HSLAColor(this.h, this.s, this.l, Math.min(1, Math.max(0, alpha)));
  }

  static fromRGB(r, g, b) {
    const normR = r / 255;
    const normG = g / 255;
    const normB = b / 255;
    const max = Math.max(normR, normG, normB);
    const min = Math.min(normR, normG, normB);
    const delta = max - min;
    const chroma = 1 - Math.abs(min + max - 1);

    let hue = 0;
    if (delta !== 0) {
      switch (max) {
        case normR:
          hue = ((normG - normB) / delta) % 6;
          break;
        case normG:
          hue = (normB - normR) / delta + 2;
          break;
        case normB:
          hue = (normR - normG) / delta + 4;
          break;
      }
      hue = 60 * (hue < 0 ? hue + 6 : hue);
    }
    const saturation = chroma === 0 ? 0 : delta / chroma;
    const lightness = (max + min) / 2;

    return new HSLAColor(hue, saturation, lightness);
  }

  toRGBComponent(offset) {
    const k = (offset + this.h / 30) % 12;
    const a = this.s * Math.min(this.l, 1 - this.l);
    return Math.round(255 * (this.l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  }

  static fromRGBA(r, g, b, a) {
    return HSLAColor.fromRGB(r, g, b).withAlpha(a);
  }

  static fromRGBColor(rgbColor) {
    return HSLAColor.fromRGB(rgbColor.r, rgbColor.g, rgbColor.b).withAlpha(rgbColor.a);
  }
}