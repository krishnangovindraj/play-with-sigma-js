import MultiGraph from "graphology";
import {TypeDBRowsResult} from "../typedb/answer.js";
import {constructGraphFromRowsResult} from "../graph.js";
import {convertLogicalGraphWith} from "../visualisation.js";
import {StudioConverter} from "./converter.js";
import {StudioConverterStructureParameters, StudioConverterStyleParameters} from "./config.js";

export class StudioVisualiser {
    private graph: MultiGraph;
    private styleParameters: StudioConverterStyleParameters;
    private structureParameters: StudioConverterStructureParameters;
    constructor(graph: MultiGraph, styleParameters: StudioConverterStyleParameters, structureParameters: StudioConverterStructureParameters) {
        this.graph = graph;
        this.styleParameters = styleParameters;
        this.structureParameters = structureParameters;
    }

    handleQueryResult(query_result: TypeDBRowsResult) {
        if (query_result.answerType == "conceptRows" && query_result.queryStructure != null) {
            let converter = new StudioConverter(this.graph, query_result.queryStructure, false, this.structureParameters, this.styleParameters);
            let logicalGraph = constructGraphFromRowsResult(query_result); // In memory, not visualised
            this.graph.clear();
            convertLogicalGraphWith(logicalGraph, converter);
        }
    }

    handleExplorationQueryResult(query_result: TypeDBRowsResult) {
        if (query_result.answerType == "conceptRows" && query_result.queryStructure != null) {
            let converter = new StudioConverter(this.graph, query_result.queryStructure, true, this.structureParameters, this.styleParameters);
            let logicalGraph = constructGraphFromRowsResult(query_result); // In memory, not visualised
            convertLogicalGraphWith(logicalGraph, converter);
        }
    }
}
