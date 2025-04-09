import {constructGraphFromRowsResult, LogicalGraph, LogicalVertex, LogicalVertexID} from "../lib/graph";
import {StructureVertexKind, TypeDBQueryAnswerType, TypeDBQueryType, TypeDBRowsResult} from "../lib/typedb/answer";
import {ConceptAny, EdgeKind, ThingKind, TypeKind} from "../lib/typedb/concept";
import {answerSetsAreEqual, GraphHelper, vertexMapsAreEqual} from "./logical-graph-utils";
import {ConceptHelper} from "./concept-utils";
import {StructureHelper} from "./other-utils.js";
import {StudioConverter, unavailable_key} from "../lib/studio/converter.js";
import Graph from "graphology";
import * as studioDefaults from "../lib/studio/defaults";
import {convertLogicalGraphWith} from "../lib/visualisation.js";

function getVertexKey(vertex: LogicalVertex) : string {
    switch (vertex.kind) {
        case TypeKind.entityType:
        case TypeKind.relationType:
        case TypeKind.roleType:
        case TypeKind.attributeType: {
            return vertex.label;
        }
        case ThingKind.entity:
        case ThingKind.relation: {
            return vertex.iid;
        }
        case ThingKind.attribute: {
            return vertex.iid;
        }
        case "unavailable": {
            return unavailable_key(vertex);
        }
        case "value":
        default: {
            throw new Error("test verification function getVertexKey not implemented for :" + vertex.kind)
        }
    }
}

function checkTranslation(name: string, rows_result: TypeDBRowsResult, expectedLogicalGraph: LogicalGraph) {
    let actualLogicalGraph = constructGraphFromRowsResult(rows_result)
    if (!graphsAreEqual(expectedLogicalGraph, actualLogicalGraph)) {
        throw new Error("Graphs are unequal: " + name);
    }
    let graphology = new Graph();
    let converter = new StudioConverter(graphology, rows_result.queryStructure, studioDefaults.defaultStructureParameters, studioDefaults.defaultStyleParameters);
    convertLogicalGraphWith(actualLogicalGraph, converter);
    let absentEdges = expectedLogicalGraph.answers.flatMap(answer => {
        return answer.filter(edge => {
            let from = expectedLogicalGraph.vertices.get(edge.from)!;
            let to = expectedLogicalGraph.vertices.get(edge.to)!;
            let foundEdge = converter.graph.directedEdge(getVertexKey(from), getVertexKey(to));
            return foundEdge == undefined;
7        })
    });
    if (absentEdges.length > 0) {
        console.log(absentEdges);
        throw new Error("Did not find edges. See console. #missing-edges:" + absentEdges.length);
    }
}

function graphsAreEqual(first: LogicalGraph, second: LogicalGraph): boolean {
    return vertexMapsAreEqual(first.vertices, second.vertices)
        && answerSetsAreEqual(first.answers, second.answers);
}

interface AnswerToLogicalGraphTestCase {
    name: string,
    answer: TypeDBRowsResult,
    expectedGraph: LogicalGraph,
}


// Tests:
const TEST_HAS: AnswerToLogicalGraphTestCase = {
    name: "TestHas",
    answer: {
        queryType: TypeDBQueryType.read,
        answerType: TypeDBQueryAnswerType.conceptRows,
        queryStructure: {
            branches: [
                {
                    edges: [
                        StructureHelper.edge(EdgeKind.has, StructureHelper.var("owner"), StructureHelper.var("attr"), null)
                    ]
                }
            ]
        },
        answers: [
            {
                provenance: 0,
                data: {
                    "owner": ConceptHelper.entity("owner#1", "owner-type"),
                    "attr": ConceptHelper.attribute("attr-type:attr-value", "attr-type", ConceptHelper.valueString("attr-value"))
                }
            }
        ],
    },

    expectedGraph: {
        vertices: new Map<LogicalVertexID, LogicalVertex>([
            ["owner#1", ConceptHelper.entity("owner#1", "owner-type")],
            ["attr-type:attr-value", ConceptHelper.attribute("attr-type:attr-value", "attr-type", ConceptHelper.valueString("attr-value"))]
        ]),
        answers: [
            [GraphHelper.simpleEdge(EdgeKind.has, 0, 0, "owner#1", "attr-type:attr-value")]
        ]
    }
}

const ALL_TESTS: Array<AnswerToLogicalGraphTestCase> = [
    TEST_HAS
];

export function runAllTests() {
    console.log("START: AnswerToLogicalGraph tests")
    for (let test of ALL_TESTS) {
        checkTranslation(test.name, test.answer, test.expectedGraph);
        console.log("\t-pass: " + test.name)
    }
    console.log("SUCCESS: AnswerToLogicalGraph tests")
}
