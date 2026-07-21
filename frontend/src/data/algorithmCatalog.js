const clone = (v) => JSON.parse(JSON.stringify(v))

const H = (overrides = {}) => ({
  comparing: [],
  sorted: [],
  window: [],
  current: null,
  pivot: null,
  pointers: {},
  ...overrides,
})

function bubbleSort(input) {
  const arr = clone(input)
  const steps = []
  const sorted = []
  let comparisons = 0
  let swaps = 0

  steps.push({
    state: { array: clone(arr) },
    highlights: H({ sorted: clone(sorted) }),
    variables: { i: null, j: null, comparisons, swaps, sorted: sorted.length },
    codeLine: 'bubbleSort(arr)',
    explanation: 'Start: sort the array in ascending order with bubble sort.',
  })

  for (let i = 0; i < arr.length - 1; i++) {
    let didSwap = false
    for (let j = 0; j < arr.length - i - 1; j++) {
      comparisons++
      steps.push({
        state: { array: clone(arr) },
        highlights: H({ comparing: [j, j + 1], sorted: clone(sorted) }),
        variables: { i, j, comparisons, swaps, sorted: sorted.length },
        codeLine: 'if (arr[j] > arr[j+1])',
        explanation: `Compare arr[${j}]=${arr[j]} and arr[${j + 1}]=${arr[j + 1]}.`,
      })
      if (arr[j] > arr[j + 1]) {
        const tmp = arr[j]; arr[j] = arr[j + 1]; arr[j + 1] = tmp
        swaps++
        didSwap = true
        steps.push({
          state: { array: clone(arr) },
          highlights: H({ current: j, sorted: clone(sorted) }),
          variables: { i, j, comparisons, swaps, sorted: sorted.length },
          codeLine: '[arr[j], arr[j+1]] = [arr[j+1], arr[j]]',
          explanation: `Swap ${arr[j + 1]} and ${arr[j]}.`,
        })
      }
    }
    sorted.unshift(arr.length - i - 1)
    steps.push({
      state: { array: clone(arr) },
      highlights: H({ sorted: clone(sorted) }),
      variables: { i, j: null, comparisons, swaps, sorted: sorted.length },
      codeLine: '// element at end of pass is in final position',
      explanation: `Pass ${i + 1} complete. ${arr[arr.length - i - 1]} is now in its final position.`,
    })
    if (!didSwap) {

      for (let k = 0; k < arr.length - i - 1; k++) {
        if (!sorted.includes(k)) sorted.push(k)
      }
      steps.push({
        state: { array: clone(arr) },
        highlights: H({ sorted: clone(sorted) }),
        variables: { i, j: null, comparisons, swaps, sorted: sorted.length },
        codeLine: 'if (!swapped) break;',
        explanation: 'No swaps in this pass — the array is already sorted. Early exit.',
      })
      break
    }
  }
  if (sorted.length < arr.length) {
    for (let k = 0; k < arr.length; k++) if (!sorted.includes(k)) sorted.push(k)
    steps.push({
      state: { array: clone(arr) },
      highlights: H({ sorted: clone(sorted) }),
      variables: { i: null, j: null, comparisons, swaps, sorted: arr.length },
      codeLine: 'return arr;',
      explanation: `Done. ${comparisons} comparisons, ${swaps} swaps.`,
    })
  }
  return steps
}

function selectionSort(input) {
  const arr = clone(input)
  const steps = []
  const sorted = []
  let comparisons = 0
  let swaps = 0

  steps.push({
    state: { array: clone(arr) },
    highlights: H({ sorted: clone(sorted) }),
    variables: { i: null, j: null, minIdx: null, comparisons, swaps },
    codeLine: 'selectionSort(arr)',
    explanation: 'Start: repeatedly find the minimum and place it at the front.',
  })

  for (let i = 0; i < arr.length; i++) {
    let minIdx = i
    steps.push({
      state: { array: clone(arr) },
      highlights: H({ current: i, pivot: minIdx, sorted: clone(sorted) }),
      variables: { i, j: null, minIdx, comparisons, swaps },
      codeLine: 'let minIdx = i;',
      explanation: `Assume arr[${i}]=${arr[i]} is the minimum of the unsorted region.`,
    })
    for (let j = i + 1; j < arr.length; j++) {
      comparisons++
      steps.push({
        state: { array: clone(arr) },
        highlights: H({ comparing: [minIdx, j], current: i, sorted: clone(sorted) }),
        variables: { i, j, minIdx, comparisons, swaps },
        codeLine: 'if (arr[j] < arr[minIdx]) minIdx = j;',
        explanation: `Compare arr[${minIdx}]=${arr[minIdx]} with arr[${j}]=${arr[j]}.`,
      })
      if (arr[j] < arr[minIdx]) {
        minIdx = j
        steps.push({
          state: { array: clone(arr) },
          highlights: H({ pivot: minIdx, sorted: clone(sorted) }),
          variables: { i, j, minIdx, comparisons, swaps },
          codeLine: 'minIdx = j;',
          explanation: `New minimum at index ${j}.`,
        })
      }
    }
    if (minIdx !== i) {
      const tmp = arr[i]; arr[i] = arr[minIdx]; arr[minIdx] = tmp
      swaps++
      steps.push({
        state: { array: clone(arr) },
        highlights: H({ current: i, sorted: clone(sorted) }),
        variables: { i, j: null, minIdx, comparisons, swaps },
        codeLine: '[arr[i], arr[minIdx]] = [arr[minIdx], arr[i]]',
        explanation: `Swap arr[${i}] with arr[${minIdx}].`,
      })
    }
    sorted.push(i)
  }
  steps.push({
    state: { array: clone(arr) },
    highlights: H({ sorted: Array.from({ length: arr.length }, (_, k) => k) }),
    variables: { i: null, j: null, minIdx: null, comparisons, swaps },
    codeLine: 'return arr;',
    explanation: `Done. ${comparisons} comparisons, ${swaps} swaps.`,
  })
  return steps
}

function insertionSort(input) {
  const arr = clone(input)
  const steps = []
  let comparisons = 0
  let shifts = 0

  steps.push({
    state: { array: clone(arr) },
    highlights: H({ sorted: [0] }),
    variables: { i: null, j: null, key: null, comparisons, shifts },
    codeLine: 'insertionSort(arr)',
    explanation: 'Start: arr[0] is trivially sorted. Grow the sorted region left-to-right.',
  })
  for (let i = 1; i < arr.length; i++) {
    const key = arr[i]
    let j = i - 1
    steps.push({
      state: { array: clone(arr) },
      highlights: H({ current: i, sorted: Array.from({ length: i }, (_, k) => k) }),
      variables: { i, j, key, comparisons, shifts },
      codeLine: 'let key = arr[i];',
      explanation: `Take arr[${i}]=${key} and insert it into the sorted region [0..${i - 1}].`,
    })
    while (j >= 0) {
      comparisons++
      steps.push({
        state: { array: clone(arr) },
        highlights: H({ comparing: [j, i], sorted: Array.from({ length: i }, (_, k) => k) }),
        variables: { i, j, key, comparisons, shifts },
        codeLine: 'while (j >= 0 && arr[j] > key)',
        explanation: `Compare arr[${j}]=${arr[j]} with key=${key}.`,
      })
      if (arr[j] <= key) break
      arr[j + 1] = arr[j]
      shifts++
      steps.push({
        state: { array: clone(arr) },
        highlights: H({ current: j + 1, sorted: Array.from({ length: i }, (_, k) => k) }),
        variables: { i, j, key, comparisons, shifts },
        codeLine: 'arr[j+1] = arr[j];',
        explanation: `Shift arr[${j}] right by one.`,
      })
      j--
    }
    arr[j + 1] = key
    steps.push({
      state: { array: clone(arr) },
      highlights: H({ current: j + 1, sorted: Array.from({ length: i + 1 }, (_, k) => k) }),
      variables: { i, j, key, comparisons, shifts },
      codeLine: 'arr[j+1] = key;',
      explanation: `Drop key=${key} at index ${j + 1}.`,
    })
  }
  steps.push({
    state: { array: clone(arr) },
    highlights: H({ sorted: Array.from({ length: arr.length }, (_, k) => k) }),
    variables: { i: null, j: null, key: null, comparisons, shifts },
    codeLine: 'return arr;',
    explanation: `Done. ${comparisons} comparisons, ${shifts} shifts.`,
  })
  return steps
}

