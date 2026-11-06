export class Repository {
  #db;
  #storeName;

  constructor(db, storeName) {
    this.#db = db;
    this.#storeName = storeName;
  }

  findById(key) { return this.#db.get(this.#storeName, key); }
  findAll() { return this.#db.getAll(this.#storeName); }
  findOneByIndex(idx, value) { return this.#db.getByIndex(this.#storeName, idx, value); }
  findAllByIndex(idx, value) { return this.#db.getAllByIndex(this.#storeName, idx, value); }
  add(entity) { return this.#db.add(this.#storeName, entity); }
  save(entity) { return this.#db.put(this.#storeName, entity); }
  remove(key) { return this.#db.delete(this.#storeName, key); }
  count(query) { return this.#db.count(this.#storeName, query); }
  clear() { return this.#db.clear(this.#storeName); }
}