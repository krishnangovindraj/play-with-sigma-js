import Graph from "graphology";
import Sigma from "sigma";
import {Settings as SigmaSettings} from "sigma/settings";
import {
  Attribute,
  AttributeType, ConceptAny, EdgeKind,
  Entity,
  EntityType, ObjectAny, ObjectType,
  Relation,
  RelationType,
  RoleType,
  ThingKind,
  TypeKind,
} from "./typedb/concept";
import {LogicalEdge, LogicalGraph, LogicalVertex, StructureEdgeCoordinates, VertexUnavailable} from "./graph";

export function createSigmaRenderer(containerId: string, sigma_settings: SigmaSettings, graph: Graph) : Sigma {
  // Retrieve the html document for sigma container
  let container = document.getElementById(containerId) as HTMLElement;

  // Create the sigma
  let renderer = new Sigma(
      graph,
      container,
      sigma_settings,
  );

  // TODO: Move these out to an eventHandler interface of sorts
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

  return renderer;
  // return () => {
  //   renderer.kill();
  // };
}

/////////////////////////////////
// Logical Graph -> Graphology //
/////////////////////////////////

/**
 * You will majorly need:
 *  graph.addNode(id, attributes)
 *  graph.addNode(from, to,  attributes)
 * See: https://www.sigmajs.org/docs/advanced/data/ for attributes
 */
export interface ILogicalGraphConverter {
  // TODO: Functional vertices & edges like expressions, comparisons & function calls

  // Vertices
  put_attribute(answer_index: number, structureEdgeCoordinates: StructureEdgeCoordinates, vertex: Attribute): void;

  put_entity(answer_index: number, structureEdgeCoordinates: StructureEdgeCoordinates, vertex: Entity): void;

  put_relation(answer_index: number, structureEdgeCoordinates: StructureEdgeCoordinates, vertex: Relation): void;

  put_attribute_type(answer_index: number, structureEdgeCoordinates: StructureEdgeCoordinates, vertex: AttributeType): void;

  put_entity_type(answer_index: number, structureEdgeCoordinates: StructureEdgeCoordinates, vertex: EntityType): void;

  put_relation_type(answer_index: number, structureEdgeCoordinates: StructureEdgeCoordinates, vertex: RelationType): void;

  put_role_type_for_type_constraint(answer_index: number, structureEdgeCoordinates: StructureEdgeCoordinates, vertex: RoleType): void;

  put_vertex_unvailable(answer_index: number, structureEdgeCoordinates: StructureEdgeCoordinates, vertex: VertexUnavailable): void;

  // Edges
  put_isa(answer_index: number, structureEdgeCoordinates: StructureEdgeCoordinates, thing: Entity | Relation | Attribute, type: EntityType | RelationType | AttributeType): void;

  put_has(answer_index: number, structureEdgeCoordinates: StructureEdgeCoordinates, owner: Entity | Relation, attribute: Attribute): void;

  put_links(answer_index: number, structureEdgeCoordinates: StructureEdgeCoordinates, relation: Relation, player: Entity | Relation, role: RoleType | VertexUnavailable): void;

  put_sub(answer_index: number, structureEdgeCoordinates: StructureEdgeCoordinates, subtype: EntityType | RelationType | AttributeType, supertype: EntityType | RelationType | AttributeType): void;

  put_owns(answer_index: number, structureEdgeCoordinates: StructureEdgeCoordinates, owner: EntityType | RelationType, attribute: AttributeType): void;

  put_relates(answer_index: number, structureEdgeCoordinates: StructureEdgeCoordinates, relation: RelationType, role: RoleType | VertexUnavailable): void;

  put_plays(answer_index: number, structureEdgeCoordinates: StructureEdgeCoordinates, player: EntityType | RelationType, role: RoleType | VertexUnavailable): void;

  put_isa_exact(answer_index: number, structureEdgeCoordinates: StructureEdgeCoordinates, thing: Entity | Relation | Attribute, type: EntityType | RelationType | AttributeType): void;

  put_sub_exact(answer_index: number, structureEdgeCoordinates: StructureEdgeCoordinates, subtype: EntityType | RelationType | AttributeType, supertype: EntityType | RelationType | AttributeType): void;
}