function mergeSort(input) {
  const arr = clone(input)
  const steps = []
  let comparisons = 0
  const sorted = new Set()

  function rec(a, lo, hi, depth = 0) {
    if (lo >= hi) return
    const mid = Math.floor((lo + hi) / 2)
    steps.push({
      state: { array: clone(arr), range: [lo, hi], mid },
      highlights: H({ sorted: Array.from(sorted) }),
      variables: { lo, hi, mid, comparisons, depth },
      codeLine: 'const mid = (lo + hi) >> 1;',
      explanation: `Split [${lo}..${hi}] at mid=${mid}.`,
    })
    rec(a, lo, mid, depth + 1)
    rec(a, mid + 1, hi, depth + 1)

    const left = a.slice(lo, mid + 1)
    const right = a.slice(mid + 1, hi + 1)
    let i = 0, j = 0, k = lo
    steps.push({
      state: { array: clone(arr), range: [lo, hi], mid },
      highlights: H({ sorted: Array.from(sorted) }),
      variables: { lo, hi, mid, i, j, k, comparisons, depth },
      codeLine: 'merge(a, lo, mid, hi);',
      explanation: `Merge sorted halves [${lo}..${mid}] and [${mid + 1}..${hi}].`,
    })
    while (i < left.length && j < right.length) {
      comparisons++
      steps.push({
        state: { array: clone(arr), range: [lo, hi] },
        highlights: H({ comparing: [k], sorted: Array.from(sorted) }),
        variables: { left: left[i], right: right[j], i, j, k, comparisons, depth },
        codeLine: 'if (left[i] <= right[j])',
        explanation: `Compare left[${i}]=${left[i]} vs right[${j}]=${right[j]}.`,
      })
      if (left[i] <= right[j]) {
        a[k] = left[i++]
      } else {
        a[k] = right[j++]
      }
      steps.push({
        state: { array: clone(arr), range: [lo, hi] },
        highlights: H({ current: k, sorted: Array.from(sorted) }),
        variables: { i, j, k, comparisons, depth },
        codeLine: 'a[k++] = ...',
        explanation: `Write ${a[k - 1]} to index ${k - 1}.`,
      })
      k++
    }
    while (i < left.length) {
      a[k] = left[i++]
      steps.push({
        state: { array: clone(arr), range: [lo, hi] },
        highlights: H({ current: k, sorted: Array.from(sorted) }),
        variables: { i, j, k, comparisons, depth },
        codeLine: 'a[k++] = left[i++];',
        explanation: `Drain left[${i - 1}]=${a[k]}.`,
      })
      k++
    }
    while (j < right.length) {
      a[k] = right[j++]
      steps.push({
        state: { array: clone(arr), range: [lo, hi] },
        highlights: H({ current: k, sorted: Array.from(sorted) }),
        variables: { i, j, k, comparisons, depth },
        codeLine: 'a[k++] = right[j++];',
        explanation: `Drain right[${j - 1}]=${a[k]}.`,
      })
      k++
    }
    for (let p = lo; p <= hi; p++) sorted.add(p)
    steps.push({
      state: { array: clone(arr) },
      highlights: H({ sorted: Array.from(sorted) }),
      variables: { lo, hi, comparisons, depth },
      codeLine: '// merged',
      explanation: `[${lo}..${hi}] is now sorted.`,
    })
  }
  steps.push({
    state: { array: clone(arr) },
    highlights: H(),
    variables: { comparisons },
    codeLine: 'mergeSort(a, 0, a.length-1);',
    explanation: 'Start: divide-and-conquer, recursively split and merge.',
  })
  rec(arr, 0, arr.length - 1)
  steps.push({
    state: { array: clone(arr) },
    highlights: H({ sorted: Array.from({ length: arr.length }, (_, k) => k) }),
    variables: { comparisons },
    codeLine: 'return a;',
    explanation: `Done. ${comparisons} comparisons.`,
  })
  return steps
}

function quickSort(input) {
  const arr = clone(input)
  const steps = []
  let comparisons = 0
  const sorted = new Set()

  function rec(lo, hi) {
    if (lo >= hi) {
      if (lo === hi) sorted.add(lo)
      return
    }
    const pivot = arr[hi]
    steps.push({
      state: { array: clone(arr), range: [lo, hi] },
      highlights: H({ pivot: hi, sorted: Array.from(sorted) }),
      variables: { lo, hi, pivot, comparisons },
      codeLine: 'const pivot = a[hi];',
      explanation: `Choose pivot = arr[${hi}] = ${pivot}.`,
    })
    let i = lo - 1
    for (let j = lo; j < hi; j++) {
      comparisons++
      steps.push({
        state: { array: clone(arr), range: [lo, hi] },
        highlights: H({ pivot: hi, comparing: [j], sorted: Array.from(sorted) }),
        variables: { lo, hi, i, j, pivot, comparisons },
        codeLine: 'if (a[j] < pivot)',
        explanation: `Compare arr[${j}]=${arr[j]} with pivot=${pivot}.`,
      })
      if (arr[j] < pivot) {
        i++
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
        steps.push({
          state: { array: clone(arr), range: [lo, hi] },
          highlights: H({ pivot: hi, current: i, sorted: Array.from(sorted) }),
          variables: { lo, hi, i, j, pivot, comparisons },
          codeLine: '[a[i], a[j]] = [a[j], a[i]]',
          explanation: `Swap arr[${i}] and arr[${j}].`,
        })
      }
    }
    const tmp = arr[i + 1]; arr[i + 1] = arr[hi]; arr[hi] = tmp
    sorted.add(i + 1)
    steps.push({
      state: { array: clone(arr) },
      highlights: H({ sorted: Array.from(sorted) }),
      variables: { lo, hi, pivotIdx: i + 1, comparisons },
      codeLine: '[a[i+1], a[hi]] = [a[hi], a[i+1]]',
      explanation: `Place pivot at index ${i + 1}. Recurse on [${lo}..${i}] and [${i + 2}..${hi}].`,
    })
    rec(lo, i)
    rec(i + 2, hi)
  }
  steps.push({
    state: { array: clone(arr) },
    highlights: H(),
    variables: { comparisons },
    codeLine: 'quickSort(a, 0, a.length-1);',
    explanation: 'Start: pick a pivot, partition, recurse on each side.',
  })
  rec(0, arr.length - 1)
  steps.push({
    state: { array: clone(arr) },
    highlights: H({ sorted: Array.from({ length: arr.length }, (_, k) => k) }),
    variables: { comparisons },
    codeLine: 'return a;',
    explanation: `Done. ${comparisons} comparisons.`,
  })
  return steps
}

function heapSort(input) {
  const arr = clone(input)
  const steps = []
  let comparisons = 0
  const n = arr.length

  function heapify(i, size) {
    let largest = i
    const l = 2 * i + 1
    const r = 2 * i + 2
    if (l < size) {
      comparisons++
      steps.push({
        state: { array: clone(arr), heap: { i, l, r, size } },
        highlights: H({ current: i, comparing: [l], sorted: [] }),
        variables: { i, l, r, size, comparisons },
        codeLine: 'if (l < size && a[l] > a[largest])',
        explanation: `Compare a[${l}]=${arr[l]} with a[${largest}]=${arr[largest]}.`,
      })
      if (arr[l] > arr[largest]) largest = l
    }
    if (r < size) {
      comparisons++
      steps.push({
        state: { array: clone(arr), heap: { i, l, r, size } },
        highlights: H({ current: i, comparing: [r], sorted: [] }),
        variables: { i, l, r, size, comparisons },
        codeLine: 'if (r < size && a[r] > a[largest])',
        explanation: `Compare a[${r}]=${arr[r]} with a[${largest}]=${arr[largest]}.`,
      })
      if (arr[r] > arr[largest]) largest = r
    }
    if (largest !== i) {
      const tmp = arr[i]; arr[i] = arr[largest]; arr[largest] = tmp
      steps.push({
        state: { array: clone(arr), heap: { i, largest, size } },
        highlights: H({ current: i, comparing: [largest] }),
        variables: { i, largest, comparisons },
        codeLine: '[a[i], a[largest]] = [a[largest], a[i]]',
        explanation: `Swap a[${i}] and a[${largest}].`,
      })
      heapify(largest, size)
    }
  }

  steps.push({
    state: { array: clone(arr) },
    highlights: H(),
    variables: { comparisons },
    codeLine: 'buildMaxHeap(a);',
    explanation: 'Start: build a max-heap in-place.',
  })
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(i, n)

  const sorted = []
  for (let size = n - 1; size > 0; size--) {
    const tmp = arr[0]; arr[0] = arr[size]; arr[size] = tmp
    sorted.unshift(size)
    steps.push({
      state: { array: clone(arr) },
      highlights: H({ sorted: [...sorted] }),
      variables: { size, comparisons },
      codeLine: '[a[0], a[size]] = [a[size], a[0]]',
      explanation: `Move max (${arr[size]}) to index ${size}.`,
    })
    heapify(0, size)
  }
  sorted.unshift(0)
  steps.push({
    state: { array: clone(arr) },
    highlights: H({ sorted: Array.from({ length: arr.length }, (_, k) => k) }),
    variables: { comparisons },
    codeLine: 'return a;',
    explanation: `Done. ${comparisons} comparisons.`,
  })
  return steps
}

function binarySearch(input, target) {
  const arr = clone(input)
  const steps = []
  let lo = 0, hi = arr.length - 1
  let comparisons = 0

  steps.push({
    state: { array: clone(arr) },
    highlights: H({ pointers: { lo, hi, mid: null }, target }),
    variables: { lo, hi, mid: null, target, comparisons },
    codeLine: 'lo = 0, hi = a.length - 1;',
    explanation: `Binary search for ${target} in sorted array.`,
  })
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    comparisons++
    steps.push({
      state: { array: clone(arr) },
      highlights: H({ current: mid, pointers: { lo, hi, mid }, target }),
      variables: { lo, hi, mid, target, comparisons },
      codeLine: 'const mid = (lo + hi) >> 1;',
      explanation: `lo=${lo}, hi=${hi}, mid=${mid}, a[${mid}]=${arr[mid]}.`,
    })
    if (arr[mid] === target) {
      steps.push({
        state: { array: clone(arr) },
        highlights: H({ comparing: [mid], pointers: { lo, hi, mid }, target }),
        variables: { lo, hi, mid, target, comparisons, found: true },
        codeLine: 'return mid;',
        explanation: `Found ${target} at index ${mid}.`,
      })
      return steps
    }
    if (arr[mid] < target) lo = mid + 1
    else hi = mid - 1
    steps.push({
      state: { array: clone(arr) },
      highlights: H({ pointers: { lo, hi, mid }, target }),
      variables: { lo, hi, mid, target, comparisons },
      codeLine: arr[mid] < target ? 'lo = mid + 1;' : 'hi = mid - 1;',
      explanation: arr[mid] < target
        ? `a[${mid}]=${arr[mid]} < ${target}, search right half.`
        : `a[${mid}]=${arr[mid]} > ${target}, search left half.`,
    })
  }
  steps.push({
    state: { array: clone(arr) },
    highlights: H({ target }),
    variables: { lo, hi, target, comparisons, found: false },
    codeLine: 'return -1;',
    explanation: `${target} not in the array. ${comparisons} comparisons.`,
  })
  return steps
}

