// Minimal Isolation Forest (Liu, Ting & Zhou, 2008) — runs entirely in the browser.
// Mirrors the model used by services/ml-engine so the UI scores logs the same way.

const EULER = 0.5772156649;

// Average path length of an unsuccessful BST search over n points.
export const cFactor = (n) => {
  if (n <= 1) return 0;
  if (n === 2) return 1;
  return 2 * (Math.log(n - 1) + EULER) - (2 * (n - 1)) / n;
};

// Small seeded PRNG so a given seed always grows the same forest.
export const mulberry32 = (seed) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const buildTree = (rows, depth, maxDepth, rand) => {
  if (depth >= maxDepth || rows.length <= 1) return { size: rows.length };
  const dims = rows[0].length;
  // Pick a feature that actually varies in this partition.
  for (let attempt = 0; attempt < dims * 2; attempt++) {
    const f = Math.floor(rand() * dims);
    let min = Infinity;
    let max = -Infinity;
    for (const r of rows) {
      if (r[f] < min) min = r[f];
      if (r[f] > max) max = r[f];
    }
    if (max - min < 1e-9) continue;
    const split = min + rand() * (max - min);
    const left = [];
    const right = [];
    for (const r of rows) (r[f] < split ? left : right).push(r);
    return {
      f,
      split,
      left: buildTree(left, depth + 1, maxDepth, rand),
      right: buildTree(right, depth + 1, maxDepth, rand),
    };
  }
  return { size: rows.length };
};

const pathLength = (x, node, depth = 0) => {
  if (node.size !== undefined) return depth + cFactor(node.size);
  return pathLength(x, x[node.f] < node.split ? node.left : node.right, depth + 1);
};

export class IsolationForest {
  constructor({ trees = 100, sampleSize = 256, seed = 42 } = {}) {
    this.nTrees = trees;
    this.sampleSize = sampleSize;
    this.seed = seed;
    this.forest = [];
    this.trainedOn = 0;
  }

  fit(data) {
    const rand = mulberry32(this.seed);
    const psi = Math.min(this.sampleSize, data.length);
    const maxDepth = Math.ceil(Math.log2(Math.max(psi, 2)));
    this.forest = [];
    for (let t = 0; t < this.nTrees; t++) {
      const sample = [];
      for (let i = 0; i < psi; i++) sample.push(data[Math.floor(rand() * data.length)]);
      this.forest.push(buildTree(sample, 0, maxDepth, rand));
    }
    this.c = cFactor(psi);
    this.trainedOn = data.length;
    return this;
  }

  // Returns per-tree path lengths — handy for the Lab histogram.
  paths(x) {
    return this.forest.map((tree) => pathLength(x, tree));
  }

  // Anomaly score in (0, 1]; > ~0.6 is suspicious, > 0.7 is almost certainly an outlier.
  score(x) {
    if (!this.forest.length) return 0.5;
    const p = this.paths(x);
    const mean = p.reduce((a, b) => a + b, 0) / p.length;
    return Math.pow(2, -mean / this.c);
  }
}
