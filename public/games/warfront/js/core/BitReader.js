/**
 * @file BitReader.js
 * @description Binary Bit-Level Stream Reader & Writer for compressed WarFront map decoding.
 * @module core/BitReader
 */

/**
 * Reads data at the bit level from an ArrayBuffer or Uint8Array.
 */
export class BitReader {
  /**
   * @param {Uint8Array} buffer - Target binary byte array
   */
  constructor(buffer) {
    /** @type {Uint8Array} */
    this.buffer = buffer;
    /** @type {number} Current bit offset index */
    this.offset = 0;
  }

  /**
   * Reads a specified number of bits from the binary stream.
   * @param {number} bitLength - Number of bits to read (1 to 32)
   * @returns {number} Unsigned 32-bit integer value read from stream
   */
  readBits(bitLength) {
    if (bitLength > 32) {
      throw new Error("Cannot read more than 32 bits at a time");
    }
    if (this.offset + bitLength > this.buffer.length * 8) {
      throw new Error("Not enough data left in buffer to read requested bits");
    }

    let result = 0;
    for (let i = this.offset; i < this.offset + bitLength; i++) {
      const byteIndex = i >>> 3;
      const bitIndex = 7 & ~i;
      const bitValue = (this.buffer[byteIndex] >>> bitIndex) & 1;
      result |= bitValue << (i - this.offset);
    }
    this.offset += bitLength;
    return result >>> 0;
  }

  /**
   * Reads an ASCII string up to a max length from the stream.
   * @param {number} maxLen - Maximum character length to read
   * @returns {string} Decoded string
   */
  readString(maxLen) {
    const actualLen = Math.min(maxLen, this.readBits(16));
    let str = "";
    for (let i = 0; i < actualLen; i++) {
      str += String.fromCharCode(this.readBits(8));
    }
    return str;
  }

  /**
   * Reads a 1-bit boolean value.
   * @returns {boolean} True if bit is 1, false if 0
   */
  readBoolean() {
    return this.readBits(1) === 1;
  }
}

/**
 * Writes data at the bit level to a dynamic binary buffer.
 */
export class BitWriter {
  constructor(initialCapacity = 1024) {
    this.buffer = new Uint8Array(initialCapacity);
    this.offset = 0;
  }

  ensureCapacity(additionalBits) {
    const requiredBytes = Math.ceil((this.offset + additionalBits) / 8);
    if (requiredBytes > this.buffer.length) {
      const newBuffer = new Uint8Array(Math.max(this.buffer.length * 2, requiredBytes));
      newBuffer.set(this.buffer);
      this.buffer = newBuffer;
    }
  }

  writeBits(bitLength, value) {
    this.ensureCapacity(bitLength);
    for (let i = 0; i < bitLength; i++) {
      const bit = (value >>> i) & 1;
      const byteIndex = (this.offset + i) >>> 3;
      const bitIndex = 7 & ~(this.offset + i);
      if (bit) {
        this.buffer[byteIndex] |= 1 << bitIndex;
      } else {
        this.buffer[byteIndex] &= ~(1 << bitIndex);
      }
    }
    this.offset += bitLength;
  }

  writeString(maxLen, str) {
    const len = Math.min(maxLen, str.length);
    this.writeBits(16, len);
    for (let i = 0; i < len; i++) {
      this.writeBits(8, str.charCodeAt(i));
    }
  }

  writeBoolean(value) {
    this.writeBits(1, value ? 1 : 0);
  }

  getBuffer() {
    const totalBytes = Math.ceil(this.offset / 8);
    return this.buffer.subarray(0, totalBytes);
  }
}