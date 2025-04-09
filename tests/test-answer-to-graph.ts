import {constructGraphFromRowsResult, LogicalGraph, LogicalVertex, LogicalVertexID} from "../lib/graph";
import {TypeDBQueryAnswerType, TypeDBQueryType, TypeDBRowsResult} from "../lib/typedb/answer";
import {EdgeKind} from "../lib/typedb/concept";
import {GraphHelper} from "./logical-graph-utils";
import {ConceptHelper} from "./concept-utils";
import {StructureHelper} from "./other-utils.js";
import {StudioConverter} from "../lib/studio/converter.js";
import Graph from "graphology";
import * as studioDefaults from "../lib/studio/defaults";
import {convertLogicalGraphWith} from "../lib/visualisation.js";

function checkTranslation(name: string, rows_result: TypeDBRowsResult, expectedLogicalGraph: LogicalGraph) {
    let actualLogicalGraph = constructGraphFromRowsResult(rows_result)
    if (!GraphHelper.graphsAreEqual(expectedLogicalGraph, actualLogicalGraph)) {
        throw new Error("Graphs are unequal: " + name);
    }
    let graphology = new Graph();
    let converter = new StudioConverter(graphology, rows_result.queryStructure, studioDefaults.defaultStructureParameters, studioDefaults.defaultStyleParameters);
    convertLogicalGraphWith(actualLogicalGraph, converter);
    let absentEdges = expectedLogicalGraph.answers.flatMap(answer => {
        return answer.filter(edge => {
            let from = expectedLogicalGraph.vertices.get(edge.from)!;
            let to = expectedLogicalGraph.vertices.get(edge.to)!;
            let foundEdge = converter.graph.directedEdge(ConceptHelper.getVertexKey(from), ConceptHelper.getVertexKey(to));
            return foundEdge == undefined;
        })
    });
    if (absentEdges.length > 0) {
        console.log(absentEdges);
        throw new Error("Did not find edges. See console. #missing-edges:" + absentEdges.length);
    }
}

interface E2ETestCase {
    name: string,
    answer: TypeDBRowsResult,
    expectedGraph: LogicalGraph,
}

// Tests:
const TEST_HAS: E2ETestCase = {
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

const ALL_TESTS: Array<E2ETestCase> = [
    TEST_HAS
];

export function runAllTests() {
    console.log("START: E2E tests")
    for (let test of ALL_TESTS) {
        checkTranslation(test.name, test.answer, test.expectedGraph);
        console.log("\t-pass: " + test.name)
    }
    console.log("SUCCESS: E2E tests")
}
