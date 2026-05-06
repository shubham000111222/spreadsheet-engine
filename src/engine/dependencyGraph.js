/**
 * dependencyGraph.js
 * Manages the bidirectional dependency graph between cells.
 *
 * dependents[X]    = Set of cells that depend on X  (X is an input to them)
 * dependencies[X]  = Set of cells that X depends on (X reads from them)
 *
 * Provides:
 *  - updateDeps(cellId, newDeps, graph)
 *  - detectCycle(startCell, graph)
 *  - topologicalSort(startCells, graph)
 */

/**
 * Update the dependency graph when a cell's formula changes.
 *
 * @param {string} cellId        - The cell being changed (e.g. "A1")
 * @param {Set<string>} newDeps  - The new set of cells this cell depends on
 * @param {{ dependents: object, dependencies: object }} graph
 */
export function updateDeps(cellId, newDeps, graph) {
  const { dependents, dependencies } = graph;

  // Remove this cell from the dependents list of its old dependencies
  const oldDeps = dependencies[cellId] || new Set();
  for (const dep of oldDeps) {
    if (dependents[dep]) {
      dependents[dep].delete(cellId);
    }
  }

  // Set new dependencies for cellId
  dependencies[cellId] = new Set(newDeps);

  // Add this cell as a dependent of each new dependency
  for (const dep of newDeps) {
    if (!dependents[dep]) dependents[dep] = new Set();
    dependents[dep].add(cellId);
  }
}

/**
 * Detect if adding `newDeps` for `startCell` would create a cycle.
 * Uses DFS from each new dependency; if we can reach startCell, there's a cycle.
 *
 * @param {string} startCell
 * @param {Set<string>} newDeps
 * @param {{ dependencies: object }} graph
 * @returns {boolean}
 */
export function detectCycle(startCell, newDeps, graph) {
  const { dependencies } = graph;
  const visited = new Set();

  function dfs(cell) {
    if (cell === startCell) return true; // cycle found
    if (visited.has(cell)) return false;
    visited.add(cell);
    const deps = dependencies[cell] || new Set();
    for (const dep of deps) {
      if (dfs(dep)) return true;
    }
    return false;
  }

  for (const dep of newDeps) {
    visited.clear();
    if (dep === startCell) return true;
    if (dfs(dep)) return true;
  }
  return false;
}

/**
 * Get the ordered list of cells that need to be recalculated after
 * `changedCell` is updated. Uses Kahn's algorithm for topological sort
 * on the subgraph of reachable dependents.
 *
 * @param {string} changedCell
 * @param {{ dependents: object, dependencies: object }} graph
 * @returns {string[]}
 */
export function getRecalcOrder(changedCell, graph) {
  const { dependents, dependencies } = graph;

  // 1. Find all reachable cells (the affected subgraph)
  const reachable = new Set();
  const queue = [changedCell];
  while (queue.length > 0) {
    const cell = queue.shift();
    if (reachable.has(cell)) continue;
    reachable.add(cell);
    const deps = dependents[cell] || new Set();
    for (const dep of deps) {
      if (!reachable.has(dep)) queue.push(dep);
    }
  }

  // 2. Compute in-degrees for the reachable subgraph
  // In-degree here means: how many dependencies does this cell have THAT ARE ALSO IN THE REACHABLE SUBGRAPH?
  const inDegree = {};
  for (const cell of reachable) {
    inDegree[cell] = 0;
  }
  
  for (const cell of reachable) {
    const deps = dependencies[cell] || new Set();
    for (const dep of deps) {
      if (reachable.has(dep)) {
        inDegree[cell]++;
      }
    }
  }

  // 3. Kahn's Algorithm
  const order = [];
  const zeroInDegreeQueue = [];
  
  // Find initial nodes with 0 in-degree (should be changedCell)
  for (const cell of reachable) {
    if (inDegree[cell] === 0) {
      zeroInDegreeQueue.push(cell);
    }
  }

  while (zeroInDegreeQueue.length > 0) {
    const curr = zeroInDegreeQueue.shift();
    if (curr !== changedCell) {
      order.push(curr);
    }
    
    const deps = dependents[curr] || new Set();
    for (const dep of deps) {
      if (reachable.has(dep)) {
        inDegree[dep]--;
        if (inDegree[dep] === 0) {
          zeroInDegreeQueue.push(dep);
        }
      }
    }
  }

  return order;
}

/**
 * Find ALL cells that are part of a cycle involving `startCell`.
 * Returns a Set of cell IDs involved in the cycle.
 */
export function findCyclicCells(startCell, graph) {
  const { dependents, dependencies } = graph;
  const cyclic = new Set();

  // A cell is cyclic if there's a path from it back to itself
  function hasCycle(cell) {
    const visited = new Set();
    function dfs(cur) {
      if (cur === cell) return true;
      if (visited.has(cur)) return false;
      visited.add(cur);
      const deps = dependencies[cur] || new Set();
      for (const dep of deps) {
        if (dfs(dep)) return true;
      }
      return false;
    }
    const deps = dependencies[cell] || new Set();
    for (const dep of deps) {
      visited.clear();
      if (dep === cell || dfs(dep)) return true;
    }
    return false;
  }

  // Check startCell and all its transitive dependents
  const toCheck = new Set();
  const queue = [startCell];
  while (queue.length > 0) {
    const cur = queue.shift();
    if (toCheck.has(cur)) continue;
    toCheck.add(cur);
    const deps = dependents[cur] || new Set();
    for (const d of deps) {
      if (!toCheck.has(d)) queue.push(d);
    }
  }

  for (const cell of toCheck) {
    if (hasCycle(cell)) cyclic.add(cell);
  }
  return cyclic;
}

/**
 * Create an empty graph object.
 */
export function createGraph() {
  return { dependents: {}, dependencies: {} };
}