function linearSearch(input, target) {
  const arr = clone(input)
  const steps = []
  let comparisons = 0
  for (let i = 0; i < arr.length; i++) {
    comparisons++
    steps.push({
      state: { array: clone(arr) },
      highlights: H({ current: i, target }),
      variables: { i, target, comparisons },
      codeLine: 'if (a[i] === target) return i;',
      explanation: `Check a[${i}]=${arr[i]}.`,
    })
    if (arr[i] === target) {
      steps.push({
        state: { array: clone(arr) },
        highlights: H({ comparing: [i], target }),
        variables: { i, target, comparisons, found: true },
        codeLine: 'return i;',
        explanation: `Found ${target} at index ${i}.`,
      })
      return steps
    }
  }
  steps.push({
    state: { array: clone(arr) },
    highlights: H({ target }),
    variables: { target, comparisons, found: false },
    codeLine: 'return -1;',
    explanation: `Not found. ${comparisons} comparisons.`,
  })
  return steps
}

function twoSumSorted(input, target) {
  const arr = clone(input)
  const steps = []
  let l = 0, r = arr.length - 1
  steps.push({
    state: { array: clone(arr) },
    highlights: H({ pointers: { l, r }, target }),
    variables: { l, r, target, sum: arr[l] + arr[r] },
    codeLine: 'let l = 0, r = a.length - 1;',
    explanation: `Two-pointer search for pair summing to ${target}.`,
  })
  while (l < r) {
    const sum = arr[l] + arr[r]
    steps.push({
      state: { array: clone(arr) },
      highlights: H({ current: l, comparing: [r], pointers: { l, r }, target }),
      variables: { l, r, target, sum },
      codeLine: 'const sum = a[l] + a[r];',
      explanation: `a[${l}]=${arr[l]} + a[${r}]=${arr[r]} = ${sum}.`,
    })
    if (sum === target) {
      steps.push({
        state: { array: clone(arr) },
        highlights: H({ comparing: [l, r], target }),
        variables: { l, r, target, sum, found: true },
        codeLine: 'return [l, r];',
        explanation: `Found pair (${arr[l]}, ${arr[r]}) at (${l}, ${r}).`,
      })
      return steps
    }
    if (sum < target) {
      l++
      steps.push({
        state: { array: clone(arr) },
        highlights: H({ pointers: { l, r }, target }),
        variables: { l, r, target, sum },
        codeLine: 'l++;',
        explanation: `Sum too small, advance left pointer.`,
      })
    } else {
      r--
      steps.push({
        state: { array: clone(arr) },
        highlights: H({ pointers: { l, r }, target }),
        variables: { l, r, target, sum },
        codeLine: 'r--;',
        explanation: `Sum too large, retreat right pointer.`,
      })
    }
  }
  steps.push({
    state: { array: clone(arr) },
    highlights: H({ target }),
    variables: { target, found: false },
    codeLine: 'return [];',
    explanation: 'No pair found.',
  })
  return steps
}

function slidingWindowMax(input, k) {
  const arr = clone(input)
  const steps = []
  const deque = []
  const result = []

  steps.push({
    state: { array: clone(arr), window: [0, -1] },
    highlights: H({ window: [], pointers: { deque: '[]' } }),
    variables: { k, deque: [], result: [] },
    codeLine: 'let deque = []; // store indices of useful elements',
    explanation: `Find max in every window of size ${k}.`,
  })
  for (let i = 0; i < arr.length; i++) {
    steps.push({
      state: { array: clone(arr), window: [Math.max(0, i - k + 1), i] },
      highlights: H({ current: i, window: rangeSet(Math.max(0, i - k + 1), i) }),
      variables: { i, k, deque: [...deque], result: [...result] },
      codeLine: 'while (deque && a[deque.back] < a[i]) deque.pop_back();',
      explanation: `Add a[${i}]=${arr[i]} to deque; evict smaller indices from the back.`,
    })
    while (deque.length && arr[deque[deque.length - 1]] < arr[i]) deque.pop()
    deque.push(i)
    steps.push({
      state: { array: clone(arr) },
      highlights: H({ current: i, pointers: { deque: `[${deque.join(', ')}]` } }),
      variables: { i, k, deque: [...deque] },
      codeLine: 'deque.push_back(i);',
      explanation: `Deque now holds [${deque.join(', ')}].`,
    })
    if (deque[0] <= i - k) {
      deque.shift()
      steps.push({
        state: { array: clone(arr) },
        highlights: H({ current: i }),
        variables: { i, k, deque: [...deque] },
        codeLine: 'if (deque.front <= i - k) deque.pop_front();',
        explanation: `Drop front (out of window). Deque: [${deque.join(', ')}].`,
      })
    }
    if (i >= k - 1) {
      result.push(arr[deque[0]])
      steps.push({
        state: { array: clone(arr) },
        highlights: H({ current: deque[0], window: rangeSet(i - k + 1, i) }),
        variables: { i, k, deque: [...deque], result: [...result] },
        codeLine: 'result.push(a[deque.front]);',
        explanation: `Window max = a[${deque[0]}]=${arr[deque[0]]}. Result: [${result.join(', ')}].`,
      })
    }
  }
  steps.push({
    state: { array: clone(arr) },
    highlights: H(),
    variables: { result },
    codeLine: 'return result;',
    explanation: `Done. Result = [${result.join(', ')}].`,
  })
  return steps
}

function rangeSet(lo, hi) {
  const out = []
  for (let i = lo; i <= hi; i++) out.push(i)
  return out
}

function reverseLinkedList(input) {
  const arr = clone(input)
  const steps = []
  let prev = null, curr = 0
  const n = arr.length

  steps.push({
    state: {
      nodes: arr.map((v, idx) => ({ val: v, next: idx < n - 1 ? idx + 1 : null })),
      pointers: { prev: null, curr: 0 },
    },
    highlights: { head: 0, current: 0, pointers: { prev: 'NULL', curr: '0' } },
    variables: { prev: null, curr: 0, next: null },
    codeLine: 'let prev = null, curr = head;',
    explanation: 'Reverse the list in place. prev starts as NULL.',
  })

  while (curr != null) {
    const nextVal = curr + 1 <= n - 1 ? curr + 1 : null
    steps.push({
      state: { nodes: arr.map(v => ({ val: v, next: null })), pointers: { prev, curr } },
      highlights: { current: curr, pointers: { prev: prev === null ? 'NULL' : prev, curr, next: nextVal } },
      variables: { prev, curr, next: nextVal },
      codeLine: 'const next = curr.next;',
      explanation: `Save next = ${nextVal === null ? 'NULL' : `node ${nextVal}`}.`,
    })
    steps.push({
      state: { nodes: arr.map(v => ({ val: v, next: null })), pointers: { prev, curr } },
      highlights: { current: curr, pointers: { prev, curr } },
      variables: { prev, curr },
      codeLine: 'curr.next = prev;',
      explanation: `Point curr.next to prev=${prev === null ? 'NULL' : prev}.`,
    })
    prev = curr
    curr = nextVal
    steps.push({
      state: { nodes: arr.map(v => ({ val: v, next: null })), pointers: { prev, curr } },
      highlights: { head: prev, current: prev, pointers: { prev, curr: curr === null ? 'NULL' : curr } },
      variables: { prev, curr },
      codeLine: 'prev = curr; curr = next;',
      explanation: `Advance: prev=${prev}, curr=${curr === null ? 'NULL' : curr}.`,
    })
  }
  steps.push({
    state: { nodes: arr.map(v => ({ val: v, next: null })), pointers: { head: prev } },
    highlights: { head: prev, pointers: { head: prev } },
    variables: { prev },
    codeLine: 'return prev;',
    explanation: `Done. New head is node ${prev}.`,
  })
  return steps
}

function detectCycle(input) {

  const arr = clone(input)
  const steps = []
  steps.push({
    state: { nodes: arr.map(v => ({ val: v, next: null })) },
    highlights: { head: 0, pointers: { slow: '0', fast: '0' } },
    variables: { slow: 0, fast: 0 },
    codeLine: 'let slow = head, fast = head;',
    explanation: 'Floyd’s cycle detection: pointers meet iff a cycle exists.',
  })
  let slow = 0, fast = 0

  for (let i = 0; i < arr.length; i++) {
    slow = Math.min(slow + 1, arr.length - 1)
    fast = Math.min(fast + 2, arr.length - 1)
    steps.push({
      state: { nodes: arr.map(v => ({ val: v, next: null })) },
      highlights: { current: slow, comparing: [fast], pointers: { slow, fast } },
      variables: { slow, fast, i },
      codeLine: 'slow = slow.next; fast = fast.next.next;',
      explanation: `Step ${i + 1}: slow=${slow}, fast=${fast}.`,
    })
    if (slow === fast) {
      steps.push({
        state: { nodes: arr.map(v => ({ val: v, next: null })) },
        highlights: { current: slow, pointers: { slow, fast } },
        variables: { slow, fast, found: true },
        codeLine: 'return true;',
        explanation: `Pointers met at node ${slow}. Cycle exists.`,
      })
      return steps
    }
  }
  steps.push({
    state: { nodes: arr.map(v => ({ val: v, next: null })) },
    highlights: { head: 0, pointers: { slow: 'NULL', fast: 'NULL' } },
    variables: { found: false },
    codeLine: 'return false;',
    explanation: 'fast reached NULL — no cycle.',
  })
  return steps
}

