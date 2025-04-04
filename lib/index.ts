import chroma, {Color} from "chroma-js";
import Graph from "graphology";
import {
  createVisualisationContext,
  drawLogicalGraphWith,
  ITypeDBToGraphology,
  VisualisationContext
} from "./visualisation";
import {
  Attribute, AttributeType,
  EdgeKind,
  Entity, EntityType, ObjectAny,
  ObjectType,
  Relation, RelationType,
  RoleType,
  ThingKind,
  TypeKind,
  UnavailableKind
} from "./concept";
import {constructGraphFromRowsResult, LogicalVertexKind, LogicalVertex, VertexUnavailable, LogicalEdge} from "./graph";
import {connectToTypeDB} from "./communication";
import * as graphology_types from "graphology-types";

/////////////
// EXPORTS //
/////////////
window.createVisualisationContext = createVisualisationContext;
window.constructGraphFromRowsResult = constructGraphFromRowsResult;

///////////////////////////////////////
// Temporary functions to play with  //
///////////////////////////////////////

interface DefaultConverterParameters {
  vertex_colors: Record<LogicalVertexKind, Color>,
  vertex_shapes: Record<LogicalVertexKind, string>,
  vertex_size: number,

  edge_color: Color,
  edge_size: number

  vertex_label: (vertex: LogicalVertex) => string;
  links_edge_label: (role: RoleType | VertexUnavailable) => string;
}

export class DefaultConverter implements ITypeDBToGraphology {
  parameters: DefaultConverterParameters;
  static defaultParameters: DefaultConverterParameters;
  
  constructor(parameters: DefaultConverterParameters) {
    this.parameters = parameters;
  }

  vertexAttributes(vertex: LogicalVertex): any {
    // Extend as you please: https://www.sigmajs.org/docs/advanced/data/
    let color = this.parameters.vertex_colors[vertex.kind];
    let shape = this.parameters.vertex_shapes[vertex.kind];
    return {
      label: this.parameters.vertex_label(vertex),
      color: color.hex(),
      size: this.parameters.vertex_size,
      type: shape,
      x: Math.random(),
      y: Math.random()
    }
  }

  edgeAttributes(label: string): any {
    // Extend as you please: https://www.sigmajs.org/docs/advanced/data/
    let color = this.parameters.edge_color;
    return {
      label: label,
      color: color.hex(),
      size: this.parameters.edge_size,
      type: "arrow",
    }
  }

  edgeKey(from_id: string, to_id: string, edge_type_id: string) : string {
    return from_id + ":" + to_id + ":" + edge_type_id;
  }

  addNode(graph: Graph, key: string, attributes: any) {
    graph.addNode(key, attributes);
  }

  mayAddEdge(graph:Graph, from: string, to:string, edge_type:string, attributes: any) {
    let key = this.edgeKey(from, to, edge_type);
    if (!graph.hasDirectedEdge(key)) {
        graph.addDirectedEdgeWithKey(key, from, to, attributes)
    }
  }

  // ITypeDBToGraphology
  // Vertices
  put_attribute(graph: Graph, answer_index: number, vertex: Attribute): void {
    this.addNode(graph, vertex.iid, this.vertexAttributes(vertex))
  }

  put_entity(graph: Graph, answer_index:number, vertex: Entity): void {
    this.addNode(graph, vertex.iid, this.vertexAttributes(vertex))
  }

  put_relation(graph: Graph, answer_index:number, vertex: Relation): void {
    this.addNode(graph, vertex.iid, this.vertexAttributes(vertex))
  }
  put_attribute_type(graph: Graph, answer_index: number, vertex: AttributeType): void {
    this.addNode(graph, vertex.label, this.vertexAttributes(vertex))
  }
  put_entity_type(graph: Graph, answer_index: number, vertex: EntityType): void {
    this.addNode(graph, vertex.label, this.vertexAttributes(vertex))
  }
  put_relation_type(graph: Graph, answer_index: number, vertex: RelationType): void {
    this.addNode(graph, vertex.label, this.vertexAttributes(vertex))
  }

  put_role_type_for_type_constraint(graph: Graph, answer_index: number, vertex: RoleType): void {
    let label = vertex.label;
    graph.addNode(vertex.label, { label: label, color: chroma('darkorange').alpha(0.5).hex(), size: 5, x: Math.random(), y: Math.random() });
  }

