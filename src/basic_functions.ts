function dist_sq(coor1: Position, coor2: Position) {
  let a = coor1[0] - coor2[0];
  let b = coor1[1] - coor2[1];
  return a * a + b * b;
}

export function distance(coor1: Position, coor2: Position) {
  return Math.sqrt(dist_sq(coor1, coor2));
}
