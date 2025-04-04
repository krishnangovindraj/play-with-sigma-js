import chroma from "chroma-js";
import Graph from "graphology";
import {createVisualisationContext, VisualisationContext} from "./visualisation.js";
import {Attribute, EdgeKind, Entity, Relation, RoleType, ThingKind, TypeKind, UnavailableKind} from "./concept.js";
import {constructGraphFromRowsResult, LogicalGraph, VertexUnavailable} from "./graph.js";
import {connectToTypeDB} from "../temp_communication.js";

/////////////
// EXPORTS //
/////////////


//////////////////////////////
// TypeDB -> Graphology
/////////////////////////////

/**
 * You will majorly need:
 *  graph.addNode(id, attributes)
 *  graph.addNode(from, to,  attributes)
 * See: https://www.sigmajs.org/docs/advanced/data/ for attributes
 */
export interface ITypeDBToGraphology {
  // TODO: Functional vertices & edges like expressions, comparisons & function calls

  // Vertices
  put_attribute(graph: Graph, answer_index:number, vertex: Attribute): void;
  put_entity(graph: Graph, answer_index:number, vertex: Entity): void;
  put_relation(graph: Graph, answer_index:number, vertex: Relation): void;

  // Edges
  put_has(graph: Graph, answer_index:number, constraint_index: number, owner: Entity | Relation, attribute: Attribute): void;
  put_links(graph: Graph, answer_index:number, constraint_index: number, relation: Relation, player: Entity | Relation, role: RoleType | VertexUnavailable): void;
}

export function drawLogicalGraphWith(context: VisualisationContext, logicalGraph: LogicalGraph, converter: ITypeDBToGraphology) : Graph {
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
      let edgeParam =  edge.type.param;
      switch (edge.type.kind) {
        case EdgeKind.has: {
          // converter.put_has(graph, 0, edge.from as ObjectVertex, edge.to as Attribute);
          converter.put_has(graph, answer_index, constraint_index, from, to);
          break;
        }
        case EdgeKind.links : {
          // converter.put_links(graph, 0, edge.from as ObjectVertex, edge.to as ObjectVertex, edge.role as TypeAny);
          converter.put_links(graph, answer_index, constraint_index, from, to, edgeParam as RoleType | VertexUnavailable);
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

window.createVisualisationContext = createVisualisationContext;
window.constructGraphFromRowsResult = constructGraphFromRowsResult;

///////////////////////////////////////
// Temporary functions to play with  //
///////////////////////////////////////

export class DefaultConverter implements ITypeDBToGraphology {
      // Vertices
  put_attribute(graph: Graph, answer_index:number, vertex: Attribute): void {
    let label = vertex.type.label + ":" + vertex.value;
    graph.addNode(vertex.iid, { label: label, color: chroma('green').hex(), size: 10, x: Math.random(), y: Math.random() });
  }

  put_entity(graph: Graph, answer_index:number, vertex: Entity): void {
    let label = vertex.type.label + ":" + vertex.iid;
    graph.addNode(vertex.iid, { label: label, color: chroma('pink').hex(), size: 10, x: Math.random(), y: Math.random() });
    // graph.addNode("n2", { x: -5, y: 5, size: 10, color:  });
  }

  put_relation(graph: Graph, answer_index:number, vertex: Relation): void {
    let label = vertex.type.label + ":" + vertex.iid;
    graph.addNode(vertex.iid, { label: label, color: chroma('yellow').hex(), size: 10, x: Math.random(), y: Math.random() });
  }

  // Edges
  put_has(graph: Graph,  answer_index:number, constraint_index: number, owner: Entity | Relation, attribute: Attribute): void {
    let edge_key = (answer_index + ":" + constraint_index);
    graph.addDirectedEdgeWithKey(edge_key, owner.iid, attribute.iid, { label: "has", type: "arrow", size: 4 });
  }

  put_links(graph: Graph,  answer_index:number, constraint_index: number, relation: Relation, player: Entity | Relation, role: RoleType | VertexUnavailable): void {
    let edge_key = (answer_index + ":" + constraint_index);
    let label = (role.kind == TypeKind.roleType) ? (role as RoleType).label : null;
    console.log(label);
    graph.addDirectedEdgeWithKey(edge_key, relation.iid, player.iid, { label: label, type: "arrow", size: 10 });
  }
}

window.DefaultConverter = DefaultConverter;
window.drawLogicalGraphWith = drawLogicalGraphWith;
window.connectToTypeDB = connectToTypeDB;
