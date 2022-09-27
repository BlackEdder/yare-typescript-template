// Individual based model
import {
  base_map,
  choose_cdf,
  distance,
  energy_level,
  my_alive_spirits,
  star_map,
  structure_map,
  under_enemy_control
} from "./basic_functions";
import {get_memory, role, set_memory, set_task, task} from "./mark";

function find_nearest<T>(spirit: Spirit, arr: [ T ]) {
  return arr.sort((a, b) => distance(spirit.position, a.position) -
                            distance(spirit.position, b.position))[0];
}

function attempt_daisy_chain(spirit: Spirit) {
  let structure = find_nearest(spirit, Object.values(structure_map));
  let arr =
      spirit.sight.friends.map((a) => spirits[a])
          .filter((a) => energy_level(a) < 0.75 &&
                         distance(a.position, spirit.position) <= 200 &&
                         distance(a.position, spirit.position) > 150 &&
                         distance(a.position, structure.position) + 100 <
                             distance(spirit.position, structure.position))
          .sort((a, b) => distance(b.position, spirit.position) -
                          distance(a.position, spirit.position));
  if (arr.length > 0) {
    spirit.energize(arr[0]);
    return true;
  }
  return false;
}

function charge(spirit: Spirit) {
  if (spirit.energy == 0) {
    set_task(spirit, "harvest");
    set_memory(spirit, "scratch", "");
  }
  let target_id = get_memory(spirit, "task_info");
  if (target_id == "" || structure_map[target_id] == undefined) {
    target_id = find_nearest(spirit, Object.values(base_map)).id;
    set_memory(spirit, "task_info", target_id);
    set_memory(spirit, "scratch", "");
  }

  let target = structure_map[target_id];
  if (distance(spirit.position, target.position) > 200) {
    let c = attempt_daisy_chain(spirit);
    if (!c)
      spirit.move(target.position);
  } else {
    spirit.energize(target);
  }
}

function harvest(spirit: Spirit) {
  if (spirit.energy == spirit.energy_capacity) {
    set_task(spirit, "charge");
    set_memory(spirit, "scratch", "");
  }
  let target_id = get_memory(spirit, "task_info");
  if (target_id == "" || star_map[target_id] == undefined) {
    target_id = find_nearest(spirit, Object.values(star_map)).id;
    set_memory(spirit, "task_info", target_id);
    set_memory(spirit, "scratch", "");
  }
  let target = star_map[target_id];
  // When target is within < 500, record its energy
  // When target is in reach, harvest if energy > 90% or > recorded energy
  if (distance(target.position, spirit.position) < 500) {
    let v = get_memory(spirit, "scratch");
    if (v == "") {
      v = String(target.energy + 10 + Math.round(25 * Math.random()));
      set_memory(spirit, "scratch", v);
    }
    if (Number(v) < target.energy || energy_level(target) > 0.95) {
      if (distance(spirit.position, target.position) > 200) {
        spirit.move(target.position);
      }
      spirit.energize(spirit);
    } else {
      let c = attempt_daisy_chain(spirit);
      if (!c) {
        if (Math.random() < energy_level(spirit) * 0.9) {
          set_task(spirit, "idle");
        }
        // console.log("Nothing to do");
      }
    }
  } else {
    spirit.move(target.position);
  }
}

function merge(spirit: Spirit) {
  let arr = spirit.sight.friends.map((a) => spirits[a])
                .filter((a) => task(a) != "merge")
                .sort((a, b) => distance(spirit.position, a.position) -
                                distance(spirit.position, b.position));
  if (arr.length > 0) {
    spirit.move(arr[0].position);
    spirit.merge(arr[0]);
  } else {
    set_task(spirit, "idle");
  }
}

function travel(spirit: Spirit) {
  let target_id = get_memory(spirit, "task_info");
  if (target_id == "") {
    let trgts = Object.values(structure_map)
                    .filter((a) => !under_enemy_control(a))
                    .sort((a, b) => distance(a.position, spirit.position) -
                                    distance(b.position, spirit.position))
                    .slice(1);
    if (trgts.length == 0)
      set_task(spirit, "idle");
    target_id = trgts[choose_cdf(trgts.map((_) => 1))].id;
    set_memory(spirit, "task_info", target_id);
  }
  let structure = structure_map[target_id];
  spirit.move(structure.position);
  if (distance(spirit.position, structure.position) < 300)
    set_task(spirit, "charge");
}

function idle(spirit: Spirit) {
  let options: Array<string> = [];
  let weights: Array<number> = [];
  // Merge
  if (spirit.shape == "circles" && spirit.sight.friends.length > 10) {
    options.push("merge");
    weights.push(100 - spirit.size);
  }
  // Travel
  let trgts = Object.values(structure_map)
                  .filter((a) => !under_enemy_control(a))
                  .slice(1);
  if (trgts.length > 0) {
    options.push("travel");
    weights.push(100 * trgts.length * energy_level(spirit));
  }
  // Attack

  options.push("charge");
  weights.push(1);

  set_task(spirit, options[choose_cdf(weights)]);

  /*if (trgts.length > 0 && energy_level(spirit) > 0.5) {
    let w = trgts.map((_) => 1);
    let structure = trgts[choose_cdf(w)];
    set_task(spirit, "charge");
    set_memory(spirit, "task_info", structure.id);
  }*/
}

function rprocess(spirit: Spirit) {
  if (task(spirit) == "")
    set_task(spirit, "harvest");

  switch (task(spirit)) {
  case "harvest": {
    harvest(spirit);
    break;
  }
  case "charge": {
    charge(spirit);
    break;
  }
  case "idle": {
    idle(spirit);
    break;
  }
  case "merge": {
    merge(spirit);
    break;
  }
  case "travel": {
    travel(spirit);
    break;
  }
  default: {
    console.log("Unknown task:", task(spirit));
    break
  }
  }
}

my_alive_spirits.forEach((a) => rprocess(a));

console.log("We made it to the end: ", my_alive_spirits.length);

let res =
    my_alive_spirits.reduce<Record<string, number>>((acc, value: Spirit) => {
      let b = role(value);
      if (acc[b] == undefined)
        acc[role(value)] = 1;
      else
        acc[role(value)] += 1;
      return acc;
    }, {});
console.log(JSON.stringify(res));

res = my_alive_spirits.reduce((acc, value: Spirit) => {
  let b = task(value);
  if (acc[b] == undefined)
    acc[task(value)] = 1;
  else
    acc[task(value)] += 1;
  return acc;
}, {} as Record<string, number>);
console.log("Task: ", JSON.stringify(res));

res = my_alive_spirits.reduce((acc, value: Spirit) => {
  let b = get_memory(value, "scratch");
  if (acc[b] == undefined)
    acc[b] = 1;
  else
    acc[b] += 1;
  return acc;
}, {} as Record<string, number>);

console.log("Scratch: ", JSON.stringify(res));
