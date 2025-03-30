import chroma from "chroma-js";
import { v4 as uuid } from "uuid";
import Graph from "graphology";
import { createVisualisationContext, VisualisationContext } from "./lib/visualisation";
import { constructGraphFromRowsResult } from "./lib/common"
import { VertexAny, TypeVertex, ObjectVertex, AttributeVertex, ITypeDBToGraphology, buildGraphFromTypeDB } from "./lib/graph";
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


export function drawGraphFromJson(context: VisualisationContext, json_string: string) : Graph {
  let as_json = JSON.parse(json_string) as LogicalGraph;
  let converter = new TestConverter();
  let graph = context.graph;
  graph.clear();
  let vertices_by_id : {[index: string]: LogicalVertex }= {};
  as_json.vertices.forEach(entry => {
    
    switch (entry.kind) {
      case "entity": {
        converter.put_entity(graph, 0, entry.vertex as ObjectVertex);
        vertices_by_id[(entry.vertex as ObjectVertex).iid] = entry;
        break;
      }
      case "attribute" : {
        converter.put_attribute(graph, 0, entry.vertex as AttributeVertex);
        vertices_by_id[(entry.vertex as AttributeVertex).iid] = entry;
        break;
      }
      case "relation" : {
        converter.put_relation(graph, 0, entry.vertex as ObjectVertex);
        vertices_by_id[(entry.vertex as ObjectVertex).iid] = entry;
        break;
      }
      default : {
        throw new Error();
      }
    }
  });
  as_json.edges.map(entry => {
    let from = vertices_by_id[entry.edge.from].vertex;
    let to = vertices_by_id[entry.edge.to].vertex;
    let role = entry.edge.role == null ? vertices_by_id[entry.edge.to].vertex : null;
    switch (entry.kind) {
      case "has": {
        // converter.put_has(graph, 0, edge.from as ObjectVertex, edge.to as AttributeVertex);
        converter.put_has(graph, 0, -1, from, to); // TODO: Constraint index
        break;
      }
      case "links" : {
        // converter.put_links(graph, 0, edge.from as ObjectVertex, edge.to as ObjectVertex, edge.role as TypeVertex);
        converter.put_links(graph, 0, -1, from, to, role);  // TODO: Constraint index
        break;
      }
      default : {
        throw new Error();
      }
    }
  });
  return graph;
};



class TestConverter implements ITypeDBToGraphology {
      // Vertices
  put_attribute(graph: Graph, answer_index:number, vertex: AttributeVertex): void {
    let label = vertex.type.label + ":" + vertex.value;
    graph.addNode(vertex.iid, { label: label, color: chroma('green').hex(), size: 40, x: Math.random(), y: Math.random() });
  }

  put_entity(graph: Graph, answer_index:number, vertex: ObjectVertex): void {
    let label = vertex.type.label + ":" + vertex.iid;
    graph.addNode(vertex.iid, { label: label, color: chroma('pink').hex(), size: 40, x: Math.random(), y: Math.random() });
    // graph.addNode("n2", { x: -5, y: 5, size: 10, color:  });
  }

  put_relation(graph: Graph, answer_index:number, vertex: ObjectVertex): void {
    let label = vertex.type.label + ":" + vertex.iid;
    graph.addNode(vertex.iid, { label: label, color: chroma('yellow').hex(), size: 40, x: Math.random(), y: Math.random() });
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
