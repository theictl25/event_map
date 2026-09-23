import { getMapLayout } from "../shared/map-layout.js";

/*
 * Route planning uses the walkway rectangles drawn by Map Builder.
 *
 * Each walkway becomes a centre line: horizontal for wide rectangles and
 * vertical for tall rectangles. Intersections and touching endpoints become
 * graph nodes. Dijkstra then finds the shortest connected walkway route.
 *
 * The first/last short segment connects the entrance and booth to their
 * closest walkway. This means old maps still work even if a doorway or booth
 * is not placed directly on top of a walkway.
 */

function point(x, y) {
  return { x, y };
}

function distance(first, second) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function samePoint(first, second) {
  return (
    Math.abs(first.x - second.x) < 0.1 && Math.abs(first.y - second.y) < 0.1
  );
}

function elementCenter(element) {
  return point(element.x + element.width / 2, element.y + element.height / 2);
}

function walkwaySegment(walkway, index) {
  const horizontal = walkway.width >= walkway.height;
  const middle = elementCenter(walkway);

  return horizontal
    ? {
        id: "walkway-" + index,
        horizontal: true,
        start: point(walkway.x, middle.y),
        end: point(walkway.x + walkway.width, middle.y),
        nodes: [],
      }
    : {
        id: "walkway-" + index,
        horizontal: false,
        start: point(middle.x, walkway.y),
        end: point(middle.x, walkway.y + walkway.height),
        nodes: [],
      };
}

function inRange(value, first, second) {
  return (
    value >= Math.min(first, second) - 0.1 &&
    value <= Math.max(first, second) + 0.1
  );
}

function projectOntoSegment(location, segment) {
  if (segment.horizontal) {
    return point(
      Math.max(segment.start.x, Math.min(segment.end.x, location.x)),
      segment.start.y,
    );
  }

  return point(
    segment.start.x,
    Math.max(segment.start.y, Math.min(segment.end.y, location.y)),
  );
}

function segmentIntersection(first, second) {
  if (first.horizontal !== second.horizontal) {
    const horizontal = first.horizontal ? first : second;
    const vertical = first.horizontal ? second : first;
    const intersection = point(vertical.start.x, horizontal.start.y);

    return inRange(intersection.x, horizontal.start.x, horizontal.end.x) &&
      inRange(intersection.y, vertical.start.y, vertical.end.y)
      ? intersection
      : null;
  }

  // Parallel walkways form a connection only when their centre lines meet.
  // This avoids treating nearby-but-separate paths as connected.
  if (first.horizontal && Math.abs(first.start.y - second.start.y) < 0.1) {
    const left = Math.max(
      Math.min(first.start.x, first.end.x),
      Math.min(second.start.x, second.end.x),
    );
    const right = Math.min(
      Math.max(first.start.x, first.end.x),
      Math.max(second.start.x, second.end.x),
    );
    return left <= right ? point((left + right) / 2, first.start.y) : null;
  }

  if (!first.horizontal && Math.abs(first.start.x - second.start.x) < 0.1) {
    const top = Math.max(
      Math.min(first.start.y, first.end.y),
      Math.min(second.start.y, second.end.y),
    );
    const bottom = Math.min(
      Math.max(first.start.y, first.end.y),
      Math.max(second.start.y, second.end.y),
    );
    return top <= bottom ? point(first.start.x, (top + bottom) / 2) : null;
  }

  return null;
}

function addSegmentNode(segment, location) {
  if (!segment.nodes.some((node) => samePoint(node, location))) {
    segment.nodes.push(location);
  }
}

function connect(graph, first, second) {
  const firstId = graph.addNode(first);
  const secondId = graph.addNode(second);
  const length = distance(first, second);

  graph.edges.get(firstId).push({ id: secondId, length });
  graph.edges.get(secondId).push({ id: firstId, length });
  return { firstId, secondId };
}

function createGraph(segments) {
  const nodes = [];
  const edges = new Map();

  const graph = {
    addNode(location) {
      const existing = nodes.findIndex((node) => samePoint(node, location));
      if (existing >= 0) return existing;
      nodes.push(location);
      edges.set(nodes.length - 1, []);
      return nodes.length - 1;
    },
    nodes,
    edges,
  };

  segments.forEach((segment) => {
    addSegmentNode(segment, segment.start);
    addSegmentNode(segment, segment.end);
  });

  for (let firstIndex = 0; firstIndex < segments.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < segments.length;
      secondIndex += 1
    ) {
      const intersection = segmentIntersection(
        segments[firstIndex],
        segments[secondIndex],
      );
      if (!intersection) continue;
      addSegmentNode(segments[firstIndex], intersection);
      addSegmentNode(segments[secondIndex], intersection);
    }
  }

  segments.forEach((segment) => {
    segment.nodes.sort((first, second) =>
      segment.horizontal ? first.x - second.x : first.y - second.y,
    );

    for (let index = 1; index < segment.nodes.length; index += 1) {
      connect(graph, segment.nodes[index - 1], segment.nodes[index]);
    }
  });

  return graph;
}

