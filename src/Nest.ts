import BuilderDrone from "BuilderDrone";
import { getPathFrom } from "helpers";
import WorkerDrone from "WorkerDrone";

const workersPerSource = 3;
const BUILDER = "builderDrone";
const WORKER = "workerDrone";

class Nest {
  public spawn: StructureSpawn;
  public name: string;
  public idealNumberOfBuilders: number = 4;
  constructor(spawn: StructureSpawn, name: string) {
    this.spawn = spawn;
    this.name = name;
  }

  private get sources(): Source[] {
    const srcs = this.spawn.room.find(FIND_SOURCES);
    return Array.isArray(srcs) ? srcs : [];
  }

  private getSource() {
    const map: { [key: string]: number } = this.sources.reduce((obj: { [key: string]: number }, src) => {
      obj[src.id] = 0;
      return obj;
    }, {});
    this.workers.forEach(drone => {
      const memory = drone.memory;
      if (!memory.sourceId) {
        return;
      }
      const src = memory.sourceId;
      const num = map[src];
      if (!num) {
        return (map[src] = 1);
      }
      return (map[src] = map[src] + 1);
    });

    const posibilites = Object.entries(map)
      .filter(([id, numOfWorkers]) => numOfWorkers < workersPerSource)
      .map(([id, numOfWorkers]) => id);
    return posibilites[0];
  }

  public get idealNumberOfWorkers() {
    return this.sources.length * workersPerSource;
  }

  public get workers(): WorkerDrone[] {
    const workerArray = Object.entries(Memory.creeps)
      .filter(
        ([name, obj]) => obj.role === WORKER && obj.room === this.spawn.room.name && obj.origin === this.spawn.name
      )
      .map(([name, obj]) => name)
      .map(name => new WorkerDrone(Game.creeps[name], this));

    return workerArray;
  }

  public get workersAboutToDie(): WorkerDrone[] {
    return this.workers.filter(worker => worker.isAboutToDie());
  }

  public get builders(): BuilderDrone[] {
    const builderArray = Object.entries(Memory.creeps)
      .filter(([name, obj]) => obj.role === BUILDER && obj.room === this.spawn.room.name)
      .map(([name, obj]) => name)
      .map(name => new BuilderDrone(Game.creeps[name], this));

    return builderArray;
  }

  private getCreepName(type: string) {
    return `${type}-${Game.time.toString()}-${Math.round(Math.random() * 10 * Math.random())}`;
  }

  private canCreateDrone(parts: BodyPartConstant[], name: string, memory: CreepMemory) {
    const result = this.spawn.spawnCreep(parts, name, {
      dryRun: true,
      memory
    });

    if (result === 0) {
      return true;
    }

    return false;
  }

  public get storeTarget() {
    if (this.spawn.energyCapacity > this.spawn.energy) {
      return this;
    } else if (this.canHoldMoreEnergy) {
      return this.containers.filter(container => container.storeCapacity > container.store.energy)[0];
    }

    return this;
  }

  public canHoldMoreEnergy() {
    const energy = this.containers.reduce((num, container) => num + container.store.energy, 0) + this.spawn.energy;
    const energyCapacity =
      this.containers.reduce((num, container) => num + container.storeCapacity, 0) + this.spawn.energyCapacity;

    return energyCapacity > energy;
  }

  public getPrimaryRoadBlueprints() {
    this.sources.forEach(src => {
      getPathFrom(this.spawn)
        .to(src)
        .forEach((position: PathStep) => {
          this.spawn.room.createConstructionSite(position.x, position.y, STRUCTURE_ROAD);
        });
    });
  }

  public get containers(): StructureContainer[] {
    const containers = this.spawn.room
      .find(FIND_STRUCTURES)
      .filter(structure => structure.structureType === "container");
    return containers as StructureContainer[];
  }

  public getContainerBluePrints() {
    const { x, y } = this.spawn.pos;
    const result = [];
    for (let i = 0; i < 10; i++) {
      const look = this.spawn.room.lookAt(x - i, y);
      const isBlocked = look.some(obj => {
        const type = obj.type as any;
        const thing = obj[obj.type] as any;
        return thing === "wall" || OBSTACLE_OBJECT_TYPES.includes(type) || OBSTACLE_OBJECT_TYPES.includes(thing);
      });

      if (isBlocked) {
        break;
      }
      result.push({ x: x - i, y });
    }

    if (result.length) {
      result.forEach(({ x: buildX, y: buildY }) => {
        this.spawn.room.createConstructionSite(buildX, buildY, "container");
      });
    }
    return result;
  }

  public createWorkerDrone() {
    const role = WORKER;
    const memory: CreepMemory = {
      isTransfering: false,
      origin: this.spawn.name,
      role,
      room: this.spawn.room.name,
      sourceId: this.getSource()
    };
    const workerParts: BodyPartConstant[] = ["work", "move", "carry"];
    const workerName = `worker-drone-${this.getCreepName(role)}`;
    if (this.canCreateDrone(workerParts, workerName, memory)) {
      this.spawn.spawnCreep(workerParts, workerName, { memory });
    }
  }

  public createBuilderDrone() {
    const role = BUILDER;
    const memory: CreepMemory = {
      isTransfering: false,
      origin: this.spawn.name,
      role,
      room: this.spawn.room.name,
      sourceId: ""
    };
    const workerParts: BodyPartConstant[] = ["work", "move", "carry", "carry"];
    const workerName = `builder-drone-${this.getCreepName(role)}`;
    if (this.canCreateDrone(workerParts, workerName, memory)) {
      this.spawn.spawnCreep(workerParts, workerName, { memory });
    }
  }
}

export default Nest;