export function convertLogicalGraphWith(logicalGraph: LogicalGraph, converter: ILogicalGraphConverter) {
  logicalGraph.answers.forEach((edgeList, answerIndex) => {
    edgeList.forEach(edge => {
      putEdge(converter, answerIndex, edge.structureEdgeCoordinates, edge, logicalGraph);
    });
  });
}

function putVertex(converter: ILogicalGraphConverter, answer_index: number, structureEdgeCoordinates: StructureEdgeCoordinates, vertex: LogicalVertex) {
  switch (vertex.kind) {
    case ThingKind.entity: {
      converter.put_entity(answer_index, structureEdgeCoordinates, vertex as Entity);
      break;
    }
    case ThingKind.attribute : {
      converter.put_attribute(answer_index, structureEdgeCoordinates, vertex as Attribute);
      break;
    }
    case ThingKind.relation : {
      converter.put_relation(answer_index, structureEdgeCoordinates, vertex as Relation);
      break;
    }
    case TypeKind.attributeType : {
      converter.put_attribute_type(answer_index, structureEdgeCoordinates, vertex as AttributeType);
      break;
    }
    case  TypeKind.entityType : {
      converter.put_entity_type(answer_index, structureEdgeCoordinates, vertex as EntityType);
      break;
    }
    case TypeKind.relationType : {
      converter.put_relation_type(answer_index, structureEdgeCoordinates, vertex as RelationType);
      break;
    }
    case TypeKind.roleType : {
      converter.put_role_type_for_type_constraint(answer_index, structureEdgeCoordinates, vertex as RoleType);
      break;
    }
    case "unavailable" : {
      converter.put_vertex_unvailable(answer_index, structureEdgeCoordinates, vertex as VertexUnavailable);
      break;
    }
    default : {
      console.log("VertedKind not yet supported: " + vertex.kind);
    }
  }
}

function putEdge(converter: ILogicalGraphConverter, answer_index: number, structureEdgeCoordinates: StructureEdgeCoordinates, edge: LogicalEdge, logicalGraph: LogicalGraph) {
  let from = logicalGraph.vertices.get(edge.from);
  let to = logicalGraph.vertices.get(edge.to);
  let edgeParam = edge.type.param;
  // First put vertices, then the edge
  putVertex(converter, answer_index, structureEdgeCoordinates, from as ConceptAny);
  putVertex(converter, answer_index, structureEdgeCoordinates, to as ConceptAny);

  switch (edge.type.kind) {
    case EdgeKind.isa:{
      converter.put_isa(answer_index, structureEdgeCoordinates, from as ObjectAny | Attribute, to as ObjectType | AttributeType);
      break;
    }
    case EdgeKind.has: {
      converter.put_has(answer_index, structureEdgeCoordinates, from as ObjectAny, to as Attribute);
      break;
    }
    case EdgeKind.links : {
      converter.put_links(answer_index, structureEdgeCoordinates, from as Relation, to as ObjectAny, edgeParam as RoleType | VertexUnavailable);
      break;
    }

    case EdgeKind.sub: {
      converter.put_sub(answer_index, structureEdgeCoordinates, from as ObjectType | AttributeType, to as ObjectType | AttributeType);
      break;
    }
    case EdgeKind.owns: {
      converter.put_owns(answer_index, structureEdgeCoordinates, from as ObjectType, to as AttributeType);
      break;
    }
    case EdgeKind.relates: {
      converter.put_relates(answer_index, structureEdgeCoordinates, from as RelationType, to as RoleType | VertexUnavailable);
      break;
    }
    case EdgeKind.plays: {
      converter.put_plays(answer_index, structureEdgeCoordinates, from as EntityType | RelationType, to as RoleType | VertexUnavailable);
      break;
    }
    case EdgeKind.isaExact: {
      converter.put_isa_exact(answer_index, structureEdgeCoordinates, from as ObjectAny | Attribute, to as ObjectType | AttributeType);
      break;
    }
    case EdgeKind.subExact: {
      converter.put_sub_exact(answer_index, structureEdgeCoordinates, from as ObjectType, to as ObjectType);
      break;
    }

    default : {
      throw new Error();
    }
  }
}