  // Edges
  put_isa(graph: Graph, answer_index: number, constraint_index: number, thing: Attribute | ObjectAny, type: AttributeType | ObjectType): void {
    this.mayAddEdge(graph, thing.iid, type.label, EdgeKind.isa, this.edgeAttributes(EdgeKind.isa));
  }

  put_has(graph: Graph,  answer_index:number, constraint_index: number, owner: Entity | Relation, attribute: Attribute): void {
    this.mayAddEdge(graph, owner.iid, attribute.iid, EdgeKind.has, this.edgeAttributes(EdgeKind.has));
  }

  put_links(graph: Graph,  answer_index:number, constraint_index: number, relation: Relation, player: Entity | Relation, role: RoleType | VertexUnavailable): void {
    let role_label = (role.kind == TypeKind.roleType) ? (role as RoleType).label : ("links_[" + constraint_index + "]");
    this.mayAddEdge(graph, relation.iid, player.iid, role_label, this.edgeAttributes(role_label));
  }

  put_sub(graph: Graph, answer_index: number, constraint_index: number, subtype: AttributeType | ObjectType, supertype: AttributeType | ObjectType): void {
    this.mayAddEdge(graph, subtype.label, supertype.label, EdgeKind.sub, this.edgeAttributes(EdgeKind.sub));
  }

  put_owns(graph: Graph, answer_index: number, constraint_index: number, owner: ObjectType, attribute: AttributeType): void {
    this.mayAddEdge(graph, owner.label, attribute.label, EdgeKind.sub, this.edgeAttributes(EdgeKind.owns));
  }

  put_relates(graph: Graph, answer_index: number, constraint_index: number, relation: RelationType, role: RoleType): void {
    this.mayAddEdge(graph, relation.label, role.label, EdgeKind.relates, this.edgeAttributes(EdgeKind.relates));
  }

  put_plays(graph: Graph, answer_index: number, constraint_index: number, player: EntityType | RelationType, role: RoleType): void {
    this.mayAddEdge(graph, player.label, role.label, EdgeKind.plays, this.edgeAttributes(EdgeKind.plays));
  }

  put_isa_exact(graph: Graph, answer_index: number, constraint_index: number, thing: Attribute | ObjectAny, type: AttributeType | ObjectType): void {
    this.mayAddEdge(graph, thing.iid, type.label, EdgeKind.isaExact, this.edgeAttributes(EdgeKind.isaExact));
  }

  put_sub_exact(graph: Graph, answer_index: number, constraint_index: number, subtype: AttributeType | ObjectType, supertype: AttributeType | ObjectType): void {
    this.mayAddEdge(graph, subtype.label, supertype.label, EdgeKind.subExact, this.edgeAttributes(EdgeKind.subExact));
  }
}

DefaultConverter.defaultParameters = {
  vertex_colors: {
    [ThingKind.entity]: chroma("pink"),
    [ThingKind.relation]: chroma("yellow"),
    [ThingKind.attribute]: chroma("green"),
    [TypeKind.entityType]: chroma("magenta"),
    [TypeKind.relationType]: chroma("orange"),
    [TypeKind.attributeType]: chroma("darkgreen"),
    [TypeKind.roleType]: chroma("darkorange"),
    value: chroma("grey"),
    unavailable: chroma("darkgrey"),
  },
  vertex_shapes: {
    [ThingKind.entity]: "circle",
    [ThingKind.relation]: "square",
    [ThingKind.attribute]: "circle",
    [TypeKind.entityType]: "circle",
    [TypeKind.relationType]: "square",
    [TypeKind.attributeType]: "circle",
    [TypeKind.roleType]: "circle",
    value: "circle",
    unavailable: "circle",
  },
  vertex_size: 10,

  edge_color: chroma("grey"),
  edge_size: 4,

  vertex_label(vertex: LogicalVertex): string {
    switch (vertex.kind) {
      case TypeKind.entityType:
      case TypeKind.relationType:
      case TypeKind.roleType:
      case TypeKind.attributeType: {
        return vertex.label;
      }

      case ThingKind.entity:
      case ThingKind.relation:{
        return vertex.type.label + ":" + vertex.iid;
      }
      case ThingKind.attribute: {
        return vertex.type.label + ":" + vertex.value;
      }
      case "value": {
        return vertex.value;
      }
      case "unavailable": {
        return "?";
      }
    }
  },

  links_edge_label(role: RoleType | VertexUnavailable): string {
    return this.vertex_label(role);
  }
};

window.DefaultConverter = DefaultConverter;
window.drawLogicalGraphWith = drawLogicalGraphWith;
window.connectToTypeDB = connectToTypeDB;
