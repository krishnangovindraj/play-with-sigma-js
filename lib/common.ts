import { VertexAny, TypeVertex, RoleTypeVertex, LogicalGraph, LogicalEdge, LogicalVertex, ValueVertex, VertexMap, VertexUnavailable, UnavailableKind, EdgeKind, LogicalEdgeType } from "./graph";

// For common data-structures that convert between what the server gives us and what we need
export type TypeDBRowsResult = {
    queryType: string,
    answers: Array<TypeDBRow>,
    queryStructure: TypeDBQueryStructure,
    answerType: string,
}


// Answers:
type TypeDBRow = { data: TypeDBRowData, provenance: number }
type TypeDBRowData = { [id: string] : VertexAny };

/////////////////////
// Query structure //
/////////////////////
export type TypeDBQueryStructure = { branches: Array<{ edges: Array<StructureEdge> }> };

type StructureEdge = { 
    type: StructureEdgTypeAny,
    to: StructureVertexAny,
    from: StructureVertexAny,
};
type StructureEdgTypeAny = { kind: EdgeKind, param: StructureVertexAny | null };

// Vertex
type StructureVertexAny  = {
    kind: StructureVertexKind,
    value: StructureVertexVariable | StructureVertexUnavailable | StructureVertexLabel | StructureVertexValue
}
type StructureVertexVariable = { variable: string };
type StructureVertexLabel = TypeVertex;
type StructureVertexValue = ValueVertex; // { value_type: TypeDBValueType, value: any };
type StructureVertexUnavailable = null;

enum StructureVertexKind {
    variable = "variable",
    label = "label",
    value = "value",
    unavailable = "unavailableVariable",
}

///////////////////
// Concrete Edge
///////////////////
///////////////////////////////////
// TypeDB server -> logical graph
///////////////////////////////////

export function constructGraphFromRowsResult(rows_result: TypeDBRowsResult) : LogicalGraph {
    let vertices: VertexMap = { };
    
    let all_answer_edges : Array<Array<LogicalEdge>> = [];
    rows_result.answers.forEach(row => {
        addAllVertices(vertices, row);
        for (let i = 0; i < rows_result.queryStructure.branches.length; i++) {
            if ( 0 ==i || 0 != (row.provenance & (1 << i)) ){
                let edges = rows_result.queryStructure.branches[i].edges;
                all_answer_edges.push(substitute_variables(edges, row.data))
            }
        }
    });
    return { vertices: vertices, edges: all_answer_edges };
}
  
function addAllVertices(vertices: VertexMap, row: TypeDBRow) {
    // TODO
}
  
function substitute_variables(branch: Array<StructureEdge>, data: TypeDBRowData) : Array<LogicalEdge> {
    return branch.map(structure_edge => {
        let edge_type = extract_edge_type(structure_edge.type, data);
        let from = extract_vertex(structure_edge.from, data);
        let to = extract_vertex(structure_edge.to, data);
        return { type: edge_type, from: from, to: to }
    });
}

var nextUnavailable = 0;
function extract_vertex(structure_vertex: StructureVertexAny, data: TypeDBRowData): LogicalVertex {
    switch (structure_vertex.kind) {
        case StructureVertexKind.variable: {
            return data[(structure_vertex.value as StructureVertexVariable).variable] as VertexAny;
        } 
        case StructureVertexKind.label:{
            return structure_vertex.value as TypeVertex;
        }
        case StructureVertexKind.value:{
            return structure_vertex.value as ValueVertex;
        }
        case StructureVertexKind.unavailable: {
            nextUnavailable += 1;
            return { kind: "unavailable", iid: "unavailable_" + nextUnavailable  } as VertexUnavailable;
        }
    }
}

function extract_edge_type(structure_edge_type: StructureEdgTypeAny, data: TypeDBRowData): LogicalEdgeType {
    switch (structure_edge_type.kind) {
        case EdgeKind.has: {
            // assert(structure_edge_type == null);
            return { kind: structure_edge_type.kind, param: null };
        }
        case EdgeKind.links: {
            let role = extract_vertex(structure_edge_type.param as StructureVertexAny, data);
            return { kind: structure_edge_type.kind, param: role as RoleTypeVertex };
        }
    }
}