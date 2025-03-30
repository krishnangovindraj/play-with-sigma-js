import chroma from "chroma-js";
import { v4 as uuid } from "uuid";
import Graph from "graphology";
import { createVisualisationContext, VisualisationContext } from "./lib/visualisation";
import { constructGraphFromRowsResult } from "./lib/common"
import { VertexAny, TypeVertex, ObjectVertex, AttributeVertex, ITypeDBToGraphology, buildGraphFromTypeDB, LogicalGraph, LogicalVertex, EdgeKind, ThingKind } from "./lib/graph";
import { connectToTypeDB, TypeDBHttpDriver  } from "./temp_communication";
/////////////
// EXPORTS //
/////////////

window.createVisualisationContext = createVisualisationContext;
window.constructGraphFromRowsResult = constructGraphFromRowsResult;
// TODO: I imagine the right way to do this is to separate this into a module, and have a script in the page that imports this?
window.buildGraphFromTypeDB = buildGraphFromTypeDB;



///////////////////////////////////////
// Temporary functions to play with  //
///////////////////////////////////////



// Temporarily here for me to test
/* It's too simple but it's incremental
Expects:
  { vertices: Array<vertex>, edges: Array<edge> }
where:
  * vertex: { kind: (entity|relation|attribute), vertex: VertexAny }
  * edge: { kind: (has|links), from: VertexAny.IID, to: VertexAny.IID [, role: VertexAny.IID]  }  
  *   The role bit is a bit rough.
 */


export function drawGraphFromJson(context: VisualisationContext, logicalGraph: LogicalGraph) : Graph {
  let converter = new TestConverter();
  let graph = context.graph;
  graph.clear();
  logicalGraph.vertices.forEach((vertex, key) => {
    switch (vertex.kind) {
      case ThingKind.entity: {
        converter.put_entity(graph, 0, vertex as ObjectVertex);
        break;
      }
      case ThingKind.attribute : {
        converter.put_attribute(graph, 0, vertex as AttributeVertex);
        break;
      }
      case ThingKind.relation : {
        converter.put_relation(graph, 0, vertex as ObjectVertex);
        break;
      }
      default : {
        console.log("VertedKind not yet supported: ");
        console.log(vertex.kind);
      }
    }
  });
  logicalGraph.edges.forEach(edgeList => {
    edgeList.forEach(edge => {
      let from = logicalGraph.vertices.get(edge.from);
      let to = logicalGraph.vertices.get(edge.to);
      let role = edge.type.param == null ? logicalGraph.vertices.get(edge.type.param) : null;
      switch (edge.type.kind) {
        case EdgeKind.has: {
          // converter.put_has(graph, 0, edge.from as ObjectVertex, edge.to as AttributeVertex);
          converter.put_has(graph, 0, -1, from, to); // TODO: Constraint index
          break;
        }
        case EdgeKind.links : {
          // converter.put_links(graph, 0, edge.from as ObjectVertex, edge.to as ObjectVertex, edge.role as TypeVertex);
          converter.put_links(graph, 0, -1, from, to, role);  // TODO: Constraint index
          break;
        }
        default : {
          throw new Error();
        }
      }
    });
  });
  return graph;
};



class TestConverter implements ITypeDBToGraphology {
      // Vertices
  put_attribute(graph: Graph, answer_index:number, vertex: AttributeVertex): void {
    let label = vertex.type.label + ":" + vertex.value;
    graph.addNode(vertex.iid, { label: label, color: chroma('green').hex(), size: 10, x: Math.random(), y: Math.random() });
  }

  put_entity(graph: Graph, answer_index:number, vertex: ObjectVertex): void {
    let label = vertex.type.label + ":" + vertex.iid;
    graph.addNode(vertex.iid, { label: label, color: chroma('pink').hex(), size: 10, x: Math.random(), y: Math.random() });
    // graph.addNode("n2", { x: -5, y: 5, size: 10, color:  });
  }

  put_relation(graph: Graph, answer_index:number, vertex: ObjectVertex): void {
    let label = vertex.type.label + ":" + vertex.iid;
    graph.addNode(vertex.iid, { label: label, color: chroma('yellow').hex(), size: 10, x: Math.random(), y: Math.random() });
  }
  
  // Edges
  put_has(graph: Graph,  answer_index:number, constraint_index: number, owner: ObjectVertex, attribute: AttributeVertex): void {
    graph.addDirectedEdge(owner.iid, attribute.iid, { label: "has", type: "arrow", size: 10 });
  }

  put_links(graph: Graph,  answer_index:number, constraint_index: number, relation: ObjectVertex, player: ObjectVertex, role: TypeVertex): void {
    graph.addDirectedEdge(relation.iid, player.iid, { label: role.label, type: "arrow", size: 10 });
  }
}

window.drawGraphFromJson = drawGraphFromJson;
window.connectToTypeDB = connectToTypeDB;
