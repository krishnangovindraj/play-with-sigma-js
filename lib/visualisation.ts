import Graph from "graphology";
import { ForceLayoutSettings } from "graphology-layout-force";
import ForceSupervisor from "graphology-layout-force/worker";
import { NodeSquareProgram } from "@sigma/node-square";
import Sigma from "sigma";

export type VisualisationContext = {
  graph: Graph;
  layout: ForceSupervisor,
  renderer: Sigma,
};

// For ForceLayoutSettings, see: https://graphology.github.io/standard-library/layout-force.html
//   attraction ?number 0.0005: importance of the attraction force, that attracts each pair of connected nodes like elastics.
//   repulsion ?number 0.1: importance of the repulsion force, that attracts each pair of nodes like magnets.
//   gravity ?number 0.0001: importance of the gravity force, that attracts all nodes to the center.
//   inertia ?number 0.6: percentage of a node vector displacement that is preserved at each step. 0 means no inertia, 1 means no friction.
//   maxMove ?number 200: Maximum length a node can travel at each step, in pixel.
export function createVisualisationContext(container_id: string, force_supervisor_settings: ForceLayoutSettings | undefined) : VisualisationContext {
  // Retrieve the html document for sigma container
  let graph = new Graph();
  let container = document.getElementById(container_id) as HTMLElement;

  // Create the spring layout and start it
  let layout = new ForceSupervisor(graph, { isNodeFixed: (_, attr) => attr.highlighted, settings: force_supervisor_settings });
  layout.start();

  // Create the sigma
  let settings = {
      minCameraRatio: 0.1,
      maxCameraRatio: 10,
      renderEdgeLabels: true,
      nodeProgramClasses: {
          square: NodeSquareProgram,
      }
  };
  let renderer = new Sigma(
      graph,
      container,
      settings,
  );

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
