interface QueueItem<T> {
  item: T;
  priority: number;
  index: number;
}

export class PriorityQueue<T> {
  private heap: QueueItem<T>[] = [];
  private itemIndices = new Map<T, number>();

  enqueue(item: T, priority: number): void {
    const heapItem: QueueItem<T> = { item, priority, index: this.heap.length };
    this.heap.push(heapItem);
    this.itemIndices.set(item, heapItem.index);
    this.heapifyUp(heapItem.index);
  }

  dequeue(): T | undefined {
    if (this.heap.length === 0) return undefined;

    const root = this.heap[0];
    const last = this.heap.pop()!;

    if (this.heap.length > 0) {
      this.heap[0] = last;
      last.index = 0;
      this.itemIndices.set(last.item, 0);
      this.heapifyDown(0);
    }

    this.itemIndices.delete(root.item);
    return root.item;
  }

  peek(): T | undefined {
    return this.heap[0]?.item;
  }

  peekPriority(): number | undefined {
    return this.heap[0]?.priority;
  }

  updatePriority(item: T, newPriority: number): boolean {
    const index = this.itemIndices.get(item);
    if (index === undefined) return false;

    const oldPriority = this.heap[index].priority;
    this.heap[index].priority = newPriority;

    if (newPriority < oldPriority) {
      this.heapifyUp(index);
    } else {
      this.heapifyDown(index);
    }

    return true;
  }

  contains(item: T): boolean {
    return this.itemIndices.has(item);
  }

  getPriority(item: T): number | undefined {
    const index = this.itemIndices.get(item);
    return index !== undefined ? this.heap[index].priority : undefined;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  size(): number {
    return this.heap.length;
  }

  clear(): void {
    this.heap = [];
    this.itemIndices.clear();
  }

  toArray(): T[] {
    return this.heap.map(h => h.item);
  }

  private heapifyUp(index: number): void {
    let current = index;

    while (current > 0) {
      const parent = Math.floor((current - 1) / 2);

      if (this.heap[parent].priority <= this.heap[current].priority) {
        break;
      }

      this.swap(current, parent);
      current = parent;
    }
  }

  private heapifyDown(index: number): void {
    let current = index;
    const length = this.heap.length;

    while (true) {
      const leftChild = 2 * current + 1;
      const rightChild = 2 * current + 2;
      let smallest = current;

      if (leftChild < length && this.heap[leftChild].priority < this.heap[smallest].priority) {
        smallest = leftChild;
      }

      if (rightChild < length && this.heap[rightChild].priority < this.heap[smallest].priority) {
        smallest = rightChild;
      }

      if (smallest === current) break;

      this.swap(current, smallest);
      current = smallest;
    }
  }

  private swap(i: number, j: number): void {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;

    this.heap[i].index = i;
    this.heap[j].index = j;

    this.itemIndices.set(this.heap[i].item, i);
    this.itemIndices.set(this.heap[j].item, j);
  }
}
