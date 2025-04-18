import Sigma from "sigma";
import Graph from "graphology";
import ForceSupervisor from "graphology-layout-force/worker";

import * as studioDefaultSettings from "./defaults";
import {StudioInteractionHandler} from "./interaction";
import {StudioDriverWrapper} from "./driverwrapper.js";
import {StudioVisualiser} from "./visualiser.js";

export class TypeDBStudio {
    graph: Graph;
    renderer: Sigma;
    layout:  ForceSupervisor;
    interactionHandler: StudioInteractionHandler;
    visualiser: StudioVisualiser;
    driver: StudioDriverWrapper;

    constructor(graph: Graph, renderer: Sigma) {
        this.graph = graph;
        this.renderer = renderer;
        this.layout = new ForceSupervisor(graph, { isNodeFixed: (_, attr) => attr.highlighted, settings: studioDefaultSettings.defaultForceSupervisorSettings});
        this.layout.start();

        this.visualiser = new StudioVisualiser(graph);
        this.driver = new StudioDriverWrapper(this.visualiser);
        this.interactionHandler = new StudioInteractionHandler(graph, renderer, studioDefaultSettings.defaultStyleParameters);
    }

    unfreeze() {
        this.layout.start();
    }

    freeze() {
        this.layout.stop();
    }
}