function validParentheses(input) {

  const s = input
  const steps = []
  const stack = []
  const pairs = { ')': '(', ']': '[', '}': '{' }
  const isOpen = (c) => c === '(' || c === '[' || c === '{'
  steps.push({
    state: { stack: [], input: s, index: null },
    highlights: { stack: [] },
    variables: { i: null, stack: [] },
    codeLine: 'let stack = [];',
    explanation: `Validate parentheses in "${s}".`,
  })
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    steps.push({
      state: { stack: [...stack], input: s, index: i },
      highlights: { stack: [...stack] },
      variables: { i, char: c, stack: [...stack] },
      codeLine: isOpen(c) ? 'if (open) stack.push(c);' : 'if (close) stack.pop();',
      explanation: `Read '${c}' at index ${i}.`,
    })
    if (isOpen(c)) {
      stack.push(c)
      steps.push({
        state: { stack: [...stack], input: s, index: i },
        highlights: { newItem: stack.length - 1, stack: [...stack] },
        variables: { i, char: c, stack: [...stack] },
        codeLine: 'stack.push(c);',
        explanation: `Push '${c}' onto the stack.`,
      })
    } else {
      if (!stack.length || stack[stack.length - 1] !== pairs[c]) {
        steps.push({
          state: { stack: [...stack], input: s, index: i },
          highlights: { top: stack.length - 1, stack: [...stack] },
          variables: { i, char: c, stack: [...stack], invalid: true },
          codeLine: 'return false;',
          explanation: `'${c}' doesn't match top of stack. Invalid.`,
        })
        return steps
      }
      stack.pop()
      steps.push({
        state: { stack: [...stack], input: s, index: i },
        highlights: { removing: stack.length, stack: [...stack] },
        variables: { i, char: c, stack: [...stack] },
        codeLine: 'stack.pop();',
        explanation: `Pop matching '${pairs[c]}'.`,
      })
    }
  }
  steps.push({
    state: { stack: [...stack], input: s },
    highlights: { stack: [...stack] },
    variables: { stack: [...stack], valid: stack.length === 0 },
    codeLine: 'return stack.length === 0;',
    explanation: stack.length === 0 ? 'Stack empty — string is valid.' : 'Stack not empty — invalid.',
  })
  return steps
}

function bstInsert(flatTree, value) {

  const arr = clone(flatTree).filter(v => v !== null && v !== undefined)
  const steps = []
  steps.push({
    state: { tree: arrToBST(arr), highlight: { current: arr[0] } },
    highlights: {},
    variables: { value, current: arr[0] },
    codeLine: 'insert(root, value);',
    explanation: `Insert ${value} into the BST.`,
  })
  const inserted = bstInsertHelper(arrToBST(arr), value, steps)
  steps.push({
    state: { tree: inserted },
    highlights: { current: value },
    variables: { value, done: true },
    codeLine: 'return root;',
    explanation: `Inserted ${value}.`,
  })
  return steps
}

function arrToBST(arr) {
  if (!arr.length) return null

  const sorted = [...arr].sort((a, b) => a - b)
  const build = (lo, hi) => {
    if (lo > hi) return null
    const mid = Math.floor((lo + hi) / 2)
    return { val: sorted[mid], left: build(lo, mid - 1), right: build(mid + 1, hi) }
  }
  return build(0, sorted.length - 1)
}

function bstInsertHelper(root, value, steps) {
  if (!root) return { val: value, left: null, right: null }
  steps.push({
    state: { tree: cloneTree(root), highlight: { current: root.val } },
    highlights: {},
    variables: { value, current: root.val },
    codeLine: 'if (value < node.val) node.left = insert(...);',
    explanation: `Compare ${value} with ${root.val}.`,
  })
  if (value < root.val) {
    root.left = bstInsertHelper(root.left, value, steps)
  } else if (value > root.val) {
    root.right = bstInsertHelper(root.right, value, steps)
  }
  return root
}

function cloneTree(node) {
  if (!node) return null
  return { val: node.val, left: cloneTree(node.left), right: cloneTree(node.right) }
}

function bfsGraph(input) {

  const data = clone(input)
  const steps = []
  const visited = new Set()
  const queue = [data.source]
  visited.add(data.source)
  steps.push({
    state: { nodes: data.nodes, edges: data.edges, current: data.source, visited: Array.from(visited), queue: [...queue] },
    highlights: { current: data.source, visited: Array.from(visited), queue: [...queue] },
    variables: { source: data.source, visited: Array.from(visited), queue: [...queue] },
    codeLine: 'queue.enqueue(source); visited.add(source);',
    explanation: `BFS from ${data.source}.`,
  })
  while (queue.length) {
    const u = queue.shift()
    steps.push({
      state: { nodes: data.nodes, edges: data.edges, current: u, visited: Array.from(visited), queue: [...queue] },
      highlights: { current: u, visited: Array.from(visited), queue: [...queue] },
      variables: { u, visited: Array.from(visited), queue: [...queue] },
      codeLine: 'const u = queue.dequeue();',
      explanation: `Visit ${u}.`,
    })
    const neighbors = data.edges.filter(([f, _t]) => f === u).map(([, v]) => v)
      .concat(data.edges.filter(([, v]) => v === u && !data.directed).map(([f]) => f))
    for (const v of neighbors) {
      steps.push({
        state: { nodes: data.nodes, edges: data.edges, current: u, currentEdge: [u, v], visited: Array.from(visited), queue: [...queue] },
        highlights: { current: u, currentEdge: [u, v], visited: Array.from(visited), queue: [...queue] },
        variables: { u, v, visited: Array.from(visited), queue: [...queue] },
        codeLine: 'for (v of neighbors) if (!visited.has(v)) ...',
        explanation: `Check neighbor ${v}.`,
      })
      if (!visited.has(v)) {
        visited.add(v)
        queue.push(v)
        steps.push({
          state: { nodes: data.nodes, edges: data.edges, current: v, visited: Array.from(visited), queue: [...queue] },
          highlights: { current: v, visited: Array.from(visited), queue: [...queue] },
          variables: { v, visited: Array.from(visited), queue: [...queue] },
          codeLine: 'visited.add(v); queue.enqueue(v);',
          explanation: `Enqueue ${v}.`,
        })
      }
    }
  }
  steps.push({
    state: { nodes: data.nodes, edges: data.edges, visited: Array.from(visited), queue: [] },
    highlights: { visited: Array.from(visited) },
    variables: { visited: Array.from(visited) },
    codeLine: 'return visited;',
    explanation: `BFS done. Reached ${visited.size} nodes.`,
  })
  return steps
}

function dijkstra(input) {
  const data = clone(input)
  const steps = []
  const dist = {}
  const visited = new Set()
  const heap = []
  data.nodes.forEach(n => { dist[n.id] = Infinity })
  dist[data.source] = 0
  heap.push([0, data.source])
  steps.push({
    state: { nodes: data.nodes, edges: data.edges, dist: { ...dist }, visited: Array.from(visited), heap: [[0, data.source]] },
    highlights: { current: data.source, heap: [data.source] },
    variables: { dist: { ...dist }, visited: Array.from(visited), heap: [[0, data.source]] },
    codeLine: 'dist[source] = 0; heap.push([0, source]);',
    explanation: `Dijkstra from ${data.source}.`,
  })
  while (heap.length) {
    heap.sort((a, b) => a[0] - b[0])
    const [d, u] = heap.shift()
    if (visited.has(u)) continue
    visited.add(u)
    steps.push({
      state: { nodes: data.nodes, edges: data.edges, dist: { ...dist }, visited: Array.from(visited), heap: heap.map(([, n]) => n) },
      highlights: { current: u, visited: Array.from(visited), heap: heap.map(([, n]) => n) },
      variables: { u, dist: { ...dist }, visited: Array.from(visited) },
      codeLine: 'const [d, u] = heap.pop();',
      explanation: `Finalize ${u} at distance ${d}.`,
    })
    const edges = data.edges.filter(([f]) => f === u)
    for (const [, v, w] of edges) {
      steps.push({
        state: { nodes: data.nodes, edges: data.edges, currentEdge: [u, v], dist: { ...dist }, visited: Array.from(visited) },
        highlights: { current: u, currentEdge: [u, v], visited: Array.from(visited) },
        variables: { u, v, weight: w, dist: { ...dist } },
        codeLine: 'if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;',
        explanation: `Edge ${u}→${v} weight ${w}. dist[${v}] candidate = ${dist[u] + w}.`,
      })
      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w
        heap.push([dist[v], v])
        steps.push({
          state: { nodes: data.nodes, edges: data.edges, dist: { ...dist }, visited: Array.from(visited) },
          highlights: { current: v, visited: Array.from(visited) },
          variables: { v, dist: { ...dist } },
          codeLine: 'dist[v] = dist[u] + w;',
          explanation: `Updated dist[${v}] = ${dist[v]}.`,
        })
      }
    }
  }
  steps.push({
    state: { nodes: data.nodes, edges: data.edges, dist: { ...dist }, visited: Array.from(visited) },
    highlights: { visited: Array.from(visited) },
    variables: { dist: { ...dist } },
    codeLine: 'return dist;',
    explanation: `Done. Final distances: ${JSON.stringify(dist)}.`,
  })
  return steps
}

