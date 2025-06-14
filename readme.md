This was the development bed for the graph visualiser and has since been repurposed to visualise saved graphs, and hopefully allow some customisation.
To customise colours, go to `lib/defaults.ts` and play around with the styling objects.

## Usage
`npm run build`

And serve somehow. Example: `python3 -m http.server 8001`

Non-obvious things:
* You can drag.
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