This was the development bed for the graph visualiser and has since been repurposed to visualise saved graphs, and hopefully allow some customisation.
To customise colours, go to `lib/defaults.ts` and play around with the styling objects.

## Usage
Run `npm run build` to generate `typedb-visualisation.js`
Just open `index.html` in your browser. 

The format expected is the full JSON response returned by the TypeDB HTTP API on a pipelined query (without a fetch).
See `ConceptRowsQueryResponse` in [response.ts](src/typedb-driver/response.ts)

## Other notes
* You can drag. When using a `LayoutSupervisor`, the animation can be unfrozen & frozen using the buttons.
* There are some extra layouts available under `layouts.ts`. 
  - You can also implement your own. 
  ```typescript
        // this.graph is a graphology graph. Assume you've computed positions. 
        this.graph.nodes().forEach(node => {
            graph.setNodeAttribute(node, "x", positions[node].x);
            graph.setNodeAttribute(node, "y", positions[node].y);
        })
  ```
* From the console, Edges from a specific answer(here at index 0) can be
  - highlighted using `visualiser.interactionHandler.highlightAnswer(0)`
  - unhighlighted using `visualiser.interactionHandler.removeHighlightFromAnswer(0)` in console