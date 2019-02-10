export const getPathFrom = (from: Structure | Creep) => ({ to: from.pos.findPathTo.bind(from.pos) });

export const debugArea = (roomName: string, area: LookForAtAreaResultMatrix<LookConstant>) => {
  const roomvis = new RoomVisual(roomName);
  const positionMatrix: Array<[number, number]> = Object.entries(area)
    .map(([key, obj]) => {
      return Object.keys(obj).map(num => {
        return [key, num];
      });
    })
    .reduce((arr, arrOfArr) => [...arr, ...arrOfArr], [])
    .map(([key, val]): [number, number] => [parseInt(key, 10), parseInt(val, 10)]);
  console.log(positionMatrix);
  roomvis.poly(positionMatrix);
};
