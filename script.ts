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


export function createVisualisationContext(container_id: string) : VisualisationContext {
  // Retrieve the html document for sigma container
  let graph = new Graph();
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
  // put_has(graph: Graph,  answer_index:number, owner: ObjectVertex, attribute: AttributeVertex): void;
  // put_links(graph: Graph,  answer_index:number, relation: ObjectVertex, player: ObjectVertex, role: TypeVertex): void;

  // TOOD: Revert, possibly. 
  put_has(graph: Graph,  answer_index:number, owner: string, attribute: string): void;
  put_links(graph: Graph,  answer_index:number, relation: string, player: string, role: string): void;
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

// Temporarily here for me to test
/* It's too simple but it's incremental
Expects:
  { vertices: Array<vertex>, edges: Array<edge> }
where:
  * vertex: { kind: (entity|relation|attribute), vertex: VertexAny }
  * edge: { kind: (has|links), from: VertexAny, to: VertexAny  } 
 */

type ExpectedJSONSchema = {
  vertices: Array<{ kind: string, vertex: VertexAny }>;
  // edges: Array<{ kind: string, edge: { from: VertexAny, to: VertexAny, role: TypeVertex| null }}>;
  edges: Array<{ kind: string, edge: { from: string, to: string, role: string| null }}>;
}

export function drawGraphFromJson(context: VisualisationContext, json_string: string) : Graph {
  let as_json = JSON.parse(json_string) as ExpectedJSONSchema;
  let converter = new TestConverter();
  let graph = context.graph;
  graph.clear();
  as_json.vertices.forEach(entry => {
    console.log("Add vertex: " );
    console.log(entry);
    switch (entry.kind) {
      case "entity": {
        converter.put_entity(graph, 0, entry.vertex as ObjectVertex);
        break;
      }
      case "attribute" : {
        converter.put_attribute(graph, 0, entry.vertex as AttributeVertex);
        break;
      }
      case "relation" : {
        converter.put_relation(graph, 0, entry.vertex as ObjectVertex);
        break;
      }
      default : {
        throw new Error();
      }
    }
  });
  as_json.edges.forEach(entry => {
    let edge = entry.edge;
    switch (entry.kind) {
      case "has": {
        // converter.put_has(graph, 0, edge.from as ObjectVertex, edge.to as AttributeVertex);
        converter.put_has(graph, 0, edge.from, edge.to);
        break;
      }
      case "links" : {
        // converter.put_links(graph, 0, edge.from as ObjectVertex, edge.to as ObjectVertex, edge.role as TypeVertex);
        converter.put_links(graph, 0, edge.from, edge.to, edge.role as string);
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
  // put_has(graph: Graph,  answer_index:number, owner: ObjectVertex, attribute: AttributeVertex): void {
  //   graph.addDirectedEdge(owner.iid, attribute.iid, { label: "has", type: "arrow", size: 10 });
  // }

  // put_links(graph: Graph,  answer_index:number, relation: ObjectVertex, player: ObjectVertex, role: TypeVertex): void {
  //   graph.addDirectedEdge(relation.iid, player.iid, { label: role.label, type: "arrow", size: 10 });
  // }
  // Simpler: Accept IIDs directly
  put_has(graph: Graph,  answer_index:number, owner: string, attribute: string): void {
    graph.addDirectedEdge(owner, attribute, { label: "has", type: "arrow", size: 10});
  }

  put_links(graph: Graph,  answer_index:number, relation: string, player: string, role: string): void {
    graph.addDirectedEdge(relation, player, { label: role, type: "arrow", size: 10 });
  }
}

window.drawGraphFromJson = drawGraphFromJson;
window.createVisualisationContext = createVisualisationContext;

// TODO: I imagine the right way to do this is to separate this into a module, and have a script in the page that imports this?
window.buildGraphFromTypeDB = buildGraphFromTypeDB;
