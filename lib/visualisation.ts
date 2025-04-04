import Graph from "graphology";
import { ForceLayoutSettings } from "graphology-layout-force";
import ForceSupervisor from "graphology-layout-force/worker";
import { NodeSquareProgram } from "@sigma/node-square";
import Sigma from "sigma";
import {
  Attribute,
  AttributeType, EdgeKind,
  Entity,
  EntityType, ObjectAny, ObjectType,
  Relation,
  RelationType,
  RoleType,
  ThingKind,
  TypeKind
} from "./concept.js";
import {LogicalEdge, LogicalGraph, LogicalVertex, VertexUnavailable} from "./graph.js";

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



/////////////////////////////////
// Logical Graph -> Graphology //
/////////////////////////////////

/**
 * You will majorly need:
 *  graph.addNode(id, attributes)
 *  graph.addNode(from, to,  attributes)
 * See: https://www.sigmajs.org/docs/advanced/data/ for attributes
 */
export interface ITypeDBToGraphology {
  // TODO: Functional vertices & edges like expressions, comparisons & function calls

  // Vertices
  put_attribute(graph: Graph, answer_index: number, vertex: Attribute): void;

  put_entity(graph: Graph, answer_index: number, vertex: Entity): void;

  put_relation(graph: Graph, answer_index: number, vertex: Relation): void;

  put_attribute_type(graph: Graph, answer_index: number, vertex: AttributeType): void;

  put_entity_type(graph: Graph, answer_index: number, vertex: EntityType): void;

  put_relation_type(graph: Graph, answer_index: number, vertex: RelationType): void;

  put_role_type_for_type_constraint(graph: Graph, answer_index: number, vertex: RoleType): void;


  // Edges
  put_isa(graph: Graph, answer_index: number, constraint_index: number, thing: Entity | Relation | Attribute, type: EntityType | RelationType | AttributeType): void;

  put_has(graph: Graph, answer_index: number, constraint_index: number, owner: Entity | Relation, attribute: Attribute): void;

  put_links(graph: Graph, answer_index: number, constraint_index: number, relation: Relation, player: Entity | Relation, role: RoleType | VertexUnavailable): void;

  put_sub(graph: Graph, answer_index: number, constraint_index: number, subtype: EntityType | RelationType | AttributeType, supertype: EntityType | RelationType | AttributeType): void;

  put_owns(graph: Graph, answer_index: number, constraint_index: number, owner: EntityType | RelationType, attribute: AttributeType): void;

  put_relates(graph: Graph, answer_index: number, constraint_index: number, relation: RelationType, role: RoleType | VertexUnavailable): void;

  put_plays(graph: Graph, answer_index: number, constraint_index: number, player: EntityType | RelationType, role: RoleType | VertexUnavailable): void;

  put_isa_exact(graph: Graph, answer_index: number, constraint_index: number, thing: Entity | Relation | Attribute, type: EntityType | RelationType | AttributeType): void;

  put_sub_exact(graph: Graph, answer_index: number, constraint_index: number, subtype: EntityType | RelationType | AttributeType, supertype: EntityType | RelationType | AttributeType): void;
}

export function drawLogicalGraphWith(context: VisualisationContext, logicalGraph: LogicalGraph, converter: ITypeDBToGraphology): Graph {
  let graph = context.graph;
  graph.clear();
  logicalGraph.vertices.forEach((vertex, key) => {
    putVertex(graph, converter, vertex);
  });
  let answer_index = 0;
  logicalGraph.edges.forEach(edgeList => {
    let constraint_index = 0;
    edgeList.forEach(edge => {
      putEdge(graph, converter, answer_index, constraint_index, edge, logicalGraph);
      constraint_index += 1;
    });
    answer_index += 1;
  });
  return graph;
};

function putVertex(graph: Graph, converter: ITypeDBToGraphology, vertex: LogicalVertex) {
  switch (vertex.kind) {
    case ThingKind.entity: {
      converter.put_entity(graph, 0, vertex as Entity);
      break;
    }
    case ThingKind.attribute : {
      converter.put_attribute(graph, 0, vertex as Attribute);
      break;
    }
    case ThingKind.relation : {
      converter.put_relation(graph, 0, vertex as Relation);
      break;
    }
    case TypeKind.attributeType : {
      converter.put_attribute_type(graph, 0, vertex as AttributeType);
      break;
    }
    case  TypeKind.entityType : {
      converter.put_entity_type(graph, 0, vertex as EntityType);
      break;
    }
    case TypeKind.relationType : {
      converter.put_relation_type(graph, 0, vertex as RelationType);
      break;
    }
    case TypeKind.roleType : {
      converter.put_role_type_for_type_constraint(graph, 0, vertex as RoleType);
      break;
    }
    default : {
      console.log("VertedKind not yet supported: ");
      console.log(vertex.kind);
    }
  }
}

function putEdge(graph: Graph, converter: ITypeDBToGraphology, answer_index: number, constraint_index: number, edge: LogicalEdge, logicalGraph: LogicalGraph) {
  let from = logicalGraph.vertices.get(edge.from);
  let to = logicalGraph.vertices.get(edge.to);
  let edgeParam = edge.type.param;
  switch (edge.type.kind) {
    case EdgeKind.isa:{
      converter.put_isa(graph, answer_index, constraint_index, from as ObjectAny | Attribute, to as ObjectType | AttributeType);
      break;
    }
    case EdgeKind.has: {
      converter.put_has(graph, answer_index, constraint_index, from as ObjectAny, to as Attribute);
      break;
    }
    case EdgeKind.links : {
      converter.put_links(graph, answer_index, constraint_index, from as Relation, to as ObjectAny, edgeParam as RoleType | VertexUnavailable);
      break;
    }

    case EdgeKind.sub: {
      converter.put_sub(graph, answer_index, constraint_index, from as ObjectType | AttributeType, to as ObjectType | AttributeType);
      break;
    }
    case EdgeKind.owns: {
      converter.put_owns(graph, answer_index, constraint_index, from as ObjectType, to as AttributeType);
      break;
    }
    case EdgeKind.relates: {
      converter.put_relates(graph, answer_index, constraint_index, from as RelationType, to as RoleType | VertexUnavailable);
      break;
    }
    case EdgeKind.plays: {
      converter.put_plays(graph, answer_index, constraint_index, from as EntityType | RelationType, to as RoleType | VertexUnavailable);
      break;
    }
    case EdgeKind.isaExact: {
      converter.put_isa_exact(graph, answer_index, constraint_index, from as ObjectAny | Attribute, to as ObjectType | AttributeType);
      break;
    }
    case EdgeKind.subExact: {
      converter.put_sub_exact(graph, answer_index, constraint_index, from as ObjectType, to as ObjectType);
      break;
    }

    default : {
      throw new Error();
    }
  }
}
