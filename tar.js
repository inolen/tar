(function (root) {

var BLOCKSIZE = 512;

function parseString(val) {
  var chars = [];

  for (var i = 0; i < val.length; i++) {
    var c = val[i];

    if (c === 0x00) {
      break;
    }

    chars.push(c);
  }

  return String.fromCharCode.apply(null, chars);
}

function parseNumeric(val) {
  var res = parseString(val);
  res = parseInt(res, 8);
  return isNaN(res) ? null : res;
}

var Tar = function (buffer) {
  var isBuffer = buffer instanceof ArrayBuffer ||
    (typeof Buffer !== 'undefined' && buffer instanceof Buffer);

  var isView =  buffer instanceof Int8Array ||
    buffer instanceof Uint8Array;

  if (!isBuffer && !isView) {
    throw new Error('Must specify a valid ArrayBuffer, Buffer, INT8Array or Int8Array.');
  }

  this.INT8 = isView ? buffer : new Int8Array(buffer);
  this.headers = {};
  this.pos = 0;

  var numEmptyHeaders = 0;

  while (numEmptyHeaders < 2) {
    var pos = this.pos;
    var header = this._readHeader();
    
    if (!header.name) {
      numEmptyHeaders++;
      continue;
    }

    this.headers[header.name] = header;

    this.pos += Math.ceil(header.size / BLOCKSIZE) * BLOCKSIZE;
  }
};

Tar.prototype._readHeader = function () {
  var header = {
    name: parseString(this.INT8.subarray(this.pos, (this.pos += 100))),
    mode: parseNumeric(this.INT8.subarray(this.pos, (this.pos += 8))),
    uid: parseNumeric(this.INT8.subarray(this.pos, (this.pos += 8))),
    gid: parseNumeric(this.INT8.subarray(this.pos, (this.pos += 8))),
    size: parseNumeric(this.INT8.subarray(this.pos, (this.pos += 12))),
    mtime: parseNumeric(this.INT8.subarray(this.pos, (this.pos += 12))),
    chksum: parseNumeric(this.INT8.subarray(this.pos, (this.pos += 8))),
    typeflag: parseString(this.INT8.subarray(this.pos, (this.pos += 1))),
    linkname: parseString(this.INT8.subarray(this.pos, (this.pos += 100))),
    magic: parseString(this.INT8.subarray(this.pos, (this.pos += 6))),
    version: parseString(this.INT8.subarray(this.pos, (this.pos += 2))),
    uname: parseString(this.INT8.subarray(this.pos, (this.pos += 32))),
    gname: parseString(this.INT8.subarray(this.pos, (this.pos += 32))),
    devmajor: parseNumeric(this.INT8.subarray(this.pos, (this.pos += 8))),
    devminor: parseNumeric(this.INT8.subarray(this.pos, (this.pos += 8))),
    prefix: parseString(this.INT8.subarray(this.pos, (this.pos += 155)))
  };

  this.pos += 12;  // padding

  header.offset = this.pos;

  return header;
};

Tar.prototype.getMembers = function () {
  return this.headers;
};

Tar.prototype.getContent = function (name) {
  var header = this.headers[name];

  if (!header) {
    return null;
  }

  return this.INT8.subarray(header.offset, header.offset + header.size);
};

root.Tar = Tar;

// AMD / RequireJS
if (typeof define !== 'undefined' && define.amd) {
  define(function () {
    return Tar;
  });
}
// Node.js
else if (typeof module !== 'undefined' && module.exports) {
  module.exports = Tar;
}

}(this));
