export const base_map: Record<string, Base> = {
  "base_zxq" : base_zxq,
  "base_a2c" : base_a2c,
  "base_p89" : base_p89,
  "base_nua" : base_nua,
};

export const structure_map: Record<string, _Structure> = {
  "base_zxq" : base_zxq,
  "base_a2c" : base_a2c,
  "base_p89" : base_p89,
  "base_nua" : base_nua,
  "pylon_u3p" : pylon_u3p,
  "outpost_mdo" : outpost_mdo,
};

export const star_map: Record<string, Star> = {
  "star_zxq" : star_zxq,
  "star_a2c" : star_a2c,
  "star_p89" : star_p89,
  "star_nua" : star_nua
};

export let my_alive_spirits = my_spirits.filter((a) => a.hp > 0);

function dist_sq(coor1: Position, coor2: Position) {
  let a = coor1[0] - coor2[0];
  let b = coor1[1] - coor2[1];
  return a * a + b * b;
}

export function distance(coor1: Position, coor2: Position) {
  return Math.sqrt(dist_sq(coor1, coor2));
}

export function choose_cdf(arr: Array<number>) {
  let sum = arr.reduce((acc, value) => value + acc);
  let y = 0.0;
  let cdf_y = Math.random() * sum;
  let id = -1;
  while (cdf_y > y) {
    ++id;
    y += arr[id];
  }
  return id;
}

type Direction = [ x: number, y: number ];
type Radian = number;
type Degree = number;

export function direction(from: Position, to: Position) {
  return [ to[0] - from[0], to[1] - from[1] ] as Direction;
}

export function angle(dir : Direction) {
  return Math.atan(dir[0]/dir[1]) as Radian;
}

export function radian(angle : Degree) {
  return angle * Math.PI / 180 as Radian;
}

export function change_direction(dir : Direction, angle: Radian) {
  return [
    Math.cos(angle) * dir[0] - Math.sin(angle) * dir[1],
    Math.sin(angle) * dir[0] + Math.cos(angle) * dir[1]
  ] as Direction;
}

export function follow(spirit : Spirit, dir : Direction) {
  return [spirit.position[0] + dir[0], spirit.position[1] + dir[1]] as Position;
}

export let pipe = (x, ...fns) => fns.reduce((v, f) => f(v), x);

export function energy_level(entity : Entity) {
  return entity.energy/entity.energy_capacity;
}

export function under_enemy_control(entity: Base | Pylon | Outpost) {
  return (entity.control != "BlackEdder" && entity.control != "");
}


