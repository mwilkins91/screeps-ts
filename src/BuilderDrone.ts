import Nest from "Nest";

class BuilderDrone {
  private creep: Creep;
  public memory: CreepMemory;
  public nest: Nest;

  constructor(creep: Creep, nest: Nest) {
    this.creep = creep;
    this.memory = this.creep.memory;
    this.nest = nest;
  }

  private get isTransfering(): boolean {
    return this.memory.isTransfering;
  }

  private set isTransfering(val: boolean) {
    this.memory.isTransfering = val;
  }

  public moveToHome() {
    this.creep.moveTo(this.nest.spawn);
  }

  public moveTo(target: Structure | ConstructionSite) {
    this.creep.moveTo(target);
  }

  public transferResource(target: Structure | Creep = this.nest.spawn, resource: ResourceConstant = "energy") {
    return this.creep.transfer(target, resource);
  }

  private canCarryMore() {
    const carryValues: number[] = Object.values(this.creep.carry);
    const carryTotal = carryValues.reduce((prev, next) => prev + next, 0);
    return this.creep.carryCapacity > carryTotal;
  }

  private getEnergyFrom(target: Structure) {
    return this.creep.withdraw(target, RESOURCE_ENERGY);
  }

  private findAndGetEnergy(target: Structure) {
    const getResult = this.getEnergyFrom(target);
    if (getResult === ERR_NOT_IN_RANGE) {
      this.moveTo(target);
    }
    return;
  }

  private constructBlueprint(target: ConstructionSite) {
    const result = this.creep.build(target);
    if (result === ERR_NOT_IN_RANGE) {
      return this.moveTo(target);
    }

    if (result === ERR_NOT_ENOUGH_ENERGY) {
      return (this.isTransfering = false);
    }

    this.isTransfering = true;
  }

  public build() {
    const target = this.nest.spawn;
    const needsEnergy = this.canCarryMore() && !this.isTransfering;
    if (needsEnergy) {
      return this.findAndGetEnergy(target);
    }

    const buildTarget = this.creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
    if (buildTarget) {
      this.constructBlueprint(buildTarget);
    }
  }
}

export default BuilderDrone;
