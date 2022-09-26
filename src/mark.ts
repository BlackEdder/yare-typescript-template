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

export function behaviour(spirit: Spirit) { return mark_position(spirit, 0); }

export function task(spirit: Spirit) { return mark_position(spirit, 1); }

export function set_behaviour(spirit: Spirit, value: string) {
  set_mark_position(spirit, 0, value);
}

export function set_task(spirit: Spirit, value: string) {
  set_mark_position(spirit, 1, value);
}