function fibDp(input) {
  const n = input
  const steps = []
  const dp = [0, 1]
  for (let i = 2; i <= n; i++) dp.push(null)
  steps.push({
    state: { table: [[0, 1, ...Array(Math.max(0, n - 1)).fill(null)]] },
    highlights: { computed: [{ row: 0, col: 0 }, { row: 0, col: 1 }] },
    variables: { n, dp: [...dp] },
    codeLine: 'dp[0] = 0, dp[1] = 1;',
    explanation: `Compute Fibonacci(${n}) bottom-up.`,
  })
  for (let i = 2; i <= n; i++) {
    steps.push({
      state: { table: [[...dp]] },
      highlights: { current: { row: 0, col: i }, dependencies: [{ row: 0, col: i - 1 }, { row: 0, col: i - 2 }] },
      variables: { i, dp: [...dp] },
      codeLine: 'dp[i] = dp[i-1] + dp[i-2];',
      explanation: `dp[${i}] = dp[${i - 1}] + dp[${i - 2}].`,
    })
    dp[i] = dp[i - 1] + dp[i - 2]
    steps.push({
      state: { table: [[...dp]] },
      highlights: { computed: dp.map((_, k) => ({ row: 0, col: k })) },
      variables: { i, dp: [...dp] },
      codeLine: '// written',
      explanation: `dp[${i}] = ${dp[i]}.`,
    })
  }
  steps.push({
    state: { table: [[...dp]] },
    highlights: { result: { row: 0, col: n }, computed: dp.map((_, k) => ({ row: 0, col: k })) },
    variables: { result: dp[n] },
    codeLine: 'return dp[n];',
    explanation: `Fibonacci(${n}) = ${dp[n]}.`,
  })
  return steps
}

function coinChange(input) {
  const { amount, coins } = input
  const steps = []
  const dp = Array(amount + 1).fill(Infinity)
  dp[0] = 0
  steps.push({
    state: { table: [dp.slice()] },
    highlights: { computed: [{ row: 0, col: 0 }] },
    variables: { amount, coins, dp: [...dp] },
    codeLine: 'dp[0] = 0; dp[i] = Infinity for i > 0;',
    explanation: `Fewest coins to make ${amount} from ${JSON.stringify(coins)}.`,
  })
  for (let i = 1; i <= amount; i++) {
    for (const c of coins) {
      if (i - c >= 0 && dp[i - c] + 1 < dp[i]) {
        dp[i] = dp[i - c] + 1
        steps.push({
          state: { table: [dp.slice()] },
          highlights: { current: { row: 0, col: i }, dependencies: [{ row: 0, col: i - c }] },
          variables: { i, coin: c, dp: [...dp] },
          codeLine: 'dp[i] = min(dp[i], dp[i - coin] + 1);',
          explanation: `Using coin ${c}: dp[${i}] = min(…, dp[${i - c}] + 1) = ${dp[i]}.`,
        })
      }
    }
  }
  steps.push({
    state: { table: [dp.slice()] },
    highlights: { result: { row: 0, col: amount }, computed: dp.map((_, k) => ({ row: 0, col: k })) },
    variables: { result: dp[amount] === Infinity ? -1 : dp[amount] },
    codeLine: 'return dp[amount] === Infinity ? -1 : dp[amount];',
    explanation: dp[amount] === Infinity ? `Impossible to make ${amount}.` : `Min coins = ${dp[amount]}.`,
  })
  return steps
}

export const ALGORITHMS = {

  'bubble-sort': {
    id: 'bubble-sort', name: 'Bubble Sort', category: 'sorting', difficulty: 'Easy',
    timeComplexity: 'O(n²)', spaceComplexity: 'O(1)',
    description: 'Repeatedly swap adjacent out-of-order pairs.',
    presets: {
      Standard: { input: [5, 3, 8, 1, 9, 2, 4], label: 'Standard' },
      Reversed: { input: [9, 7, 5, 3, 1], label: 'Reverse Sorted' },
      Sorted: { input: [1, 2, 3, 4, 5], label: 'Already Sorted' },
      AllEqual: { input: [4, 4, 4, 4], label: 'All Equal' },
    },
    code: {
      javascript: `function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    let swapped = false;
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  return arr;
}`,
      python: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
                swapped = True
        if not swapped:
            break
    return arr`,
      java: `static void bubbleSort(int[] arr) {
    for (int i = 0; i < arr.length; i++) {
        boolean swapped = false;
        for (int j = 0; j < arr.length - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int t = arr[j]; arr[j] = arr[j+1]; arr[j+1] = t;
                swapped = true;
            }
        }
        if (!swapped) break;
    }
}`,
      cpp: `void bubbleSort(vector<int>& a) {
    for (int i = 0; i < a.size(); i++) {
        bool s = false;
        for (int j = 0; j < a.size() - i - 1; j++)
            if (a[j] > a[j+1]) { swap(a[j], a[j+1]); s = true; }
        if (!s) break;
    }
}`,
      pseudocode: `for i in 0..n-1:
  swapped = false
  for j in 0..n-i-2:
    if a[j] > a[j+1]:
      swap(a[j], a[j+1])
      swapped = true
  if not swapped: break`,
    },
    steps: bubbleSort,
  },
  'selection-sort': {
    id: 'selection-sort', name: 'Selection Sort', category: 'sorting', difficulty: 'Easy',
    timeComplexity: 'O(n²)', spaceComplexity: 'O(1)',
    description: 'Repeatedly select the minimum and swap it to the front.',
    presets: {
      Standard: { input: [29, 10, 14, 37, 13], label: 'Standard' },
      Reversed: { input: [9, 7, 5, 3, 1], label: 'Reverse Sorted' },
      Sorted: { input: [1, 2, 3, 4, 5], label: 'Already Sorted' },
    },
    code: {
      javascript: `function selectionSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    let minIdx = i;
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[j] < arr[minIdx]) minIdx = j;
    }
    if (minIdx !== i) [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
  }
  return arr;
}`,
      python: `def selection_sort(arr):
    for i in range(len(arr)):
        min_i = i
        for j in range(i+1, len(arr)):
            if arr[j] < arr[min_i]:
                min_i = j
        arr[i], arr[min_i] = arr[min_i], arr[i]
    return arr`,
      java: `static void selectionSort(int[] a) {
    for (int i = 0; i < a.length; i++) {
        int m = i;
        for (int j = i+1; j < a.length; j++)
            if (a[j] < a[m]) m = j;
        int t = a[i]; a[i] = a[m]; a[m] = t;
    }
}`,
      cpp: `void selectionSort(vector<int>& a) {
    for (int i = 0; i < a.size(); i++) {
        int m = i;
        for (int j = i+1; j < a.size(); j++) if (a[j] < a[m]) m = j;
        swap(a[i], a[m]);
    }
}`,
      pseudocode: `for i in 0..n-1:
  min = i
  for j in i+1..n-1:
    if a[j] < a[min]: min = j
  swap(a[i], a[min])`,
    },
    steps: selectionSort,
  },
  'insertion-sort': {
    id: 'insertion-sort', name: 'Insertion Sort', category: 'sorting', difficulty: 'Easy',
    timeComplexity: 'O(n²)', spaceComplexity: 'O(1)',
    description: 'Build the sorted array one element at a time.',
    presets: {
      Standard: { input: [5, 2, 4, 6, 1, 3], label: 'Standard' },
      Reversed: { input: [5, 4, 3, 2, 1], label: 'Worst Case' },
      Sorted: { input: [1, 2, 3, 4, 5], label: 'Best Case' },
    },
    code: {
      javascript: `function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = key;
  }
  return arr;
}`,
      python: `def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]; j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j+1] = arr[j]; j -= 1
        arr[j+1] = key
    return arr`,
      java: `static void insertionSort(int[] a) {
    for (int i = 1; i < a.length; i++) {
        int k = a[i], j = i - 1;
        while (j >= 0 && a[j] > k) { a[j+1] = a[j]; j--; }
        a[j+1] = k;
    }
}`,
      cpp: `void insertionSort(vector<int>& a) {
    for (int i = 1; i < a.size(); i++) {
        int k = a[i], j = i - 1;
        while (j >= 0 && a[j] > k) { a[j+1] = a[j]; j--; }
        a[j+1] = k;
    }
}`,
      pseudocode: `for i in 1..n-1:
  key = a[i]; j = i-1
  while j >= 0 and a[j] > key:
    a[j+1] = a[j]; j--
  a[j+1] = key`,
    },
    steps: insertionSort,
  },
  'merge-sort': {
    id: 'merge-sort', name: 'Merge Sort', category: 'sorting', difficulty: 'Medium',
    timeComplexity: 'O(n log n)', spaceComplexity: 'O(n)',
    description: 'Recursively split, then merge sorted halves.',
    presets: {
      Standard: { input: [38, 27, 43, 3, 9, 82, 10], label: 'Standard' },
      Reversed: { input: [8, 7, 6, 5, 4, 3, 2, 1], label: 'Reverse Sorted' },
      NearlySorted: { input: [1, 2, 4, 3, 5, 6, 8, 7], label: 'Nearly Sorted' },
    },
    code: {
      javascript: `function mergeSort(a, lo = 0, hi = a.length - 1) {
  if (lo >= hi) return;
  const mid = (lo + hi) >> 1;
  mergeSort(a, lo, mid);
  mergeSort(a, mid + 1, hi);
  merge(a, lo, mid, hi);
}
function merge(a, lo, mid, hi) {
  const L = a.slice(lo, mid + 1), R = a.slice(mid + 1, hi + 1);
  let i = 0, j = 0, k = lo;
  while (i < L.length && j < R.length) a[k++] = L[i] <= R[j] ? L[i++] : R[j++];
  while (i < L.length) a[k++] = L[i++];
  while (j < R.length) a[k++] = R[j++];
}`,
      python: `def merge_sort(a, lo=0, hi=None):
    if hi is None: hi = len(a) - 1
    if lo >= hi: return
    mid = (lo + hi) // 2
    merge_sort(a, lo, mid); merge_sort(a, mid+1, hi)
    L, R = a[lo:mid+1], a[mid+1:hi+1]
    i = j = 0; k = lo
    while i < len(L) and j < len(R):
        if L[i] <= R[j]: a[k] = L[i]; i += 1
        else: a[k] = R[j]; j += 1
        k += 1
    a[k:k+len(L)-i] = L[i:]
    a[k:k+len(R)-j] = R[j:]`,
      java: `static void mergeSort(int[] a, int lo, int hi) {
    if (lo >= hi) return;
    int m = (lo + hi) / 2;
    mergeSort(a, lo, m); mergeSort(a, m+1, hi);
    // standard merge using auxiliary array
}`,
      cpp: `void mergeSort(vector<int>& a, int lo, int hi) {
    if (lo >= hi) return;
    int m = (lo+hi)/2;
    mergeSort(a, lo, m); mergeSort(a, m+1, hi);
    // merge a[lo..m] and a[m+1..hi]
}`,
      pseudocode: `mergeSort(a, lo, hi):
  if lo >= hi: return
  mid = (lo + hi) / 2
  mergeSort(a, lo, mid)
  mergeSort(a, mid+1, hi)
  merge(a, lo, mid, hi)`,
    },
    steps: mergeSort,
  },
  'quick-sort': {
    id: 'quick-sort', name: 'Quick Sort', category: 'sorting', difficulty: 'Medium',
    timeComplexity: 'O(n log n) avg, O(n²) worst', spaceComplexity: 'O(log n)',
    description: 'Pick a pivot, partition, recurse on each side.',
    presets: {
      Standard: { input: [10, 7, 8, 9, 1, 5], label: 'Standard' },
      Reversed: { input: [9, 7, 5, 3, 1], label: 'Worst Case (already reversed)' },
      Sorted: { input: [1, 2, 3, 4, 5, 6], label: 'Sorted' },
    },
    code: {
      javascript: `function quickSort(a, lo = 0, hi = a.length - 1) {
  if (lo < hi) {
    const p = partition(a, lo, hi);
    quickSort(a, lo, p - 1);
    quickSort(a, p + 1, hi);
  }
}
function partition(a, lo, hi) {
  const pivot = a[hi];
  let i = lo - 1;
  for (let j = lo; j < hi; j++) {
    if (a[j] < pivot) { i++; [a[i], a[j]] = [a[j], a[i]]; }
  }
  [a[i+1], a[hi]] = [a[hi], a[i+1]];
  return i + 1;
}`,
      python: `def quick_sort(a, lo=0, hi=None):
    if hi is None: hi = len(a) - 1
    if lo < hi:
        p = partition(a, lo, hi)
        quick_sort(a, lo, p-1)
        quick_sort(a, p+1, hi)
