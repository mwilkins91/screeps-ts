import { ErrorMapper } from "utils/ErrorMapper";
import Nest from "./Nest";

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  console.log(`Current game tick is ${Game.time}`);

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }

  Object.entries(Game.spawns)
    .map(([name, spawn]) => new Nest(spawn, name))
    .forEach(nest => {
      if (nest.workers.length - nest.workersAboutToDie.length < nest.idealNumberOfWorkers) {
        nest.createWorkerDrone();
      } else if (nest.builders.length < nest.idealNumberOfBuilders) {
        nest.createBuilderDrone();
      }

      nest.workers.forEach(worker => worker.work());

      if (nest.builders.length) {
        nest.getContainerBluePrints();
        if (nest.containers.length) {
          nest.getPrimaryRoadBlueprints();
        }
      }
      nest.builders.forEach(builder => builder.build());
    });
});
