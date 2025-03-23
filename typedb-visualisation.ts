import chroma from "chroma-js";
import { v4 as uuid } from "uuid";
import Graph from "graphology";
import { createVisualisationContext } from "./lib/visualisation";

//////////////////////////
// TypeDB -> Graphology //
//////////////////////////
type TypeVertex = {
  iid: string,
  label: string,
}

type ObjectVertex = {
  iid: string,
  type: TypeVertex,
}

type AttributeVertex = {
  iid: string,
  type: TypeVertex,
  value: any,
}

type ValueVertex = {
  value: any,
}

type VertexAny = TypeVertex | ObjectVertex | AttributeVertex | ValueVertex;

enum Edge {
  Has,
  Links,
}

type EdgeParameter = TypeVertex | number;


/**
 * You will majorly need:
 *  graph.addNode(id, attributes)
 *  graph.addNode(from, to,  attributes)
 * See: https://www.sigmajs.org/docs/advanced/data/ for attributes
 */
interface ITypeDBToGraphology {
  // TODO: Functional vertices & edges like expressions, comparisons & function calls

  // Vertices
  put_attribute(graph: Graph, answer_index:number, vertex: AttributeVertex): void;
  put_entity(graph: Graph, answer_index:number, vertex: ObjectVertex): void;
  put_relation(graph: Graph, answer_index:number, vertex: ObjectVertex): void;
  
  // Edges
  put_has(graph: Graph,  answer_index:number, owner: ObjectVertex, attribute: AttributeVertex): void;
  put_links(graph: Graph,  answer_index:number, relation: ObjectVertex, player: ObjectVertex, role: TypeVertex): void;
}

interface TypeDBResult {
  vertices: Array<VertexAny>,
  edges: Array<Array<any>>,  
}

function buildGraphFromTypeDB(result: TypeDBResult , builder: ITypeDBToGraphology) : Graph {
  var graph = new Graph();
  // TODO: See the getGraph function for now
  return graph;
}



/////////////
// EXPORTS //
/////////////

window.createVisualisationContext = createVisualisationContext;

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

type JSONGraph = {
  vertices: Array<JSONVertex>;
  // edges: Array<{ kind: string, edge: { from: VertexAny, to: VertexAny, role: TypeVertex| null }}>;
  edges: Array<JSONEdge>;
}
type JSONVertex = { kind: string, vertex: VertexAny };
type JSONEdge = { kind: string, edge: { from: string, to: string, role: string| null }};



export function drawGraphFromJson(context: VisualisationContext, json_string: string) : Graph {
  let as_json = JSON.parse(json_string) as JSONGraph;
  let converter = new TestConverter();
  let graph = context.graph;
  graph.clear();
  let vertices_by_id : {[index: string]: JSONVertex }= {};
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
        converter.put_has(graph, 0, from, to);
        break;
      }
      case "links" : {
        // converter.put_links(graph, 0, edge.from as ObjectVertex, edge.to as ObjectVertex, edge.role as TypeVertex);
        converter.put_links(graph, 0, from, to, role);
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
  put_has(graph: Graph,  answer_index:number, owner: ObjectVertex, attribute: AttributeVertex): void {
    graph.addDirectedEdge(owner.iid, attribute.iid, { label: "has", type: "arrow", size: 10 });
  }

  put_links(graph: Graph,  answer_index:number, relation: ObjectVertex, player: ObjectVertex, role: TypeVertex): void {
    graph.addDirectedEdge(relation.iid, player.iid, { label: role.label, type: "arrow", size: 10 });
  }
  // // Simpler: Accept IIDs directly
  // put_has(graph: Graph,  answer_index:number, owner: string, attribute: string): void {
  //   graph.addDirectedEdge(owner, attribute, { label: "has", type: "arrow", size: 10});
  // }

  // put_links(graph: Graph,  answer_index:number, relation: string, player: string, role: string): void {
  //   graph.addDirectedEdge(relation, player, { label: role, type: "arrow", size: 10 });
  // }
}

window.drawGraphFromJson = drawGraphFromJson;