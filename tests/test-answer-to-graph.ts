import {constructGraphFromRowsResult, LogicalGraph, LogicalVertex, LogicalVertexID} from "../lib/graph";
import {StructureVertexKind, TypeDBQueryAnswerType, TypeDBQueryType, TypeDBRowsResult} from "../lib/typedb/answer";
import {EdgeKind, TypeKind, ValueType} from "../lib/typedb/concept";
import {GraphHelper} from "./logical-graph-utils";
import {ConceptHelper} from "./concept-utils";
import {StructureHelper} from "./other-utils";
import {StudioConverter} from "../lib/studio/converter";
import Graph from "graphology";
import * as studioDefaults from "../lib/studio/defaults";
import {convertLogicalGraphWith} from "../lib/visualisation";

function checkTranslation(name: string, rows_result: TypeDBRowsResult, expectedLogicalGraph: LogicalGraph) {
    let actualLogicalGraph = constructGraphFromRowsResult(rows_result)
    if (!GraphHelper.graphsAreEqual(expectedLogicalGraph, actualLogicalGraph)) {
        throw new Error("Graphs are unequal: " + name);
    }
    let graphology = new Graph();
    let converter = new StudioConverter(graphology, rows_result.queryStructure, false, studioDefaults.defaultStructureParameters, studioDefaults.defaultQueryStyleParameters);
    convertLogicalGraphWith(actualLogicalGraph, converter);
    let absentEdges = expectedLogicalGraph.answers.flatMap((answer, answerIndex) => {
        return answer.filter(edge => {
            let from = expectedLogicalGraph.vertices.get(edge.from)!;
            let to = expectedLogicalGraph.vertices.get(edge.to)!;
            let foundEdge = converter.graph.directedEdge(ConceptHelper.getVertexKey(from, answerIndex), ConceptHelper.getVertexKey(to, answerIndex));
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
const TEST_HAS_SINGLE: E2ETestCase = {
    name: "TestHasSingle",
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
                provenanceBitArray: [0],
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

const TEST_HAS_MULTIPLE: E2ETestCase = {
    name: "TestHasMultiple",
    answer: {
        queryType: TypeDBQueryType.read,
        answerType: TypeDBQueryAnswerType.conceptRows,
        queryStructure: {
            branches: [
                {
                    edges: [
                        StructureHelper.edge(EdgeKind.has, StructureHelper.var("owner"), StructureHelper.var("attr1"), null),
                        StructureHelper.edge(EdgeKind.has, StructureHelper.var("owner"), StructureHelper.var("attr2"), null),
                    ]
                }
            ]
        },
        answers: [
            {
                provenanceBitArray: [0],
                data: {
                    "owner": ConceptHelper.entity("owner#1", "owner-type"),
                    "attr1": ConceptHelper.attribute("attr-type:attr-value1", "attr-type", ConceptHelper.valueString("attr-value1")),
                    "attr2": ConceptHelper.attribute("attr-type:attr-value2", "attr-type", ConceptHelper.valueString("attr-value2")),
                }
            },
            {
                provenanceBitArray: [0],
                data: {
                    "owner": ConceptHelper.entity("owner#2", "owner-type"),
                    "attr1": ConceptHelper.attribute("attr-type:attr-value1", "attr-type", ConceptHelper.valueString("attr-value1")),
                    "attr2": ConceptHelper.attribute("attr-type:attr-value2", "attr-type", ConceptHelper.valueString("attr-value2")),
                }
            }
        ],
    },
    expectedGraph: {
        vertices: new Map<LogicalVertexID, LogicalVertex>([
            ["owner#1", ConceptHelper.entity("owner#1", "owner-type")],
            ["owner#2", ConceptHelper.entity("owner#2", "owner-type")],
            ["attr-type:attr-value1", ConceptHelper.attribute("attr-type:attr-value1", "attr-type", ConceptHelper.valueString("attr-value1"))],
            ["attr-type:attr-value2", ConceptHelper.attribute("attr-type:attr-value2", "attr-type", ConceptHelper.valueString("attr-value2"))],
        ]),
        answers: [
            [GraphHelper.simpleEdge(EdgeKind.has, 0, 0, "owner#1", "attr-type:attr-value1"),
                GraphHelper.simpleEdge(EdgeKind.has, 0, 1, "owner#1", "attr-type:attr-value2")
            ],[GraphHelper.simpleEdge(EdgeKind.has, 0, 0, "owner#2", "attr-type:attr-value1"),
                GraphHelper.simpleEdge(EdgeKind.has, 0, 1, "owner#2", "attr-type:attr-value2")
            ]
        ]
    }
}

const TEST_LINKS_DISJUNCTION: E2ETestCase = {
    name: "TestLinksDisjunction",
    answer: {
        queryType: TypeDBQueryType.read,
        answerType: TypeDBQueryAnswerType.conceptRows,
        queryStructure: {
            branches: [
                { edges: [] },
                {
                    edges: [
                        StructureHelper.edge(EdgeKind.links, StructureHelper.var("relation"), StructureHelper.var("player"), StructureHelper.label(TypeKind.roleType, "role1")),
                    ]
                },
                {
                    edges: [
                        StructureHelper.edge(EdgeKind.links, StructureHelper.var("relation"), StructureHelper.var("player"), StructureHelper.label(TypeKind.roleType, "role2")),
                    ]
                }
            ]
        },
        answers: [
            {
                provenanceBitArray: [2],
                data: {
                    "relation": ConceptHelper.relation("rel#1", "rel-type"),
                    "player": ConceptHelper.entity("player#1", "player-type"),
                }
            },
            {
                provenanceBitArray: [4],
                data: {
                    "relation": ConceptHelper.relation("rel#2", "rel-type"),
                    "player": ConceptHelper.entity("player#2", "player-type"),
                }
            }
        ],
    },
    expectedGraph: {
        vertices: new Map<LogicalVertexID, LogicalVertex>([
            ["rel#1", ConceptHelper.relation("rel#1", "rel-type")],
            ["player#1", ConceptHelper.entity("player#1", "player-type")],
            ["rel#2", ConceptHelper.relation("rel#2", "rel-type")],
            ["player#2", ConceptHelper.entity("player#2", "player-type")],
        ]),
        answers: [
            [GraphHelper.links(ConceptHelper.role("role1"), 1, 0, "rel#1", "player#1")],
            [GraphHelper.links(ConceptHelper.role("role2"), 2, 0, "rel#2", "player#2")]
        ]
    }
}

const TEST_EXPRESSION: E2ETestCase = {
    name: "TestExpression",
    answer: {
        queryType: "read",
        answerType: TypeDBQueryAnswerType.conceptRows,
        answers: [
            {
                data: {
                    "x": ConceptHelper.valueInteger(3),
                    "y": ConceptHelper.valueInteger(8)
                },
                provenanceBitArray: [0],
            }
        ],
        queryStructure: {
            branches: [
                {
                    edges: [
                        StructureHelper.assigned(StructureHelper.expr("[Expression#1]"), StructureHelper.var("x"), "x"),
                        StructureHelper.assigned(StructureHelper.expr("[Expression#2]"), StructureHelper.var("y"), "y"),
                        StructureHelper.argument(StructureHelper.var("x"), StructureHelper.expr("[Expression#2]"), "x"),
                    ]
                }
            ]
        }
    },
    expectedGraph: {
        vertices: new Map<LogicalVertexID, LogicalVertex>([
            ["[Expression#1][0]", GraphHelper.vertexExpr("[Expression#1]", 0)],
            ["[Expression#2][0]", GraphHelper.vertexExpr("[Expression#2]", 0)],
            ["integer:3", ConceptHelper.valueInteger(3)],
            ["integer:8", ConceptHelper.valueInteger(8)],
        ]),
        answers: [
            [
                GraphHelper.assigned("x", 0, 0, "[Expression#1][0]", "integer:3"),
                GraphHelper.assigned("y", 0, 1, "[Expression#2][0]", "integer:8"),
                GraphHelper.argument("x", 0, 2, "integer:3", "[Expression#2][0]"),
            ]
        ]
    },
}

const ALL_TESTS: Array<E2ETestCase> = [
    TEST_HAS_SINGLE,
    TEST_HAS_MULTIPLE,
    TEST_LINKS_DISJUNCTION,
    TEST_EXPRESSION,
];

export function runAllTests() {
    console.log("START: E2E tests")
    for (let test of ALL_TESTS) {
        console.log("-" + test.name)
        checkTranslation(test.name, test.answer, test.expectedGraph);
        console.log("\tpassed!");
    }
    console.log("SUCCESS: E2E tests")
}
