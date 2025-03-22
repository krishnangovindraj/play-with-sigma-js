import chroma from "chroma-js";
import Graph from "graphology";
import ForceSupervisor from "graphology-layout-force/worker";
import Sigma from "sigma";
import { v4 as uuid } from "uuid";


type VisualisationContext = {
  graph: Graph;
  layout: ForceSupervisor,
  renderer: Sigma,
};

export function getGraph() : Graph {
    const graph = new Graph();
    graph.addNode("n1", { x: 0, y: 0, size: 10, color: chroma.random().hex() });
    graph.addNode("n2", { x: -5, y: 5, size: 10, color: chroma.random().hex() });
    graph.addNode("n3", { x: 5, y: 5, size: 10, color: chroma.random().hex() });
    graph.addNode("n4", { x: 0, y: 10, size: 10, color: chroma.random().hex() });
    graph.addEdge("n1", "n2");
    graph.addEdge("n2", "n4");
    graph.addEdge("n4", "n3");
    graph.addEdge("n3", "n1");
    return graph;
};

export function drawGraphOn(graph: Graph, container_id: string) : VisualisationContext {
  // Retrieve the html document for sigma container
  let container = document.getElementById(container_id) as HTMLElement;

  // Create the spring layout and start it
  let layout = new ForceSupervisor(graph, { isNodeFixed: (_, attr) => attr.highlighted });
  layout.start();

  // Create the sigma
  let renderer = new Sigma(graph, container, { minCameraRatio: 0.5, maxCameraRatio: 2 });

  //
  // Drag'n'drop feature
  // ~~~~~~~~~~~~~~~~~~~
  //

  // State for drag'n'drop
  let draggedNode : string | null = null;
  let isDragging = false;

  // On mouse down on a node
  //  - we enable the drag mode
  //  - save in the dragged node in the state
  //  - highlight the node
  //  - disable the camera so its state is not updated
  renderer.on("downNode", (e) => {
    isDragging = true;
    draggedNode = e.node;
    graph.setNodeAttribute(draggedNode, "highlighted", true);
    if (!renderer.getCustomBBox()) renderer.setCustomBBox(renderer.getBBox());
  });

  // On mouse move, if the drag mode is enabled, we change the position of the draggedNode
  renderer.on("moveBody", ({ event }) => {
    if (!isDragging || !draggedNode) return;

    // Get new position of node
    const pos = renderer.viewportToGraph(event);

    graph.setNodeAttribute(draggedNode, "x", pos.x);
    graph.setNodeAttribute(draggedNode, "y", pos.y);

    // Prevent sigma to move camera:
    event.preventSigmaDefault();
    event.original.preventDefault();
    event.original.stopPropagation();
  });

  // On mouse up, we reset the dragging mode
  const handleUp = () => {
    if (draggedNode) {
      graph.removeNodeAttribute(draggedNode, "highlighted");
    }
    isDragging = false;
    draggedNode = null;
  };
  renderer.on("upNode", handleUp);
  renderer.on("upStage", handleUp);
  
return {
  layout, renderer,  graph, 
};

  // return () => {
  //   renderer.kill();
  // };
};

window.drawGraphOn = drawGraphOn;
window.getGraph = getGraph;