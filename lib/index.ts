import chroma from "chroma-js";
import Graph from "graphology";
import {createVisualisationContext, VisualisationContext} from "./visualisation";
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
import {constructGraphFromRowsResult, LogicalGraph, LogicalVertex, VertexUnavailable} from "./graph";
import {connectToTypeDB} from "./communication";
import * as graphology_types from "graphology-types";

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
  });
  let answer_index = 0;
  logicalGraph.edges.forEach(edgeList => {
    let constraint_index = 0;
    edgeList.forEach(edge => {
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
      constraint_index += 1;
    });
    answer_index += 1;
  });
  return graph;
};


/////////////
// EXPORTS //
/////////////
window.createVisualisationContext = createVisualisationContext;
window.constructGraphFromRowsResult = constructGraphFromRowsResult;

///////////////////////////////////////
// Temporary functions to play with  //
///////////////////////////////////////

// Extend as you please: https://www.sigmajs.org/docs/advanced/data/
export type VertexStyleParameters = { color: string, size: number, type: string };
export type EdgeStyleParameters = { color: string, size: number, type: string, label: string };

// interface DefaultConverterParameters {
//   entityStyle: VertexStyleParameters;
//   attributeStyle: VertexStyleParameters;
//   relationStyle: VertexStyleParameters;
//   entityTypeStyle: VertexStyleParameters;
//   attributeTypeStyle: VertexStyleParameters;
//   relationTypeStyle: VertexStyleParameters;
//   roleTypeStyle: VertexStyleParameters;

//   isaStyle: EdgeStyleParameters;
//   hasStyle: EdgeStyleParameters;
//   linksStyle: EdgeStyleParameters;
//   subStyle: EdgeStyleParameters;
//   ownsStyle: EdgeStyleParameters;
//   relatesStyle: EdgeStyleParameters;
//   playsStyle: EdgeStyleParameters;
//   isaExactStyle: EdgeStyleParameters;
//   subExactStyle: EdgeStyleParameters;

//   vertex_key(answer_index:number, vertex: LogicalVertex): string;
//   simple_edge_key(answer_index:number, constraint_index: number, from: LogicalVertex, to: LogicalVertex, edge_type: EdgeKind): string;
//   simple_edge_label(answer_index:number, constraint_index: number, from: LogicalVertex, to: LogicalVertex, edge_type: EdgeKind): string;
// }

export class DefaultConverter implements ITypeDBToGraphology {
  // parameters: DefaultConverterParameters;
  
  // constructor(parameters: DefaultConverterParameters) {
  //   this.parameters = parameters;
  // }

  // Vertices
  put_attribute(graph: Graph, answer_index:number, vertex: Attribute): void {
    let label = vertex.type.label + ":" + vertex.value;
    graph.addNode(vertex.iid, { label: label, color: chroma('green').hex(), size: 10, x: Math.random(), y: Math.random() });
  }

  put_entity(graph: Graph, answer_index:number, vertex: Entity): void {
    let label = vertex.type.label + ":" + vertex.iid;
    graph.addNode(vertex.iid, { label: label, color: chroma('pink').hex(), size: 10, x: Math.random(), y: Math.random() });
  }

  put_relation(graph: Graph, answer_index:number, vertex: Relation): void {
    let label = vertex.type.label + ":" + vertex.iid;
    graph.addNode(vertex.iid, { label: label, color: chroma('yellow').hex(), size: 10, x: Math.random(), y: Math.random(), type: "square" });
  }
  put_attribute_type(graph: Graph, answer_index: number, vertex: AttributeType): void {
    let label = vertex.label;
    graph.addNode(vertex.label, { label: label, color: chroma('darkgreen').alpha(0.5).hex(), size: 10, x: Math.random(), y: Math.random() });
  }
  put_entity_type(graph: Graph, answer_index: number, vertex: EntityType): void {
    let label = vertex.label;
    graph.addNode(vertex.label, { label: label, color: chroma('magenta').alpha(0.5).hex(), size: 10, x: Math.random(), y: Math.random(), type: "square" });
  }
  put_relation_type(graph: Graph, answer_index: number, vertex: RelationType): void {
    let label = vertex.label;
    graph.addNode(vertex.label, { label: label, color: chroma('orange').alpha(0.5).hex(), size: 10, x: Math.random(), y: Math.random(), type: "square" });
  }
  put_role_type_for_type_constraint(graph: Graph, answer_index: number, vertex: RoleType): void {
    let label = vertex.label;
    graph.addNode(vertex.label, { label: label, color: chroma('darkorange').alpha(0.5).hex(), size: 5, x: Math.random(), y: Math.random() });
  }