function nearestWalkwayPoint(location, segments) {
  let nearest = null;

  segments.forEach((segment) => {
    const projected = projectOntoSegment(location, segment);
    const length = distance(location, projected);

    if (!nearest || length < nearest.length) {
      nearest = { segment, point: projected, length };
    }
  });

  return nearest;
}

function shortestPath(graph, startId, targetId) {
  const distances = new Map([[startId, 0]]);
  const previous = new Map();
  const queue = new Set(graph.nodes.map((_, index) => index));

  while (queue.size) {
    let currentId = null;
    queue.forEach((nodeId) => {
      if (
        currentId === null ||
        (distances.get(nodeId) ?? Infinity) <
          (distances.get(currentId) ?? Infinity)
      ) {
        currentId = nodeId;
      }
    });

    if (currentId === null || !Number.isFinite(distances.get(currentId))) break;
    queue.delete(currentId);
    if (currentId === targetId) break;

    graph.edges.get(currentId).forEach((edge) => {
      if (!queue.has(edge.id)) return;
      const nextDistance = distances.get(currentId) + edge.length;
      if (nextDistance < (distances.get(edge.id) ?? Infinity)) {
        distances.set(edge.id, nextDistance);
        previous.set(edge.id, currentId);
      }
    });
  }

  if (!distances.has(targetId)) return null;

  const path = [];
  for (
    let nodeId = targetId;
    nodeId !== undefined;
    nodeId = previous.get(nodeId)
  ) {
    path.unshift(graph.nodes[nodeId]);
  }

  return { points: path, length: distances.get(targetId) };
}

function directFallback(entrances, booth) {
  const target = elementCenter(booth);

  return (
    entrances
      .map((entrance, index) => {
        const start = elementCenter(entrance);
        const bend = point(start.x, target.y);
        const points = [start, bend, target];
        const length = distance(start, bend) + distance(bend, target);
        return { entrance: index + 1, points, length, followsWalkway: false };
      })
      .sort((first, second) => first.length - second.length)[0] || null
  );
}

/**
 * Finds a route from the nearest entrance to a booth.
 *
 * @returns {{entrance: number, points: Array<{x:number,y:number}>, length:number, followsWalkway:boolean}|null}
 */
export function findRouteToBooth(booth) {
  const layout = getMapLayout();
  const entrances = layout.elements.filter(
    (element) => element.type === "entrance",
  );
  const walkways = layout.elements.filter(
    (element) => element.type === "walkway",
  );

  if (!entrances.length) return null;
  if (!walkways.length) return directFallback(entrances, booth);

  const segments = walkways.map(walkwaySegment);
  const target = elementCenter(booth);
  const targetConnection = nearestWalkwayPoint(target, segments);
  addSegmentNode(targetConnection.segment, targetConnection.point);

  const candidates = entrances
    .map((entrance, index) => {
      const start = elementCenter(entrance);
      const entranceConnection = nearestWalkwayPoint(start, segments);
      addSegmentNode(entranceConnection.segment, entranceConnection.point);

      // Nodes added after graph creation need to be linked by rebuilding the
      // small walkway graph. This keeps the algorithm simple and predictable.
      const routeGraph = createGraph(segments);
      const routeStartId = routeGraph.addNode(entranceConnection.point);
      const routeTargetId = routeGraph.addNode(targetConnection.point);
      const route = shortestPath(routeGraph, routeStartId, routeTargetId);

      if (!route) return null;

      const points = [start, ...route.points, target].filter(
        (location, pointIndex, all) =>
          pointIndex === 0 || !samePoint(location, all[pointIndex - 1]),
      );

      return {
        entrance: index + 1,
        points,
        length:
          entranceConnection.length + route.length + targetConnection.length,
        followsWalkway: true,
      };
    })
    .filter(Boolean);

  return (
    candidates.sort((first, second) => first.length - second.length)[0] ||
    directFallback(entrances, booth)
  );
}
