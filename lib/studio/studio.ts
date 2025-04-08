import Sigma from "sigma";
import Graph from "graphology";
import ForceSupervisor from "graphology-layout-force/worker";
import {ILogicalGraphConverter} from "../visualisation";
import {StudioConverter} from "./converter";
import {TypeDBQueryStructure} from "../typedb/answer";

import * as studioDefaultSettings from "./defaults";
import {StudioInteractionHandler} from "./interaction";

type StudioEventHandler = {};

export class TypeDBStudio {
    graph: Graph;
    renderer: Sigma;
    layout:  ForceSupervisor;
    eventHandler: StudioEventHandler;

    constructor(graph: Graph, renderer: Sigma) {
        this.graph = graph;
        this.renderer = renderer;
        this.layout = new ForceSupervisor(graph, { isNodeFixed: (_, attr) => attr.highlighted, settings: studioDefaultSettings.defaultForceSupervisorSettings});
        this.layout.start();

        this.eventHandler = new StudioInteractionHandler(graph, renderer, studioDefaultSettings.defaultStyleParameters);
    }

    unfreeze() {
        this.layout.start();
    }

    freeze() {
        this.layout.stop();
    }

    createConverter(structure: TypeDBQueryStructure) : ILogicalGraphConverter {
        // TODO: parameters
        this.graph.clear();
        return new StudioConverter(this.graph, structure, studioDefaultSettings.defaultStructureParameters, studioDefaultSettings.defaultStyleParameters);
    }
}