def partition(a, lo, hi):
    pivot = a[hi]; i = lo - 1
    for j in range(lo, hi):
        if a[j] < pivot:
            i += 1; a[i], a[j] = a[j], a[i]
    a[i+1], a[hi] = a[hi], a[i+1]
    return i + 1`,
      java: `static void quickSort(int[] a, int lo, int hi) {
    if (lo < hi) {
        int p = partition(a, lo, hi);
        quickSort(a, lo, p-1); quickSort(a, p+1, hi);
    }
}`,
      cpp: `void quickSort(vector<int>& a, int lo, int hi) {
    if (lo < hi) {
        int p = partition(a, lo, hi);
        quickSort(a, lo, p-1); quickSort(a, p+1, hi);
    }
}`,
      pseudocode: `quickSort(a, lo, hi):
  if lo < hi:
    p = partition(a, lo, hi)
    quickSort(a, lo, p-1)
    quickSort(a, p+1, hi)`,
    },
    steps: quickSort,
  },
  'heap-sort': {
    id: 'heap-sort', name: 'Heap Sort', category: 'sorting', difficulty: 'Medium',
    timeComplexity: 'O(n log n)', spaceComplexity: 'O(1)',
    description: 'Build a max-heap, repeatedly extract the max.',
    presets: {
      Standard: { input: [4, 10, 3, 5, 1], label: 'Standard' },
      Reversed: { input: [9, 7, 5, 3, 1], label: 'Reverse Sorted' },
      Duplicates: { input: [5, 5, 3, 3, 1], label: 'With Duplicates' },
    },
    code: {
      javascript: `function heapSort(a) {
  const n = a.length;
  for (let i = Math.floor(n/2) - 1; i >= 0; i--) heapify(a, n, i);
  for (let end = n - 1; end > 0; end--) {
    [a[0], a[end]] = [a[end], a[0]];
    heapify(a, end, 0);
  }
}
function heapify(a, n, i) {
  let L = i; const l = 2*i+1, r = 2*i+2;
  if (l < n && a[l] > a[L]) L = l;
  if (r < n && a[r] > a[L]) L = r;
  if (L !== i) { [a[i], a[L]] = [a[L], a[i]]; heapify(a, n, L); }
}`,
      python: `def heap_sort(a):
    n = len(a)
    for i in range(n//2 - 1, -1, -1): heapify(a, n, i)
    for end in range(n-1, 0, -1):
        a[0], a[end] = a[end], a[0]; heapify(a, end, 0)
def heapify(a, n, i):
    L = i; l, r = 2*i+1, 2*i+2
    if l < n and a[l] > a[L]: L = l
    if r < n and a[r] > a[L]: L = r
    if L != i: a[i], a[L] = a[L], a[i]; heapify(a, n, L)`,
      java: `static void heapSort(int[] a) { /* heapify + extract */ }`,
      cpp: `void heapSort(vector<int>& a) { /* heapify + extract */ }`,
      pseudocode: `buildMaxHeap(a)
for end = n-1 downto 1:
  swap(a[0], a[end])
  heapify(a, end, 0)`,
    },
    steps: heapSort,
  },

  'binary-search': {
    id: 'binary-search', name: 'Binary Search', category: 'searching', difficulty: 'Easy',
    timeComplexity: 'O(log n)', spaceComplexity: 'O(1)',
    description: 'Find a target in a sorted array by halving the search space.',
    presets: {
      Standard: { input: [1, 3, 5, 7, 9, 11, 13, 15], target: 7, label: 'Find 7' },
      NotFound: { input: [1, 3, 5, 7, 9, 11, 13, 15], target: 8, label: 'Not Found' },
      FirstElem: { input: [1, 3, 5, 7, 9, 11, 13, 15], target: 1, label: 'Find First' },
      LastElem: { input: [1, 3, 5, 7, 9, 11, 13, 15], target: 15, label: 'Find Last' },
    },
    code: {
      javascript: `function binarySearch(a, t) {
  let lo = 0, hi = a.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (a[mid] === t) return mid;
    if (a[mid] < t) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`,
      python: `def binary_search(a, t):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == t: return mid
        if a[mid] < t: lo = mid + 1
        else: hi = mid - 1
    return -1`,
      java: `static int binarySearch(int[] a, int t) {
    int lo = 0, hi = a.length - 1;
    while (lo <= hi) {
        int m = (lo + hi) >>> 1;
        if (a[m] == t) return m;
        if (a[m] < t) lo = m + 1; else hi = m - 1;
    }
    return -1;
}`,
      cpp: `int binarySearch(const vector<int>& a, int t) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo <= hi) {
        int m = lo + (hi - lo) / 2;
        if (a[m] == t) return m;
        if (a[m] < t) lo = m + 1; else hi = m - 1;
    }
    return -1;
}`,
      pseudocode: `lo = 0; hi = n - 1
while lo <= hi:
  mid = (lo + hi) / 2
  if a[mid] == target: return mid
  if a[mid] < target: lo = mid + 1
  else: hi = mid - 1
return -1`,
    },
    steps: (input, target) => binarySearch(input, target ?? 7),
  },
  'linear-search': {
    id: 'linear-search', name: 'Linear Search', category: 'searching', difficulty: 'Easy',
    timeComplexity: 'O(n)', spaceComplexity: 'O(1)',
    description: 'Walk the array left to right until you find the target.',
    presets: {
      Standard: { input: [4, 2, 7, 1, 9, 3], target: 7, label: 'Find 7' },
      NotFound: { input: [4, 2, 7, 1, 9, 3], target: 5, label: 'Not Found' },
      First: { input: [4, 2, 7, 1, 9, 3], target: 4, label: 'Find First' },
    },
    code: {
      javascript: `function linearSearch(a, t) {
  for (let i = 0; i < a.length; i++)
    if (a[i] === t) return i;
  return -1;
}`,
      python: `def linear_search(a, t):
    for i, v in enumerate(a):
        if v == t: return i
    return -1`,
      java: `static int linearSearch(int[] a, int t) {
    for (int i = 0; i < a.length; i++) if (a[i] == t) return i;
    return -1;
}`,
      cpp: `int linearSearch(const vector<int>& a, int t) {
    for (int i = 0; i < a.size(); i++) if (a[i] == t) return i;
    return -1;
}`,
      pseudocode: `for i in 0..n-1:
  if a[i] == target: return i
