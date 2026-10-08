# Choose the nearest example

All fixtures are original and use the public `iui/1` protocol. Their measurements are synthetic unless the fixture explicitly says otherwise.

| Example | What it teaches | What to preserve when adapting |
| --- | --- | --- |
| [minimal.json](../examples/minimal.json) | Prose is a valid outcome | Do not add components merely to fill space |
| [hpcc-feedback.json](../examples/hpcc-feedback.json) | Prose → topology → bound slider → computed metrics → formula → interpretation | Explicit teaching-model scope, positive denominator, labels, visible feedback, reset |
| [rtt-trend.json](../examples/rtt-trend.json) | A trend with a missing observation and inspectable values | `null` stays missing, series labels and units remain visible, no causal claim from the curve alone |
| [wifi-status.json](../examples/wifi-status.json) | Compact metrics with their meaning | A PHY rate is not measured throughput; synthetic readings are not live device access |
| [resource-shortlist.json](../examples/resource-shortlist.json) | Useful links embedded in normal prose | Honest project status; omit thumbnails without useful, authorized images |

Change the data and explanation together. A fixture is not evidence for a user's real situation. The HPCC-inspired example demonstrates one simplified proportional feedback relation; it is not an implementation or validation of the full scientific algorithm.
