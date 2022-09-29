class MapSet extends Map {
  set(key, value) {
    super.set(key, value);
    return value;
  }
}

class WeakMapSet extends WeakMap {
  set(key, value) {
    super.set(key, value);
    return value;
  }
}

export { MapSet as M, WeakMapSet as W };