return -1`,
    },
    steps: (input, target) => linearSearch(input, target ?? 7),
  },

  'two-sum-sorted': {
    id: 'two-sum-sorted', name: 'Two Sum (Sorted)', category: 'two-pointers', difficulty: 'Easy',
    timeComplexity: 'O(n)', spaceComplexity: 'O(1)',
    description: 'Find a pair that sums to a target in a sorted array.',
    presets: {
      Standard: { input: [1, 3, 4, 5, 7, 11], target: 9, label: 'Find 1+8=9' },
      NoPair: { input: [1, 3, 4, 5, 7, 11], target: 100, label: 'No Pair' },
      Negative: { input: [-3, -1, 0, 2, 4, 6], target: 3, label: 'With Negatives' },
    },
    code: {
      javascript: `function twoSum(a, t) {
  let l = 0, r = a.length - 1;
  while (l < r) {
    const s = a[l] + a[r];
    if (s === t) return [l, r];
    if (s < t) l++; else r--;
  }
  return [];
}`,
      python: `def two_sum(a, t):
    l, r = 0, len(a) - 1
    while l < r:
        s = a[l] + a[r]
        if s == t: return [l, r]
        if s < t: l += 1
        else: r -= 1
    return []`,
      java: `static int[] twoSum(int[] a, int t) {
    int l = 0, r = a.length - 1;
    while (l < r) {
        int s = a[l] + a[r];
        if (s == t) return new int[]{l, r};
        if (s < t) l++; else r--;
    }
    return new int[0];
}`,
      cpp: `vector<int> twoSum(const vector<int>& a, int t) {
    int l = 0, r = (int)a.size() - 1;
    while (l < r) {
        int s = a[l] + a[r];
        if (s == t) return {l, r};
        if (s < t) l++; else r--;
    }
    return {};
}`,
      pseudocode: `l = 0; r = n - 1
while l < r:
  s = a[l] + a[r]
  if s == target: return [l, r]
  if s < target: l++
  else: r--
return []`,
    },
    steps: (input, target) => twoSumSorted(input, target ?? 9),
  },

  'sliding-window-max': {
    id: 'sliding-window-max', name: 'Sliding Window Maximum', category: 'sliding-window', difficulty: 'Hard',
    timeComplexity: 'O(n)', spaceComplexity: 'O(k)',
    description: 'Max in every window of size k using a deque.',
    presets: {
      Standard: { input: [1, 3, -1, -3, 5, 3, 6, 7], k: 3, label: 'k=3' },
      k2: { input: [1, 3, -1, -3, 5, 3, 6, 7], k: 2, label: 'k=2' },
    },
    code: {
      javascript: `function maxSlidingWindow(a, k) {
  const dq = [], res = [];
  for (let i = 0; i < a.length; i++) {
    while (dq.length && a[dq[dq.length-1]] < a[i]) dq.pop();
    dq.push(i);
    if (dq[0] <= i - k) dq.shift();
    if (i >= k - 1) res.push(a[dq[0]]);
  }
  return res;
}`,
      python: `from collections import deque
def max_sliding_window(a, k):
    dq, res = deque(), []
    for i, x in enumerate(a):
        while dq and a[dq[-1]] < x: dq.pop()
        dq.append(i)
        if dq[0] <= i - k: dq.popleft()
        if i >= k - 1: res.append(a[dq[0]])
    return res`,
      java: `static int[] maxSlidingWindow(int[] a, int k) { /* deque */ return new int[0]; }`,
      cpp: `vector<int> maxSlidingWindow(const vector<int>& a, int k) { /* deque */ return {}; }`,
      pseudocode: `dq = []  // indices, decreasing a[dq[i]]
for i in 0..n-1:
  while dq not empty and a[dq.back] < a[i]: dq.pop_back
  dq.push_back(i)
  if dq.front <= i - k: dq.pop_front
  if i >= k - 1: result.push(a[dq.front])`,
    },
    steps: (input, k) => slidingWindowMax(input, k ?? 3),
  },

  'reverse-linked-list': {
    id: 'reverse-linked-list', name: 'Reverse Linked List', category: 'linked-list', difficulty: 'Easy',
    timeComplexity: 'O(n)', spaceComplexity: 'O(1)',
    description: 'Iteratively flip every next pointer.',
    presets: {
      Standard: { input: [1, 2, 3, 4, 5], label: '5 nodes' },
      TwoNodes: { input: [1, 2], label: '2 nodes' },
      Single: { input: [1], label: '1 node' },
    },
    code: {
      javascript: `function reverse(head) {
  let prev = null, curr = head;
  while (curr) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return prev;
}`,
      python: `def reverse(head):
    prev, curr = None, head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev`,
      java: `static ListNode reverse(ListNode h) {
    ListNode p = null, c = h;
    while (c != null) {
        ListNode n = c.next; c.next = p; p = c; c = n;
    }
    return p;
}`,
      cpp: `ListNode* reverse(ListNode* h) {
    ListNode *p = nullptr, *c = h;
    while (c) { auto n = c->next; c->next = p; p = c; c = n; }
    return p;
}`,
      pseudocode: `prev = null; curr = head
while curr:
  next = curr.next
  curr.next = prev
  prev = curr
  curr = next
return prev`,
    },
    steps: (input) => reverseLinkedList(input),
  },
  'detect-cycle': {
    id: 'detect-cycle', name: 'Detect Cycle (Floyd)', category: 'linked-list', difficulty: 'Easy',
    timeComplexity: 'O(n)', spaceComplexity: 'O(1)',
    description: 'Tortoise-and-hare: pointers meet iff a cycle exists.',
    presets: {
      Standard: { input: [1, 2, 3, 4, 5], label: 'No cycle (5 nodes)' },
    },
    code: {
      javascript: `function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}`,
      python: `def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next; fast = fast.next.next
        if slow is fast: return True
    return False`,
      java: `static boolean hasCycle(ListNode h) {
    ListNode s = h, f = h;
    while (f != null && f.next != null) {
        s = s.next; f = f.next.next;
        if (s == f) return true;
    }
    return false;
}`,
      cpp: `bool hasCycle(ListNode* h) {
    auto s = h, f = h;
    while (f && f->next) { s = s->next; f = f->next->next; if (s == f) return true; }
    return false;
}`,
      pseudocode: `slow = fast = head
while fast and fast.next:
  slow = slow.next
  fast = fast.next.next
  if slow == fast: return true
return false`,
    },
    steps: (input) => detectCycle(input),
  },

  'valid-parentheses': {
    id: 'valid-parentheses', name: 'Valid Parentheses', category: 'stack', difficulty: 'Easy',
    timeComplexity: 'O(n)', spaceComplexity: 'O(n)',
    description: 'Use a stack to match every closing bracket.',
    presets: {
      Standard: { input: '()[]{}', label: 'Standard' },
      Nested: { input: '([{}])', label: 'Nested' },
      Invalid: { input: '([)]', label: 'Interleaved (invalid)' },
      Empty: { input: '', label: 'Empty' },
    },
    code: {
      javascript: `function isValid(s) {
  const stack = [];
  const pairs = { ')':'(', ']':'[', '}':'{' };
  for (const c of s) {
    if ('([{'.includes(c)) stack.push(c);
    else if (stack.pop() !== pairs[c]) return false;
  }
  return stack.length === 0;
}`,
      python: `def is_valid(s):
    stack, pairs = [], {')':'(', ']':'[', '}':'{'}
    for c in s:
        if c in '([{': stack.append(c)
        elif not stack or stack.pop() != pairs[c]: return False
    return not stack`,
      java: `static boolean isValid(String s) {
    Deque<Character> st = new ArrayDeque<>();
    for (char c : s.toCharArray()) {
        if (c=='('||c=='['||c=='{') st.push(c);
        else if (st.isEmpty() || !match(st.pop(), c)) return false;
    }
    return st.isEmpty();
}`,
      cpp: `bool isValid(string s) {
    stack<char> st;
    for (char c : s) {
        if (c=='('||c=='['||c=='{') st.push(c);
        else { if (st.empty()||!match(st.top(),c)) return false; st.pop(); }
    }
    return st.empty();
}`,
      pseudocode: `stack = []
for c in s:
  if c in "([{": stack.push(c)
  elif stack.empty() or stack.pop() != match(c): return false
