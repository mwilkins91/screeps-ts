import Nest from "Nest";

class WorkerDrone {
  private creep: Creep;
  public memory: CreepMemory;
  public nest: Nest;

  constructor(creep: Creep, nest: Nest) {
    this.creep = creep;
    this.memory = this.creep.memory;
    this.nest = nest;
  }

  private get source() {
    return Game.getObjectById(this.memory.sourceId) as Source;
  }

  private set source(src: Source) {
    this.memory.sourceId = src.id;
  }

  private get isTransfering(): boolean {
    return this.memory.isTransfering;
  }

  private set isTransfering(val: boolean) {
    this.memory.isTransfering = val;
  }

  public moveToSource() {
    this.creep.moveTo(this.source.pos.x, this.source.pos.y);
  }

  public mineSource() {
    return this.creep.harvest(this.source);
  }

  public changeSource(newSource: Source) {
    this.source = newSource;
  }

  public moveToHome() {
    this.creep.moveTo(this.nest.spawn);
  }

  public transferResource(target: Structure | Creep = this.nest.spawn, resource: ResourceConstant = "energy") {
    return this.creep.transfer(target, resource);
  }

  private canCarryMore() {
    const carryValues: number[] = Object.values(this.creep.carry);
    const carryTotal = carryValues.reduce((prev, next) => prev + next, 0);
    return this.creep.carryCapacity > carryTotal;
  }

  private getEnergyFor(storageTarget: Nest | Structure) {
    const store = storageTarget instanceof Nest ? storageTarget.spawn : storageTarget;

    if (this.canCarryMore() && !this.isTransfering) {
      const mineResult = this.mineSource();
      if (mineResult === ERR_NOT_IN_RANGE) {
        this.moveToSource();
      }
      return;
    }

    const transferResult = this.transferResource(store);
    if (transferResult === ERR_NOT_IN_RANGE) {
      // Not close enough to the store to xfer, move closer!
      this.creep.moveTo(store);
    } else if (transferResult === OK) {
      // We're at the storeage point and ready to xfer, don't leave until done
      this.isTransfering = true;
    } else if (transferResult === ERR_NOT_ENOUGH_RESOURCES) {
      // We've transfered all our stuff, lets get outta here
      this.isTransfering = false;
    }
  }

  public getEnergyForHome() {
    this.getEnergyFor(this.nest.storeTarget);
  }

  public getEnergyForRoomController() {
    if (this.nest.spawn.room.controller) {
      this.getEnergyFor(this.nest.spawn.room.controller);
    }
  }

  public isAboutToDie() {
    if (!this.creep.ticksToLive) {
      return false;
    }
    return this.creep.ticksToLive < 500;
  }

  public work() {
    if (this.nest.canHoldMoreEnergy()) {
      return this.getEnergyForHome();
    }

    this.getEnergyForRoomController();
  }
}

export default WorkerDrone;
