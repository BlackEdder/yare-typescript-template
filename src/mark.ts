export const mark_id_map: Record<string, number> =
    {
      "role" : 0,
      "task" : 1,
      "role_info" : 2,
      "task_info" : 3,
      "scratch" : 4
    }

export function mark_position(spirit: Spirit, i: number) {
  var arr = spirit.mark.split(':');
  if (i < arr.length)
    return arr[i];
  return "";
}

export function set_mark_position(spirit: Spirit, i: number, value: string) {
  var arr = spirit.mark.split(':');
  arr[i] = value;
  spirit.set_mark(arr.join(':'))
}

export function get_memory(spirit: Spirit, id : string) {
  return mark_position(spirit, mark_id_map[id]);
}

export function set_memory(spirit: Spirit, id : string, value : string) {
  return set_mark_position(spirit, mark_id_map[id], value);
}

export function role(
    spirit: Spirit) { return mark_position(spirit, mark_id_map["role"]);}

export function task(
    spirit: Spirit) { return mark_position(spirit, mark_id_map["task"]);}

export function set_role(
    spirit: Spirit,
    value: string) { set_mark_position(spirit, mark_id_map["role"], value);}

export function set_task(
    spirit: Spirit,
    value: string) { set_mark_position(spirit, mark_id_map["task"], value);}