return stack.empty()`,
    },
    steps: (input) => validParentheses(input),
  },

  'bst-insert': {
    id: 'bst-insert', name: 'BST Insert', category: 'tree', difficulty: 'Easy',
    timeComplexity: 'O(log n) avg, O(n) worst', spaceComplexity: 'O(h)',
    description: 'Walk the tree, recurse left or right, drop a new leaf.',
    presets: {
      Standard: { input: [5, 3, 7, 2, 4, 6, 8], value: 1, label: 'Insert 1' },
      Larger: { input: [5, 3, 7, 2, 4, 6, 8], value: 9, label: 'Insert 9' },
    },
    code: {
      javascript: `function insert(node, v) {
  if (!node) return { val: v, left: null, right: null };
  if (v < node.val) node.left = insert(node.left, v);
  else if (v > node.val) node.right = insert(node.right, v);
  return node;
}`,
      python: `def insert(node, v):
    if not node: return Node(v)
    if v < node.val: node.left = insert(node.left, v)
    elif v > node.val: node.right = insert(node.right, v)
    return node`,
      java: `static TreeNode insert(TreeNode n, int v) {
    if (n == null) return new TreeNode(v);
    if (v < n.val) n.left = insert(n.left, v);
    else if (v > n.val) n.right = insert(n.right, v);
    return n;
}`,
      cpp: `TreeNode* insert(TreeNode* n, int v) {
    if (!n) return new TreeNode(v);
    if (v < n->val) n->left = insert(n->left, v);
    else if (v > n->val) n->right = insert(n->right, v);
    return n;
}`,
      pseudocode: `insert(node, v):
  if node == null: return new Node(v)
  if v < node.val: node.left = insert(node.left, v)
  if v > node.val: node.right = insert(node.right, v)
  return node`,
    },
    steps: (input, value) => bstInsert(input, value ?? 1),
  },

  'bfs-graph': {
    id: 'bfs-graph', name: 'BFS (Graph)', category: 'graph', difficulty: 'Easy',
    timeComplexity: 'O(V + E)', spaceComplexity: 'O(V)',
    description: 'Breadth-first traversal using a queue.',
    presets: {
      Standard: {
        input: {
          nodes: [{ id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }, { id: 'E' }],
          edges: [['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'E'], ['D', 'E']],
          source: 'A',
        },
        label: '5-node tree from A',
      },
    },
    code: {
      javascript: `function bfs(graph, source) {
  const visited = new Set([source]);
  const queue = [source];
  while (queue.length) {
    const u = queue.shift();
    for (const v of graph.neighbors(u)) {
      if (!visited.has(v)) { visited.add(v); queue.push(v); }
    }
  }
  return visited;
}`,
      python: `from collections import deque
def bfs(graph, s):
    visited = {s}; q = deque([s])
    while q:
        u = q.popleft()
        for v in graph.neighbors(u):
            if v not in visited: visited.add(v); q.append(v)
    return visited`,
      java: `static Set<String> bfs(Graph g, String s) {
    Set<String> vis = new HashSet<>(); vis.add(s);
    Deque<String> q = new ArrayDeque<>(); q.add(s);
    while (!q.isEmpty()) {
        String u = q.poll();
        for (String v : g.neighbors(u))
            if (vis.add(v)) q.add(v);
    }
    return vis;
}`,
      cpp: `set<string> bfs(Graph g, string s) {
    set<string> vis{s}; queue<string> q; q.push(s);
    while (!q.empty()) {
        string u = q.front(); q.pop();
        for (auto v : g.neighbors(u))
            if (!vis.count(v)) { vis.insert(v); q.push(v); }
    }
    return vis;
}`,
      pseudocode: `visited = {s}; queue = [s]
while queue not empty:
  u = queue.dequeue()
  for v in neighbors(u):
    if v not in visited: visited.add(v); queue.enqueue(v)
return visited`,
    },
    steps: (input) => bfsGraph(input),
  },
  'dijkstra': {
    id: 'dijkstra', name: 'Dijkstra', category: 'graph', difficulty: 'Hard',
    timeComplexity: 'O((V+E) log V)', spaceComplexity: 'O(V)',
    description: 'Single-source shortest paths with non-negative weights.',
    presets: {
      Standard: {
        input: {
          nodes: [{ id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }, { id: 'E' }],
          edges: [['A', 'B', 4], ['A', 'C', 2], ['C', 'B', 1], ['B', 'D', 5], ['C', 'D', 8], ['C', 'E', 10], ['D', 'E', 2]],
          source: 'A',
        },
        label: '5-node weighted graph from A',
      },
    },
    code: {
      javascript: `function dijkstra(graph, source) {
  const dist = {}; graph.nodes.forEach(n => dist[n] = Infinity);
  dist[source] = 0;
  const pq = [[0, source]];
  while (pq.length) {
    pq.sort((a,b)=>a[0]-b[0]);
    const [d, u] = pq.shift();
    if (d > dist[u]) continue;
    for (const [v, w] of graph.edges(u))
      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        pq.push([dist[v], v]);
      }
  }
  return dist;
}`,
      python: `import heapq
def dijkstra(graph, s):
    dist = {n: float('inf') for n in graph.nodes}
    dist[s] = 0
    pq = [(0, s)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]: continue
        for v, w in graph.edges(u):
            nd = d + w
            if nd < dist[v]: dist[v] = nd; heapq.heappush(pq, (nd, v))
    return dist`,
      java: `// use PriorityQueue<Pair<dist, node>>`,
      cpp: `// use priority_queue`,
      pseudocode: `dist[all] = Infinity; dist[s] = 0
pq = [(0, s)]
while pq not empty:
  (d, u) = pq.extract_min
  if d > dist[u]: continue
  for (v, w) in edges(u):
    if dist[u] + w < dist[v]:
      dist[v] = dist[u] + w
      pq.insert((dist[v], v))
return dist`,
    },
    steps: (input) => dijkstra(input),
  },

  'fibonacci-dp': {
    id: 'fibonacci-dp', name: 'Fibonacci (DP)', category: 'dp', difficulty: 'Easy',
    timeComplexity: 'O(n)', spaceComplexity: 'O(n)',
    description: 'Bottom-up tabulation of Fibonacci numbers.',
    presets: {
      Small: { input: 6, label: 'Fib(6)' },
      Medium: { input: 10, label: 'Fib(10)' },
    },
    code: {
      javascript: `function fib(n) {
  const dp = [0, 1];
  for (let i = 2; i <= n; i++) dp[i] = dp[i-1] + dp[i-2];
  return dp[n];
}`,
      python: `def fib(n):
    dp = [0, 1]
    for i in range(2, n+1): dp.append(dp[i-1] + dp[i-2])
    return dp[n]`,
      java: `static long fib(int n) {
    long[] dp = new long[Math.max(n+1, 2)];
    dp[0] = 0; dp[1] = 1;
    for (int i = 2; i <= n; i++) dp[i] = dp[i-1] + dp[i-2];
    return dp[n];
}`,
      cpp: `long long fib(int n) {
    vector<long long> dp(max(n+1, 2));
    dp[0]=0; dp[1]=1;
    for (int i=2;i<=n;i++) dp[i]=dp[i-1]+dp[i-2];
    return dp[n];
}`,
      pseudocode: `dp[0] = 0; dp[1] = 1
for i in 2..n:
  dp[i] = dp[i-1] + dp[i-2]
return dp[n]`,
    },
    steps: (input) => fibDp(input),
  },
  'coin-change': {
    id: 'coin-change', name: 'Coin Change', category: 'dp', difficulty: 'Medium',
    timeComplexity: 'O(n * amount)', spaceComplexity: 'O(amount)',
    description: 'Fewest coins to make an amount.',
    presets: {
      Standard: { input: { amount: 11, coins: [1, 2, 5] }, label: '11 with [1,2,5]' },
      Impossible: { input: { amount: 3, coins: [2] }, label: 'Impossible' },
    },
    code: {
      javascript: `function coinChange(coins, amount) {
  const dp = Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let i = 1; i <= amount; i++)
    for (const c of coins)
      if (i - c >= 0) dp[i] = Math.min(dp[i], dp[i - c] + 1);
  return dp[amount] === Infinity ? -1 : dp[amount];
}`,
      python: `def coin_change(coins, amount):
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    for i in range(1, amount + 1):
        for c in coins:
            if i - c >= 0: dp[i] = min(dp[i], dp[i-c] + 1)
    return -1 if dp[amount] == float('inf') else dp[amount]`,
      java: `// standard bottom-up DP`,
      cpp: `// standard bottom-up DP`,
      pseudocode: `dp[0] = 0; dp[i] = Infinity for i > 0
for i in 1..amount:
  for c in coins:
    if i - c >= 0: dp[i] = min(dp[i], dp[i-c] + 1)
return dp[amount] == Infinity ? -1 : dp[amount]`,
    },
    steps: (input) => coinChange(input),
  },
}

export const CATEGORIES = [
  { id: 'sorting', label: 'Sorting', icon: 'FaSortAmountDown' },
  { id: 'searching', label: 'Searching', icon: 'FaSearch' },
  { id: 'two-pointers', label: 'Two Pointers', icon: 'FaArrowsAltH' },
  { id: 'sliding-window', label: 'Sliding Window', icon: 'FaWindowMaximize' },
  { id: 'linked-list', label: 'Linked List', icon: 'FaLink' },
  { id: 'stack', label: 'Stack', icon: 'FaLayerGroup' },
  { id: 'tree', label: 'Tree', icon: 'FaTree' },
  { id: 'graph', label: 'Graph', icon: 'FaProjectDiagram' },
  { id: 'dp', label: 'Dynamic Programming', icon: 'FaCalculator' },
]

export function generateSteps(algoId, input) {
  const algo = ALGORITHMS[algoId]
  if (!algo) return []

  const id = algo.id
  if (id === 'binary-search' || id === 'linear-search') {
    return algo.steps(input.array ?? input, input.target)
  }
  if (id === 'two-sum-sorted') {
    return algo.steps(input.array ?? input, input.target)
  }
  if (id === 'sliding-window-max') {
    return algo.steps(input.array ?? input, input.k)
  }
  if (id === 'bst-insert') {
    return algo.steps(input.tree ?? input, input.value)
  }
  if (id === 'fibonacci-dp') {
    return algo.steps(typeof input === 'number' ? input : input.n)
  }
  if (id === 'coin-change') {
    return algo.steps(input)
  }
  return algo.steps(input)
}