  // Edges
  put_isa(graph: Graph, answer_index: number, constraint_index: number, thing: Attribute | ObjectAny, type: AttributeType | ObjectType): void {
    let edge_key = (answer_index + ":" + constraint_index);
    graph.addDirectedEdgeWithKey(edge_key, thing.iid, type.label, { label: "isa", type: "arrow", size: 4 });
  }

  put_has(graph: Graph,  answer_index:number, constraint_index: number, owner: Entity | Relation, attribute: Attribute): void {
    let edge_key = (answer_index + ":" + constraint_index);
    graph.addDirectedEdgeWithKey(edge_key, owner.iid, attribute.iid, { label: "has", type: "arrow", size: 4 });
  }

  put_links(graph: Graph,  answer_index:number, constraint_index: number, relation: Relation, player: Entity | Relation, role: RoleType | VertexUnavailable): void {
    let edge_key = (answer_index + ":" + constraint_index);
    let label = (role.kind == TypeKind.roleType) ? (role as RoleType).label : null;
    graph.addDirectedEdgeWithKey(edge_key, relation.iid, player.iid, { label: label, type: "arrow", size: 10 });
  }

  put_sub(graph: Graph, answer_index: number, constraint_index: number, subtype: AttributeType | ObjectType, supertype: AttributeType | ObjectType): void {
    let edge_key = (answer_index + ":" + constraint_index);
    graph.addDirectedEdgeWithKey(edge_key, subtype.label, supertype.label, { label: "sub", type: "arrow", size: 4 });
  }

  put_owns(graph: Graph, answer_index: number, constraint_index: number, owner: ObjectType, attribute: AttributeType): void {
    let edge_key = (answer_index + ":" + constraint_index);
    graph.addDirectedEdgeWithKey(edge_key, owner.label, attribute.label, { label: "owns", type: "arrow", size: 4 });
  }

  put_relates(graph: Graph, answer_index: number, constraint_index: number, relation: RelationType, role: RoleType): void {
    let edge_key = (answer_index + ":" + constraint_index);
    graph.addDirectedEdgeWithKey(edge_key, relation.label, role.label, { label: "relates", type: "arrow", size: 10 });
  }

  put_plays(graph: Graph, answer_index: number, constraint_index: number, player: EntityType | RelationType, role: RoleType): void {
    let edge_key = (answer_index + ":" + constraint_index);
    graph.addDirectedEdgeWithKey(edge_key, player.label, role.label, { label: "plays", type: "arrow", size: 10 });
  }

  put_isa_exact(graph: Graph, answer_index: number, constraint_index: number, thing: Attribute | ObjectAny, type: AttributeType | ObjectType): void {
    let edge_key = (answer_index + ":" + constraint_index);
    graph.addDirectedEdgeWithKey(edge_key, thing.iid, type.label, { label: "isa!", type: "arrow", size: 4 });
  }

  put_sub_exact(graph: Graph, answer_index: number, constraint_index: number, subtype: AttributeType | ObjectType, supertype: AttributeType | ObjectType): void {
    let edge_key = (answer_index + ":" + constraint_index);
    graph.addDirectedEdgeWithKey(edge_key, subtype.label, supertype.label, { label: "sub!", type: "arrow", size: 4 });
  }

}

window.DefaultConverter = DefaultConverter;
window.drawLogicalGraphWith = drawLogicalGraphWith;
window.connectToTypeDB = connectToTypeDB;
